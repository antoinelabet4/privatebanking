# privatebanking
Sia Private Banking Agent
=========================

Application statique HTML + React via CDN, sans build step ni serveur applicatif.
Elle reste compatible GitHub Pages : ouvrir `index.html`, `Privatebanking.html` ou
`Privatebanking` charge le même shell et les fichiers JavaScript dans `src/`.

Architecture
------------

- `index.html` : shell HTML, CDN React/ReactDOM/Babel et ordre de chargement des scripts.
- `Privatebanking.html` / `Privatebanking` : shells miroirs conservés pour compatibilité.
- `src/styles.css` : styles globaux, police et branding Sia.
- `src/config.js` : prompts, configurations PEA/CTO/Assurance Vie et constantes de portefeuille.
- `src/data/defaultData.js` : données de démonstration.
- `src/data/translations.js` : libellés FR/EN et helper de traduction.
- `src/services/storageService.js` : compatibilité `window.storage`, lecture/écriture JSON.
- `src/services/portfolioCalculations.js` : PRU, quantités, P&L, immobilier, formatage.
- `src/services/reportingService.js` : agrégations, intelligence conseiller et métriques privées.
- `src/services/webSearchService.js` : web search et récupération indicative de données marché.
- `src/components/` : logo, chat, graphiques, widgets dashboard, info buttons.
- `src/tabs/` : un point d’entrée par module visible de l’application.

Notes de migration
------------------

Ce refactor est conçu pour préserver le comportement existant. Les clés
`localStorage`, les calculs, le branding, les intégrations web search et les
modules fonctionnels ont été conservés. Le code a été déplacé par blocs depuis
l’ancien fichier monolithique afin de faciliter les évolutions futures sans
introduire Vite, Webpack, npm, TypeScript ou backend.
