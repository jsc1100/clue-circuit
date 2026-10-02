# Third-party animation libraries

Both libraries are vendored locally; browsers never fetch a CDN.

## Anime.js

- Project: https://animejs.com / https://github.com/juliangarnier/anime
- Bundle header identifies version **4.5.0**.
- Source file: `dist/bundles/anime.umd.min.js` in the official repository.
- Exact upstream Git blob SHA is recorded in `docs/vendor/provenance.json`.
- License: MIT, full notice in `docs/vendor/ANIME-LICENSE.md`; bundle retains its own copyright header.

## Motion

- Project: https://motion.dev / https://github.com/motiondivision/motion
- Browser UMD distribution, including `Motion.animate` and `Motion.hover`.
- Retrieved from Elementor's vendored distribution at commit `d82b5ccd2091c21af3bb248878a494bd94989627`, file `assets/lib/motion/motion.js`.
- Source: https://github.com/elementor/elementor/blob/d82b5ccd2091c21af3bb248878a494bd94989627/assets/lib/motion/motion.js
- The bundle does not declare a package version; it is pinned to the above upstream snapshot and the blob SHA in the provenance manifest. No Elementor application code is included.
- License: Motion MIT notice in `docs/vendor/MOTION-LICENSE.md`.

No Motion+ paid components or examples are included. Interface code and animation choreography were authored independently.
