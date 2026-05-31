"""Phase 2 — Modélisation IA/ML (option 2) du socle MediAI Care.

POSTURE NON NÉGOCIABLE (rappel, voir docs/migration/PHASE_2_MODELISATION_ML.md) :
- DONNÉES SIMULÉES UNIQUEMENT (`is_synthetic=True`) — aucune donnée réelle.
- OPEN-LOOP STRICT : ce module produit des PROBABILITÉS / SCORES de risque
  uniquement. AUCUNE décision thérapeutique automatique, aucune prescription,
  aucun ajustement de dose. La validation clinique reste humaine.
- ANTI-LEAKAGE STRICT : les features à l'instant T n'utilisent que `ts <= T`
  (réutilisation des fonctions pures de `app.services.feature_engineering`).
  Les labels regardent le futur (T, T+h] UNIQUEMENT pour la vérité terrain et
  ne sont JAMAIS utilisés comme feature.
- AUCUNE MÉTRIQUE INVENTÉE : on calcule la métrique réelle ou on renvoie
  « non calculable » (ex. classe absente du jeu de test).
- PAS DE XAI CLINIQUE AVANCÉ ICI (SHAP/LIME → Phase 3). EBM fournit une
  intelligibilité native (modèle « glassbox »), pas une explication par patient.

Ce paquet n'est pas certifié et n'est pas destiné à un usage clinique.
"""
