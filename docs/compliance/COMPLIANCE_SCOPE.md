# MediAI Care — Périmètre de conformité (posture honnête)

> Projet de **mémoire de Master** en informatique biomédicale. **Prototype académique,
> NON destiné à un usage clinique.** Phase 5.

## Ce que le projet N'EST PAS
- **Pas un dispositif médical certifié.** Aucune certification : **MDR** (UE 2017/745),
  **IEC 62304**, **ISO 13485**, **HDS** (hébergement de données de santé), **RGPD opérationnel**.
- Pas de validation clinique, pas d'étude prospective, pas de marquage CE.
- Pas de données de patients réels (voir `SYNTHETIC_DATA_POLICY.md`).

## Ce que le projet EST
- Une **démonstration d'architecture** : IoMT (séries temporelles) + ML prédictif + XAI,
  exposée via une API sécurisée, en posture **open-loop stricte**.
- Un **support de recherche** sur l'explicabilité et l'aide à la décision, à valider
  ultérieurement dans un cadre réglementaire si jamais poursuivi.

## Garde-fous structurels (« safety by design » académique)
| Principe | Mise en œuvre |
|---|---|
| **Open-loop strict** | L'API ne renvoie que des probabilités/suggestions ; aucune dose/décision/action automatique. |
| **Validation humaine** | Toute recommandation naît `pending` et exige une validation clinicien. |
| **XAI ≠ causalité** | L'explicabilité est un support d'affichage/audit ; `clinical_justification_allowed` jamais `true`. |
| **Données synthétiques** | `is_synthetic=True` sur tout enregistrement ; aucune donnée réelle. |
| **Traçabilité** | Audit append-only chaîné (SHA-256) de toutes les écritures/inférences/décisions. |
| **RBAC + ownership** | Contrôle serveur systématique, deny-by-default. |

## Écarts assumés vs un dispositif certifié (non exhaustif)
- Pas de système de management de la qualité (ISO 13485) ni de cycle de vie logiciel certifié (IEC 62304).
- Pas d'analyse de risque formelle ISO 14971 opposable.
- Pas d'hébergement HDS ; environnement de développement uniquement.
- RGPD non opérationnalisé (registre, DPIA, droits des personnes) — sans objet car données synthétiques.
- Rate limiting par IP (et non par utilisateur authentifié derrière proxy de confiance).

## Si le projet était poursuivi vers un usage réel
Étapes nécessaires (hors périmètre actuel) : qualification réglementaire (classe MDR),
SMQ ISO 13485, dossier IEC 62304, gestion des risques ISO 14971, validation clinique,
hébergement HDS, conformité RGPD opérationnelle, étude utilisateur IRB-compliant.

Voir aussi `MedAICare_V.3_10Patients/LIMITATIONS.md`.
