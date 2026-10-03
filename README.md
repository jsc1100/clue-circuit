# Clue Circuit

An independent, beautifully animated word-clue game for team game nights. Built with vanilla JavaScript, Anime.js, and Motion. Runs entirely in your browser and on GitHub Pages. **No backend, accounts, analytics, runtime CDN requests, or multiplayer networking.**

## How your meeting works

1. The host opens the game, picks word packs and a difficulty, adjusts the clue/turn clocks, and enters team names, one spymaster per team, and operators. Names are optional. Click **Deal us in**.
2. Share only the host's board tab in your approved meeting app.
3. Pause the clock while setting up. Open **Team links** and privately send each spymaster their private spymaster key link or a downloaded PNG key. Operator snapshot links are optional helper views. Resume the clock when everyone is ready.
4. The spymaster studies the hidden colors and says one word plus a number aloud (for example, “Space, three”). The host enters the spoken clue.
5. Operators discuss their guesses aloud. The host clicks a card, which flips to an inline **Reveal / Cancel** confirmation. The board announces **CORRECT!** or **WRONG!** without interrupting play with a modal. The game handles turns, guess allowances, scoring, and wins.

Operators can participate entirely in the meeting; they do not need to open the game. Optional operator links show an answer-free board snapshot for remote viewers. Guests need no GitHub accounts and do not become GitHub repository collaborators or registered members.

See the [comprehensive player guides](docs/guides.html) for host, spymaster, operator, and observer instructions, and the separate [release notes](docs/release-notes.html) for this update. Both pages publish with the game on GitHub Pages and are linked from its footer. The standalone app's documentation links open the published pages online; playing the standalone game still works offline.

**Links are snapshots, not live rooms.** They don't synchronize changes, report presence, or check people into a shared roster. Host-entered membership lives on the host device. Spymasters may click their private spymaster key cards to cross them off locally as the host reveals them. Existing invitations keep their original roster and board; send new links after a new board or roster change. Both spymasters see the full color key.

## Features

- Twenty switchable mood themes, including Diwali, Thanksgiving, Christmas, Hanukkah, Kwanzaa, Lunar New Year, and Eid alongside the original thirteen moods. The friendly ghost wears a different outfit or accessory in every theme.
- Anime.js staggered deals, atmospheric details, and celebrations; Motion spring hover, card flips, and dialog transitions.
- Respects the system reduced-motion setting; a visible toggle also reduces animation.
- Twelve original word collections, each with at least 200 unique entries. New collections cover federal Salesforce delivery with Copado and GitHub, nature, science, arts, sports, and world celebrations. Combine packs; cross-pack duplicates are removed.
- **Manage decks** on the home page lets you show or hide collections and saves those choices in this browser. Hiding a selected deck removes it from the next pool without changing a current game. **Show all decks**, then **Save deck choices**, restores the full picker; custom words always remain available.
- Curated Easy and Hard word selections in every pack; Standard uses the complete collections. Difficulty also supplies editable timer presets. Custom words remain available at every difficulty.
- Custom words and short phrases, comma/semicolon/newline separated. Append to selected packs or replace them. Minimum 25 unique entries; 24 characters each; maximum 5,000 entries.
- Host-managed teams, spymaster and operator names, private spymaster key links, optional operator snapshots, and downloaded PNG keys.
- One-word clues, counts 1–9, count-plus-one guess allowance, turn passing, trap loss, and team wins.
- Separate spymaster-clue and operator-turn clocks, pause/resume, editable time limits, and automatic turn passing on expiry.
- Undo (up to 40 actions), local game resume, mission log, dedicated per-team clue histories with turn numbers, and screen-sharing focus mode.
- Responsive layouts and keyboard-accessible inline card confirmation. Escape cancels a pending guess; keyboard focus initially lands on Cancel to prevent accidental double-Enter reveals.

| Collection | Entries |
| --- | ---: |
| Beautifully ordinary | 354 |
| Midnight mischief | 300 |
| Nerds after dark | 330 |
| Snack intelligence | 300 |
| Out of office | 300 |
| Merry little mysteries | 310 |
| Mission control | 240 |
| Wild neighbors | 250 |
| Small wonders | 240 |
| Creative company | 240 |
| Good sports | 240 |
| Gather round | 240 |

The pack picker shows the available count at the selected difficulty. Every pack has at least 50 curated Easy and 50 curated Hard entries.

### Difficulty and clocks

| Difficulty | Vocabulary | Spymaster clue | Operator turn |
| --- | --- | ---: | ---: |
| Easy | Curated familiar/concrete words | 180 seconds | 180 seconds |
| Standard | Full selected collections | 120 seconds | 120 seconds |
| Hard | Curated specialist/abstract words | 60 seconds | 90 seconds |

Change either limit to 10–1,800 seconds in setup or **Time limits** on the host board. Saving time limits restarts the current phase's clock; paused clocks stay paused. All guesses in one operator turn share the same budget—correct guesses do not reset it. Expiry passes to the other team's spymaster, including when no clue was given. Pause disables clue entry and card reveals.

Clocks use saved wall-clock deadlines, not interval tick counts. Returning from a background tab or resuming an expired save passes the expired turn once and starts a fresh clue clock, rather than forfeiting many unseen turns. Clocks are host-only; invitations remain non-live snapshots. Undo restores the previous game state with a fresh clock for that phase. Older saves without clock settings receive Standard timers; their existing mission log is retained, and the dedicated clue tracker records newly entered clues.

**New board** retains the current pool, difficulty, and limits. **Packs & difficulty** returns to setup and pauses the existing board; **Resume last game** restores it. Changing vocabulary requires dealing a new board and sending new private keys.

## Publish on GitHub Pages

For this repository (`jsc1100/clue-circuit`):

1. Open **Settings → Pages**.
2. Choose **Deploy from a branch**.
3. Select **main** and **/docs**, then save.
4. After deployment, visit `https://jsc1100.github.io/clue-circuit/`.

No build step or package installation is needed. All assets, including both animation libraries, are committed in `docs/`. Relative asset paths support repository subdirectories. If you fork or rename the repository, use the corresponding Pages address.

## Run locally

With Node.js 22 or newer:

```sh
npm start
```

Open `http://localhost:3000`. This is just a static file server bound to your own machine; it is **not** a multiplayer backend. No `npm install` is required. Alternatively, serve `docs/` with any approved static server.

The standalone `play-offline.html` release file can be opened directly without Node or a server. It contains all code, styles, word packs, and animation libraries.

Localhost links are usually not reachable for remote teammates. When hosting locally, the **Team links** dialog lets you specify a reachable public URL (for example, GitHub Pages); private invitations contain their own board data. Until the public site is available, download the spymaster key PNGs and send those privately instead.

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

Edit `docs/app.mjs` for the interface, `docs/engine.mjs` for rules/timers/invite serialization, `docs/packs.mjs` for themed collections and curated difficulty selections, `docs/themes.mjs` for theme metadata and original SVG ghost outfits, and `docs/style.css` for presentation. `docs/data/everyday.mjs` contains the general word collection. No transpilation is necessary.

The Node test suite covers pack validity and difficulty subsets, random board invariants, custom input, turn rules, trap/win outcomes, clock expiry and pause/resume, structured clue histories, and answer isolation in invitations. Rebuild the standalone bundle after source changes with `node scripts/build-offline.mjs`.

Browser verification was completed against `http://localhost:3000` and direct `file:///.../play-offline.html` use. Verified flows include:

- Theme switching across the expanded mood set and reduced-motion toggle behavior.
- Desktop and mobile layouts (including compact game-top and two-column team sidebar behavior on small screens).
- Keyboard interaction for inline guess confirmation (focusing a card and pressing Enter flips to Reveal / Cancel).
- Full host flow: clue entry, reveal confirmation, explicit reveal outcome messaging, undo, trap-loss round end, and normal win condition.
- Custom word validation (`<25` rejected, `25` accepted), team editing, and local resume behavior.
- Invite/link model: operator snapshots omit hidden answers, spymaster links expose full key, and guest pages are labeled as non-live snapshots.
- Private spymaster key PNG action in-app feedback and no runtime external resource origins beyond the same origin while serving locally.
- No console errors observed during local/browser verification runs.

Current deployment note: `https://jsc1100.github.io/clue-circuit/` returned the GitHub Pages `404` placeholder during verification, so Pages still needs to be enabled for `main` / `docs` in repository Settings.

## License and attribution

Original application code and word lists are MIT-licensed. See `LICENSE`. Third-party animation code retains its own MIT notices in `docs/vendor/` and provenance in `THIRD_PARTY.md`.

Clue Circuit is an independently named word-clue game, inspired by the general team word-association format. It does not copy the official Codenames source, branding, art, rulebook text, or word deck. It is not affiliated with Czech Games Edition. The application license does not grant rights to third-party trademarks.
