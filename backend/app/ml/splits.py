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
    # Coupes alignées sur les frontières de timestamps : un instant `at` donné
    # (potentiellement partagé par plusieurs patients) appartient ENTIÈREMENT à un
    # seul split -> aucun timestamp ne peut fuir d'un split vers un autre.
    i_train = _advance_to_boundary(ordered, int(n * fractions[0]), time_col)
    i_val = _advance_to_boundary(ordered, i_train + int(n * fractions[1]), time_col)
    train = ordered.iloc[:i_train]
    val = ordered.iloc[i_train:i_val]
    test = ordered.iloc[i_val:]
    out = {"train": train, "val": val, "test": test}
    assert_temporal_disjoint(out, time_col=time_col)
    assert_no_timestamp_overlap(out, time_col=time_col)
    return out


def _advance_to_boundary(ordered: pd.DataFrame, idx: int, time_col: str) -> int:
    """Avance `idx` jusqu'à la fin du groupe de timestamps identiques.

    Tous les échantillons partageant le timestamp-frontière sont rattachés au split
    le plus ancien, garantissant qu'un même instant ne soit jamais coupé en deux.
    """
    n = len(ordered)
    if idx <= 0 or idx >= n:
        return idx
    boundary = ordered.iloc[idx - 1][time_col]
    while idx < n and ordered.iloc[idx][time_col] == boundary:
        idx += 1
    return idx


def assert_no_timestamp_overlap(
    splits: dict[str, pd.DataFrame], *, time_col: str = "at"
) -> None:
    """Garantit qu'aucune valeur de timestamp n'apparaît dans deux splits."""
    sets = {
        name: set(part[time_col].tolist())
        for name, part in splits.items()
        if part is not None and not part.empty
    }
    names = list(sets)
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            inter = sets[names[i]] & sets[names[j]]
            if inter:
                raise SplitError(
                    f"Fuite temporelle : {len(inter)} timestamp(s) partagé(s) "
                    f"entre {names[i]} et {names[j]}."
                )


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
