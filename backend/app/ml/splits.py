"""Splits temporels (train / val / test) — anti-leakage strict.

On ne fait JAMAIS de split aléatoire : ce serait une fuite temporelle (des
instants futurs se retrouveraient dans l'entraînement). Le split est purement
chronologique sur la colonne `at` : train = passé le plus ancien, test = futur
le plus récent. Une garde vérifie la disjonction temporelle des bornes.
"""
from __future__ import annotations

import pandas as pd

from app.ml.config import SPLIT_FRACTIONS


class SplitError(Exception):
    pass


def temporal_split(
    df: pd.DataFrame,
    *,
    time_col: str = "at",
    fractions: tuple[float, float, float] = SPLIT_FRACTIONS,
) -> dict[str, pd.DataFrame]:
    """Découpe `df` chronologiquement en train/val/test selon `fractions`.

    Le découpage se fait sur les quantiles temporels GLOBAUX (tous patients
    confondus) afin qu'aucun instant de validation/test ne soit antérieur à un
    instant d'entraînement.
    """
    if abs(sum(fractions) - 1.0) > 1e-9:
        raise SplitError(f"Les fractions doivent sommer à 1.0 (reçu {fractions}).")
    if df.empty:
        raise SplitError("Dataset vide : split impossible.")

    ordered = df.sort_values(time_col, kind="mergesort").reset_index(drop=True)
    n = len(ordered)
    n_train = int(n * fractions[0])
    n_val = int(n * fractions[1])
    # Le reste va au test pour absorber les arrondis.
    train = ordered.iloc[:n_train]
    val = ordered.iloc[n_train : n_train + n_val]
    test = ordered.iloc[n_train + n_val :]
    out = {"train": train, "val": val, "test": test}
    assert_temporal_disjoint(out, time_col=time_col)
    return out


def assert_temporal_disjoint(
    splits: dict[str, pd.DataFrame], *, time_col: str = "at"
) -> None:
    """Garde anti-leakage : max(train.at) <= min(val.at) <= ... pour chaque frontière.

    Tolère les ensembles vides (jeux très petits) sans lever d'erreur.
    """
    order = ["train", "val", "test"]
    prev_max = None
    prev_name = None
    for name in order:
        part = splits.get(name)
        if part is None or part.empty:
            continue
        cur_min = part[time_col].min()
        cur_max = part[time_col].max()
        if prev_max is not None and cur_min < prev_max:
            raise SplitError(
                f"Fuite temporelle : min({name})={cur_min} < max({prev_name})={prev_max}."
            )
        prev_max = cur_max
        prev_name = name
