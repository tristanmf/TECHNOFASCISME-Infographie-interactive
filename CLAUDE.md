# TECHNOFASCISME — Infographie interactive

Site statique (HTML/CSS/JS vanilla, sans build) de Tristan Mendès France : cartographie du
technofascisme (oligarchie tech + doctrines anti-démocratiques + capture d'État).
Déployé sur tristan.pro. Dernière mise à jour du contenu : **septembre 2026**.

## Structure

```
index.html              accueil : réseau de pouvoir, chronologie 2025-2026, 8 chiffres, chapitres, bibliothèque
pages/origines.html     01 · généalogie du concept (1930 → 2026), concepts voisins, racines de Stanford
pages/figures.html      02 · 8 fiches (Musk, Thiel, Andreessen, Yarvin, Vance, Karp, Sacks, Srinivasan)
pages/infrastructure.html 03 · 6 secteurs, cas Palantir, bilan chiffré du DOGE
pages/ideologies.html   04 · 6 courants, « le point commun », les idées à l'épreuve du pouvoir
pages/democraties.html  05 · 7 vecteurs d'érosion, tableau de bord de 6 indicateurs, contre-pouvoirs
css/style.css           design system (tokens en tête) + composants ; section « V3 » en fin de fichier
js/main.js              nav, modales, compteurs, réseau canvas, glossaire, filtres, frise, barres
```

Pas de dépendances, pas de framework, pas de build : ouvrir `index.html` suffit.
Vérification rapide : `node --check js/main.js`.

## État (sept. 2026)

Refonte v3 terminée et publiée sur la branche `claude/improve-infographic-ux-zrh7S`
(commits `adbe698` → `20bd1eb`). **Non fusionnée dans `main`** : le site en ligne montre
encore l'ancienne version tant que la branche n'est pas mergée.

Ce que contient la v3 :
- Textes réécrits et resserrés (≤ 40 mots par carte), sections « méta » supprimées.
- Actualité intégrée jusqu'au 1er sept. 2026 (départ de Musk du gouvernement, dissolution du
  DOGE, fusion SpaceX-xAI et IPO, Palantir/Army 10 Mds$, amende DSA, décret de préemption
  IA, 287(g), Antéchrist de Thiel, midterms…), chaque jalon avec sa source.
- Réseau de pouvoir : 19 nœuds, 33 liens typés (argent / contrats / pouvoir / idées /
  régulation), parcours guidé en 6 étapes, filtres, taille par centralité, info-bulle.
- Fiches figures avec filtres par rôle, badge de statut 2026, encadré « ce qui a changé ».
- Tableau de bord d'indicateurs publics (remplace les jauges à pourcentages inventés).
- Glossaire interactif : 21 entrées (`GLOSSARY` dans `js/main.js`).

## Décisions prises

- **Le mot « technofascisme » est une hypothèse de travail**, pas une étiquette : le site
  documente des faits (contrats, dons, décrets, citations) et leurs continuités. Aucun acteur
  n'est présenté comme se réclamant du fascisme. Garder cette ligne.
- **Un chiffre = une source.** Les chiffres ont un `data-source` (cartes stat) ou un lien
  (frise, KPI). Ne pas ajouter de chiffre sans source. Les faits reposant sur une source
  unique sont formulés prudemment (« selon les relevés compilés par la presse »).
- **Pas de jauges arbitraires** : les anciennes barres « risque 88 % » ont été supprimées ;
  seuls des ratios réels sont affichés (39 États / 50, 99 sénateurs / 100…).
- Citation attribuée à Levitsky introuvable → remplacée par une paraphrase sourcée
  (Levitsky & Way, Foreign Affairs, fév. 2025). Ne pas réintroduire de citations non vérifiées.
- Corrections factuelles à conserver : Palantir fondé en **2003** ; Barbrook & Cameron 1995 ;
  David Starr Jordan (pas Leland Stanford) pour l'eugénisme à Stanford ; Gorz « années 1970 ».
- Branding « Perplexity Computer » retiré (commentaires ASCII, meta, footer). À remettre
  seulement si l'auteur le demande.
- Identité visuelle conservée (noir / rouge #c8102e / cyan #00d4ff, Space Grotesk +
  JetBrains Mono). Les nouveaux composants réutilisent les tokens `--color-*`, `--space-*`.
- Compteurs formatés en français (`toLocaleString('fr-FR')`, attribut `data-decimals`).
- Le réseau démarre **sans sélection** pour que la carte se lise au repos par ses couleurs.

## Conventions de code

- Modales : `onclick="ModalSystem.open('x')"` ↔ `id="modal-x"`. Vérifier la correspondance.
- Glossaire : `<span class="gl-term" data-term="clé" tabindex="0">` ; la clé doit exister dans
  `GLOSSARY`.
- Filtres : `.filter-bar[data-filter-scope="s"]` + `.filter-chip[data-filter]` ;
  cibles `[data-filter-target="s"][data-tags="a b"]`.
- Réseau : nœuds et liens dans `initNetworkCanvas` (`nodes`, `edges` avec `type` parmi
  `argent | contrat | politique | idees | regulation`) ; parcours dans `TOUR` (les arêtes citées
  doivent exister dans `edges`).
- Barres animées : `.kpi-bar[data-width]` ou `.risk-bar-fill[data-width]`.
- Contrôle statique utile (à lancer avant de pousser) : ids de modales, clés de glossaire,
  équilibre des `<div>`, cohérence nœuds/arêtes/parcours — voir l'historique de session ou
  refaire un petit script Python.

## Reste à faire

1. **Contrôle visuel** sur desktop et mobile (aucun navigateur n'était disponible pendant la
   refonte) : frise horizontale, fiches, réseau (libellés courts sur petits nœuds, boutons du
   parcours sous la carte sur mobile).
2. **Fusionner la branche dans `main`** puis déployer.
3. Relire les faits à source unique avant diffusion large : a16z « premier donateur 2026 »,
   fortune de Musk > 1 000 Mds$, dépenses fédérales Palantir 2026.
4. Après les midterms du 3 nov. 2026 : mettre à jour le KPI « 84 % » (démocraties.html), la
   dernière carte de la frise (index.html) et la fiche Andreessen.
5. Idées non retenues pour l'instant : filtre temporel sur le réseau, export image de la carte,
   version anglaise.

## Notes d'environnement

- Le push git direct peut échouer dans l'environnement Claude Code (pas d'identifiants) ; les
  fichiers ont alors été publiés via l'API GitHub (`create_or_update_file`), un commit par
  fichier, puis la branche locale réalignée avec `git reset --hard origin/<branche>`.
  Toujours vérifier `git hash-object <fichier>` = SHA du blob distant après un push API.
