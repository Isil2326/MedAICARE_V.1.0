"""Moteur de recommandation OPEN-LOOP (Phase 4).

Génère des SUGGESTIONS non prescriptives, explicables, traçables et soumises à
validation clinicien. JAMAIS de dose, de décision thérapeutique automatique ni
d'action clinique autonome. Données 100 % synthétiques (`is_synthetic=True`). La
XAI est un SUPPORT d'affichage/audit, jamais la condition principale de décision ;
une explication `not_reliable_for_clinical_interpretation` n'est pas utilisée comme
justification clinique.
"""
