# Clue Circuit

An independent, beautifully animated word-clue game for team game nights. Built with vanilla JavaScript, Anime.js, and Motion. Runs entirely in your browser and on GitHub Pages. **No backend, accounts, analytics, runtime CDN requests, or multiplayer networking.**

## How your meeting works

1. The host opens the game, picks word packs, and enters team names, one spymaster per team, and operators. Names are optional. Click **Deal us in**.
2. Share only the host's board tab in your approved meeting app.
3. Open **Team links**. Privately send each spymaster their key link or a downloaded PNG key. Never screen-share a spymaster page.
4. The spymaster studies the hidden colors and says one word plus a number aloud (for example, “Space, three”). The host enters the spoken clue.
5. Operators discuss their guesses aloud. The host clicks a card and confirms the reveal. The game handles turns, guess allowances, scoring, and wins.

Operators can participate entirely in the meeting; they do not need to open the game. Optional operator links show an answer-free snapshot. Guests need no GitHub accounts and do not become GitHub repository collaborators or registered members.

**Links are snapshots, not live rooms.** They don't synchronize changes, report presence, or check people into a shared roster. Host-entered membership lives on the host device. Spymasters may click their private key cards to cross them off locally as the host reveals them. Existing invitations keep their original roster and board; send new links after a new board or roster change. Both spymasters see the full color key.

## Features

- Halloween (default), high-tech, and winter holiday themes, switchable during play.
- Anime.js staggered deals, atmospheric details, and celebrations; Motion spring hover, card flips, and dialog transitions.
- Respects the system reduced-motion setting; a visible toggle also reduces animation.
- Six original word collections, 300–354 unique entries each. Combine packs; cross-pack duplicates are removed.
- Custom words and short phrases, comma/semicolon/newline separated. Append to selected packs or replace them. Minimum 25 unique entries; 24 characters each; maximum 5,000 entries.
- Host-managed teams, spymaster and operator names, private key links, and downloaded PNG keys.
- One-word clues, counts 1–9, count-plus-one guess allowance, turn passing, trap loss, and team wins.
- Undo (up to 40 actions), local game resume, mission log, and screen-sharing focus mode.
- Responsive layouts and keyboard-accessible controls with confirmation before revealing a card.

| Collection | Entries |
| --- | ---: |
| Beautifully ordinary | 354 |
| Midnight mischief | 300 |
| Nerds after dark | 330 |
| Snack intelligence | 300 |
| Out of office | 300 |
| Merry little mysteries | 310 |

## Publish on GitHub Pages

Create a public repository named `clue-circuit` under `jsc1100` and upload this repository's contents. Then:

1. Open **Settings → Pages**.
2. Choose **Deploy from a branch**.
3. Select **main** and **/docs**, then save.
4. After deployment, visit `https://jsc1100.github.io/clue-circuit/`.

No build step or package installation is needed. All assets, including both animation libraries, are committed in `docs/`. Relative asset paths support repository subdirectories. If you use a different repository name, use the corresponding Pages address.

## Run locally

With Node.js 22 or newer:

```sh
npm start
```

Open `http://localhost:3000`. This is just a static file server bound to your own machine; it is **not** a multiplayer backend. No `npm install` is required. Alternatively, serve `docs/` with any approved static server.

The standalone `play-offline.html` release file can be opened directly without Node or a server. It contains all code, styles, word packs, and animation libraries.

Localhost links won't work for remote teammates. When hosting locally, the **Team links** dialog lets you specify the published GitHub Pages URL; private invitations contain their own board data. Until the Pages site is published, download the spymaster key PNGs and send those privately instead.

## Privacy and limitations

- Unrevealed answers are removed from operator invitation payloads. Changing an operator link to claim a spymaster role cannot recover missing colors.
- Spymaster invitations are capability links: anyone who has the link sees the answers. They are not passwords or authenticated accounts and cannot be revoked remotely. Deal a new board to invalidate the old key for future play.
- Invitations place board data in the URL fragment, which is not sent with the page HTTP request. Names included in those links are visible to recipients. Use nicknames if preferred.
- The host must hold all answers locally to adjudicate reveals. A determined host or anyone inspecting that host's browser storage can see them; this is an honor-system party game.
- Host state and preferences use localStorage. Guest key marks are also local. Clearing site data removes them. No personal data is committed to the repository or sent to a game backend. GitHub still serves and logs normal website requests.
- Same-origin tabs are **not** a supported shared controller. Keep one host tab per game; opening another host tab can overwrite its saved state.
- Operator snapshots and key counters don't track live progress. Watch the host's shared screen.
- Counts zero and unlimited, automatic clue validity judgments, online membership, and live multiplayer are intentionally not implemented.

## Development and tests

```sh
npm test
node scripts/build-offline.mjs
```

Edit `docs/app.mjs` for the interface, `docs/engine.mjs` for rules/invite serialization, `docs/packs.mjs` for themed collections, and `docs/style.css` for themes. `docs/data/everyday.mjs` contains the general word collection. No transpilation is necessary.

All 12 unit tests pass, covering pack sizes, random board invariants, custom input, turn rules, trap/win outcomes, and answer isolation in invitations. JavaScript syntax is also checked for the standalone build. Visual browser verification remains pending: the execution environment blocked the local browser preview and browser installation. Guest views, undo, persistence, themes, mobile layout, and external request behavior should be reviewed in your browser before game night.

## License and attribution

Original application code and word lists are MIT-licensed. See `LICENSE`. Third-party animation code retains its own MIT notices in `docs/vendor/` and provenance in `THIRD_PARTY.md`.

Clue Circuit is an independently named word-clue game, inspired by the general team word-association format. It does not copy the official Codenames source, branding, art, rulebook text, or word deck. It is not affiliated with Czech Games Edition. The application license does not grant rights to third-party trademarks.
