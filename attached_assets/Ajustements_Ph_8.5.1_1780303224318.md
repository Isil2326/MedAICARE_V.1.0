La Phase 8.5 n’est pas validée en l’état.



Problèmes constatés :



1\. Je ne vois aucun changement visible dans l’application.

2\. Replit indique que la commande de test renvoie un code 1, même si les 79 tests passent.

3\. Un code de sortie 1 n’est pas acceptable pour une phase de validation.

4\. Il est possible que le preview Replit affiche encore l’ancienne application web ou un mauvais workflow/port, au lieu de l’application mobile Expo modifiée.



Je suspends donc la Phase 9.



Merci de lancer une correction immédiate :



**PHASE 8.5.1 — Correction visibilité UI, workflow Replit et stabilité tests**



Objectif :

Rendre les changements UI réellement visibles dans Replit, vérifier que le bon frontend est servi, et corriger le code de sortie Jest pour que la commande de test retourne 0.



Contraintes :

\- Ne pas modifier le backend métier.

\- Ne pas modifier ML/XAI.

\- Ne pas modifier les recommandations.

\- Ne pas modifier les seuils.

\- Ne pas introduire de données réelles.

\- Ne pas ajouter de dose ou de décision automatique.

\- Ne pas contourner la sécurité token.

\- Ne pas démarrer Phase 9.



Actions obligatoires :



\## 1. Vérifier quel frontend est réellement affiché



Diagnostiquer clairement :



\- quel workflow Replit est lancé ;

\- quel port est exposé dans le preview ;

\- si le preview affiche :

&#x20; - l’ancienne app React web ;

&#x20; - l’app Expo Web ;

&#x20; - ou un autre serveur ;

\- si les fichiers modifiés dans `mobile/src/...` sont réellement importés par les routes affichées.



Livrable :

\- expliquer précisément pourquoi je ne vois aucun changement.



\## 2. Corriger le workflow Replit Mobile



S’assurer que le workflow mobile lance bien l’application Expo modifiée.



Vérifier / corriger :



\- `.replit`;

\- workflow “Mobile App” ;

\- port exposé ;

\- commande de démarrage ;

\- working directory ;

\- variable `EXPO\_PUBLIC\_API\_BASE\_URL`;

\- CORS backend.



Commande attendue, à adapter si nécessaire :



```bash

cd mobile \&\& npx expo start --web --port 5173 --clear

```



ou toute commande équivalente qui sert réellement l’app Expo Web modifiée.



Si le preview Replit principal affiche encore l’ancienne app React port 5000, le documenter clairement et indiquer comment ouvrir le preview mobile.



\## 3. Ajouter un marqueur visuel temporaire ou permanent de version UI



Ajouter dans l’app mobile un indicateur visible mais propre, par exemple dans le profil ou le footer :



\- `MediAI Care Mobile · UI Phase 8.5`

\- ou `v8.5 UI polish`



Objectif :

permettre de vérifier immédiatement que le bon frontend est chargé.



Ce marqueur doit être sobre, non intrusif, compatible avec la soutenance.



\## 4. Vérifier que les nouveaux composants sont réellement utilisés



Confirmer que les écrans affichés utilisent bien :



\- `Header`;

\- `MetricCard`;

\- `PatientCard`;

\- `ClinicianActionBar`;

\- `SelectChip`;

\- `ComplianceBanner`;

\- `CgmChart` refondu ;

\- `RecommendationCard` refondue ;

\- `XaiWarningBox` refondue.



Si certains composants ont été créés mais ne sont pas réellement utilisés dans les routes, les intégrer.



\## 5. Forcer un rebuild / clear cache



Nettoyer les caches pertinents :



```bash

cd mobile \&\& npx expo start --web --clear

```



Si nécessaire :



```bash

cd mobile \&\& rm -rf .expo

cd mobile \&\& npx expo start --web --clear

```



Ne pas supprimer de fichiers métier.



\## 6. Corriger le code de sortie Jest



Le fait que les tests passent mais que la commande retourne 1 n’est pas acceptable.



Corriger proprement l’avertissement :



`Cannot log after tests are done`

`ExpoModulesCoreJSLogger`



Exigence :

\- `cd mobile \&\& npx jest --ci --runInBand` doit retourner `exit code 0`.

\- Ne pas affaiblir le test `no-token-leak`.

\- Ne pas mocker globalement `expo-secure-store` d’une manière qui casse la sécurité du test.

\- Si un mock ciblé est nécessaire, il doit être limité au logger Expo problématique.

\- Documenter la correction.



Alternative acceptable :

\- créer une commande de test CI dédiée qui retourne 0 proprement, par exemple :

&#x20; - `npm run test:ci`

\- mais elle doit vraiment exécuter les tests et ne pas masquer des échecs.



\## 7. Vérifier les commandes finales



Les commandes suivantes doivent être exécutées et retourner un résultat clair :



```bash

cd mobile \&\& npx tsc --noEmit

cd mobile \&\& npx jest --ci --runInBand

cd backend \&\& python scripts/validate\_backend.py

```



Résultat attendu :

\- TypeScript : exit code 0 ;

\- Jest : exit code 0 ;

\- Backend smoke : OK.



\## 8. Produire une preuve visuelle



Fournir au moins une preuve que l’UI a changé :



Option A :

\- captures d’écran si Replit le permet.



Option B :

\- description précise de ce qui est visible dans le preview :

&#x20; - écran login ;

&#x20; - patient home ;

&#x20; - données CGM ;

&#x20; - écran risque ;

&#x20; - XAI ;

&#x20; - recommandations ;

&#x20; - clinicien patients ;

&#x20; - clinicien recommandations.



Mais je veux surtout savoir exactement quelle URL/quel port ouvrir pour voir l’app modifiée.



\## 9. Rapport attendu Phase 8.5.1



Fournir un court rapport avec :



1\. cause du problème “aucun changement visible” ;

2\. workflow/port corrigé ;

3\. fichiers modifiés ;

4\. marqueur visuel ajouté ;

5\. composants réellement intégrés ;

6\. correction Jest ;

7\. commandes exécutées ;

8\. codes de sortie ;

9\. preuve que l’UI Phase 8.5 est visible ;

10\. confirmation qu’aucune logique métier n’a été modifiée.



**Ajout important au cadrage produit :**



L’application web initiale ne doit plus être considérée comme le point d’accès principal patient/clinicien.



Dans la version cible post-migration :



1\. Le WEB doit devenir une plateforme web institutionnelle / portail de présentation.

2\. Le MOBILE doit devenir l’application principale pour les espaces patient et clinicien.

3\. Le web ne doit plus être une landing page centrée sur login patient/clinicien comme dans le prototype initial.

4\. Le web doit servir à présenter MediAI Care, expliquer le projet, afficher les limites, documenter la posture non certifiée, et permettre de télécharger / ouvrir l’application mobile.

5\. L’app mobile doit contenir les vraies interfaces patient et clinicien, propres, modernes et séparées par rôle.



Merci d’intégrer cette correction dans la Phase 8.5.1.



PHASE 8.5.1 — Correction visibilité UI, workflow Replit, stabilité tests ET recadrage web/mobile



Objectif étendu :

\- rendre les changements UI mobile réellement visibles ;

\- corriger le workflow Replit ;

\- corriger le code de sortie Jest ;

\- clarifier la séparation produit entre portail web et application mobile ;

\- éviter que l’ancienne app web soit encore perçue comme l’application principale.



\## A. Recadrage produit web/mobile



\### 1. Nouveau rôle du web



Le web doit devenir :



\- une plateforme institutionnelle ;

\- une page de présentation du projet ;

\- un portail de téléchargement / accès mobile ;

\- un support de soutenance ;

\- un espace d’information sur :

&#x20; - objectif du projet ;

&#x20; - données synthétiques ;

&#x20; - open-loop ;

&#x20; - non-certification ;

&#x20; - limites ;

&#x20; - sécurité ;

&#x20; - architecture ;

&#x20; - téléchargement mobile ;

&#x20; - QR ou lien Expo si disponible.



Le web ne doit plus être présenté comme l’espace principal patient/clinicien.



\### 2. Nouveau rôle du mobile



Le mobile devient l’application principale :



\- interface patient ;

\- interface clinicien ;

\- login patient/clinicien ;

\- dashboards ;

\- données ;

\- ML ;

\- XAI ;

\- recommandations ;

\- validation clinicien.



La séparation des rôles doit être claire dans l’app mobile.



\### 3. Web : actions attendues



Créer ou modifier le web pour qu’il affiche :



\- Hero moderne MediAI Care ;

\- proposition de valeur ;

\- statut : prototype académique non certifié ;

\- badges :

&#x20; - données synthétiques ;

&#x20; - open-loop ;

&#x20; - XAI support-only ;

&#x20; - non usage clinique ;

\- section “Application mobile” ;

\- boutons :

&#x20; - “Ouvrir l’app mobile”

&#x20; - “Télécharger / installer l’app”

&#x20; - “Scanner le QR Expo” si pertinent ;

\- section “Espace patient” : expliquer que l’accès se fait depuis mobile ;

\- section “Espace clinicien” : expliquer que l’accès se fait depuis mobile ;

\- section “Architecture \& sécurité” ;

\- section “Limites” ;

\- section “Documentation / Soutenance” ;

\- footer.



Important :

\- si des boutons login patient/clinicien restent sur le web, ils doivent être secondaires ou marqués “ancienne démo web / legacy” si conservés ;

\- préférence : ne pas garder de login principal web ;

\- ne pas casser le backend ;

\- ne pas supprimer l’app web si elle est encore utile à la soutenance, mais la requalifier comme portail.



\### 4. Mobile : actions attendues



Vérifier que l’app mobile contient bien :



\- écran login propre ;

\- redirection par rôle ;

\- espace patient ;

\- espace clinicien ;

\- interfaces distinctes ;

\- design moderne visible ;

\- marqueur UI Phase 8.5 ;

\- disclaimers ;

\- pas de confusion avec l’ancienne landing web.



\### 5. Replit preview



Clarifier dans `replit.md` :



\- quel port affiche le portail web ;

\- quel port affiche l’app mobile Expo Web ;

\- comment ouvrir chaque preview ;

\- quel workflow lancer pour :

&#x20; - Backend API ;

&#x20; - Web Portal ;

&#x20; - Mobile App.



Si le preview Replit principal pointe vers l’ancien web, il faut :

\- soit le transformer en portail web ;

\- soit documenter que le preview mobile est sur un autre port ;

\- soit ajuster `.replit` pour que l’utilisateur voie clairement le bon rendu attendu.



\## B. Design attendu du portail web



Le portail web doit être moderne et cohérent avec le design mobile Phase 8.5 :



\- style medtech premium ;

\- responsive ;

\- rapide ;

\- clair ;

\- rassurant ;

\- sans surcharge marketing mensongère ;

\- aucune promesse clinique ;

\- aucune statistique non prouvée ;

\- aucune phrase “validé cliniquement” ;

\- aucune confusion avec dispositif médical certifié.



Sections recommandées :



1\. Hero :

&#x20;  - “MediAI Care”

&#x20;  - “Prototype académique IoMT + IA explicable pour le suivi du diabète”

&#x20;  - badges : Synthétique / Open-loop / Non certifié

&#x20;  - CTA : Ouvrir l’app mobile



2\. Application mobile :

&#x20;  - Patient

&#x20;  - Clinicien

&#x20;  - QR / lien Expo / instructions



3\. Ce que démontre le prototype :

&#x20;  - backend sécurisé ;

&#x20;  - pipeline temporel ;

&#x20;  - ML synthétique ;

&#x20;  - XAI ;

&#x20;  - recommandations open-loop ;

&#x20;  - mobile sécurisé.



4\. Limites :

&#x20;  - pas usage clinique ;

&#x20;  - pas données réelles ;

&#x20;  - pas dispositif médical ;

&#x20;  - pas validation clinique ;

&#x20;  - performances non transférables.



5\. Architecture :

&#x20;  - schéma simple ;

&#x20;  - API source de vérité ;

&#x20;  - sécurité ;

&#x20;  - audit.



6\. Documentation :

&#x20;  - liens vers rapports docs si pertinents.



\## C. Documentation à mettre à jour



Mettre à jour :



\- `replit.md`

\- `docs/mobile/PHASE\_6\_MOBILE\_APP.md` si nécessaire

\- `docs/mobile/PHASE\_8\_5\_UI\_UX\_POLISH.md`

\- `docs/demo/E2E\_DEMO\_SCRIPT.md`

\- `docs/demo/SOUTENANCE\_SCENARIO.md`

\- créer si nécessaire :

&#x20; - `docs/web/WEB\_PORTAL\_STRATEGY.md`



\## D. Tests / validations



Ajouter ou adapter tests si possible :



\- le portail web n’affiche plus le login patient/clinicien comme action principale ;

\- le portail affiche les disclaimers ;

\- le portail affiche CTA mobile ;

\- le mobile garde son login ;

\- le mobile sépare patient/clinicien ;

\- aucun texte web ne prétend certification ou usage clinique ;

\- pas de token web legacy si portail public.



Si tests web difficiles, fournir checklist manuelle.



\## E. Livrable attendu



Dans le rapport Phase 8.5.1, inclure :



1\. cause du problème de visibilité UI ;

2\. correction workflow/ports ;

3\. correction Jest ;

4\. séparation web/mobile clarifiée ;

5\. rôle final du web ;

6\. rôle final du mobile ;

7\. captures ou description du portail web ;

8\. captures ou description mobile ;

9\. fichiers modifiés ;

10\. tests exécutés ;

11\. confirmation :

&#x20;  - web = portail institutionnel ;

&#x20;  - mobile = app principale patient/clinicien ;

&#x20;  - backend = source de vérité ;

&#x20;  - open-loop strict ;

&#x20;  - données synthétiques ;

&#x20;  - non certifié ;

&#x20;  - aucune logique métier modifiée.



Ne pas démarrer Phase 9 tant que cette correction n’est pas validée.

```



La logique cible devient donc :



```text

WEB

= portail public / institutionnel / téléchargement / soutenance / documentation



MOBILE

= application réelle patient + clinicien



BACKEND

= source de vérité API / sécurité / ML / XAI / recommandations

