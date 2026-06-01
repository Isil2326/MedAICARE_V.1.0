"""Machine à états du workflow open-loop (validation humaine obligatoire).

Toute recommandation NAÎT `pending`. Un clinicien peut l'approuver, la rejeter ou
la modifier (puis l'approuver/rejeter). Aucune transition automatique vers
`approved` : la décision reste humaine. Les transitions invalides sont refusées.
"""
from __future__ import annotations

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "generated": {"pending"},
    "pending": {"approved", "rejected", "modified"},
    "modified": {"approved", "rejected"},
    "approved": set(),
    "rejected": set(),
}

# États depuis lesquels un arbitrage (approve/reject/modify) est encore possible.
REVIEWABLE_SOURCE: set[str] = {"pending", "modified"}


def can_transition(current: str, new: str) -> bool:
    return new in ALLOWED_TRANSITIONS.get(current, set())


def assert_transition(current: str, new: str) -> None:
    if not can_transition(current, new):
        raise ValueError(
            f"Transition interdite : {current!r} -> {new!r} (open-loop workflow)."
        )
