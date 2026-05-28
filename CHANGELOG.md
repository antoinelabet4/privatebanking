# Changelog

## Refactor modular architecture

- Replaced the monolithic `Privatebanking.html` runtime with a static shell that loads browser scripts from `src/`.
- Added `index.html` as the primary GitHub Pages entry point.
- Moved global CSS and Sia font/branding rules to `src/styles.css`.
- Moved storage helpers to `src/services/storageService.js`.
- Moved portfolio math and real-estate calculation helpers to `src/services/portfolioCalculations.js`.
- Moved reporting/advisor helper logic to `src/services/reportingService.js`.
- Moved live market and web search helpers to `src/services/webSearchService.js`.
- Moved FR/EN UI copy to `src/data/translations.js`.
- Moved demo data to `src/data/defaultData.js`.
- Moved shared UI pieces to `src/components/`.
- Moved visible product modules to `src/tabs/`, with PEA, CTO and Assurance Vie wrappers around the shared portfolio engine.
- Kept `Privatebanking` and `Privatebanking.html` as compatibility shells pointing at the same modular source files.

No user-facing behavior was intentionally changed.
