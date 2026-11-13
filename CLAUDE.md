# The Sloth Slap Game - project guide

A comical cartoon slap-'em-up starring sloths. Plain HTML5 canvas + JavaScript, **no build step, no dependencies**. It runs by double-clicking `index.html`, in any browser, on phones (via the home-network share), and as an Electron desktop app (`package.json`, `desktop/main.js`). The README has the player-facing description.

Current content: 17 campaign maps (4 boss-less), 11 sloths (FAST / POWER / BALANCED roles), Slapdown Duel (vs CPU, 2 players on one keyboard, Wi-Fi battles for 2-4 sloths), Wi-Fi co-op campaign for 2-4 players, touch buttons for phones, gun, power-ups, blood/confetti.

## Rules the owner cares about
- **Keep it easy to deploy.** No build tools, no npm needed to play, no backend beyond `tools/share_server.py`. Flag up front any feature that would need a real server (online play, accounts, global leaderboards).
- **Controls are always shown on screen** in every mode: the bottom key-hint strip (`UI.keyStrip`), Pause → Controls, and the touch buttons on phones. Any new move or mode must be added to all three.
- **Never delete or replace maps.** Every map must stay unique; new ones are appended to `SS.LEVELS`.
- **Backups:** the folder is a git repo. After each finished feature, offer to "save a backup", and commit only when the owner says yes. End commit messages with the Co-Authored-By line from the system reminder.
- **GitHub (public):** `origin` is https://github.com/marknakasone85/sloth-slap-game. After saving a backup, offer to upload it (`git push`), and push only when the owner says yes. The repo's git config already sets the author to Mark A. Nakasone with the GitHub no-reply address, and push logs in through `gh`. Because the repo is public, never put personal details in tracked files: family names, personal emails, the home Wi-Fi address or location. `main` is protected on GitHub (no force pushes, no deleting it, admins included), so history can't be rewritten after a push.
- **Trademark:** "Sloth Slap" and "The Sloth Slap Game" are the owner's trademarks, not registered yet (the owner plans to register). Use ™ for now: on the title screen (`menu.js`, plus a "Sloth Slap™ © 2026 Mark A. Nakasone" footer), in the page titles and in the README. Switch to ® only once the US trademark office has registered the mark. The code is all rights reserved, not open source (see the README's last section). Don't add an open-source license.
- **Public statements:** the README has Privacy (no data collected, saves stay in the browser, Wi-Fi stays at home), Content (cartoon slapstick, cartoon guns, Blood: OFF) and not-affiliated notes. Keep them true when adding features, for example if something ever goes online.
- **Before saying it's ready:** run `tools/run-tests.sh` and check the change visually (see Testing). The owner usually asks "let me know when it's ready" - then give the exact steps to start sharing and what to refresh.
- **Security of the home-network share:** `tools/share_server.py` only serves `/index.html`, `/css/`, `/js/` (no hidden files, no `tools/`, no folder listings). Keep it that way. The co-op relay only lets localhost host, needs the 4-digit code (lockout after 8 wrong codes), uses per-player tokens, caps message size, and requires the `X-Sloth` header.

## How the owner plays
- Hosts from this Mac: `./share-on-network.command` (port 8000). Host browser: `http://localhost:8000`. Phones/computers: `http://<Mac Wi-Fi IP>:8000` (the sharing window prints it). 2-4 players including iPhones.
- Port **8765 belongs to another project** (Survive Bob). Never stop or change it.

## Web version (claude.ai artifact)
- Published at https://claude.ai/artifact/RvdTuR5M1uRDoi4seWEj4d (private until the owner shares it). The page is `artifact.html`, which is the same game as `index.html` with inline CSS. It sets `window.SS_WEB_ONLY = true`, so `SS.Net.available()` is false and the Wi-Fi menu items show a "needs the home version" message (there is no relay server there).
- To update it after changing the game, publish `artifact.html` to that URL with the Artifact tool. Pass a `files` map with every `js/...` path mapped to itself, using the same list as the `<script>` tags. When a feature is finished, offer to update the web version.
- `artifact.html` must list the same scripts as `index.html` (`test_menus.js` checks this). Add new script files to both.
- **Public web:** GitHub Pages serves the repo's `main` branch at https://marknakasone85.github.io/sloth-slap-game/ and updates about a minute after each push. `SS.Net.webOnly()` is true on any address that isn't a home address (not localhost, an IP or `*.local`), so Wi-Fi play switches itself off there. Keep that list in step with `host_ok()` in `share_server.py`.

## Code map (script order lives in `index.html` - plain `<script>` tags so `file://` works; no ES modules)
| Area | Files |
|---|---|
| Engine loop, scaling, host ticker, hit-stop `freeze`, `slowmo` (+ `unscaled(dt)` for real-time things like Wi-Fi snapshots), `SS.U` utils, `SS.Save` (localStorage) | `js/core/engine.js` |
| Keyboard/gamepad/pointer -> virtual key codes, control schemes `SS.Controls` (SOLO/P1/P2), `SS.Menu` | `js/core/input.js` |
| Touch buttons (separate full-screen layer `#touchLayer`, virtual keys `TouchSlap` etc.) | `js/core/touch.js` |
| Synth sound effects + step-sequencer music (`SONGS`), `funnyDeath(style)` | `js/core/audio.js` |
| Particles, popups, shake, blood/confetti (`gore`, `splat`, `feathers`), slow-motion `finisher` (zoom via `fx.camera`, overlay via `fx.drawFinisher`; every scene that draws a world calls both), `SS.Settings.blood` | `js/core/fx.js` |
| Icons + link-preview picture (`og:image`), drawn from the game's art by `tools/make-images.sh` (headless Chrome + `tools/make-images.html`). Not served by the home share server (only on GitHub Pages) | `img/` |
| Art: sloth (+ accessories), enemies/props/pickups, more creatures, backgrounds/themes + cave darkness | `js/art/*.js` |
| Data: sloths (`SS.CHARACTERS`), maps (`SS.LEVELS`) | `js/data/*.js` |
| Fighter (sloths, moves, specials, ammo, power-ups, `renderState`/`drawState`) + `SS.Projectile` | `js/entities/fighter.js` |
| Enemies (`TYPES`, behaviors, bosses), crates, gongs, pickups | `js/entities/enemy.js` |
| Duel CPU (`SS.CPU`) | `js/entities/ai.js` |
| Wi-Fi client (`SS.Net`: host/join/send/maintain/rejoin) + snapshot sync & effect/sound recording (`SS.Sync`) | `js/net/*.js` |
| Scenes: menu, mode menus + lobby + join, select, campaign (+ shared HUD), duel (+ `SS.DuelHUD`), Wi-Fi guest views | `js/scenes/*.js` |
| Home-network server + co-op relay | `tools/share_server.py`, `share-on-network.command` |

## How things work
- **World interface:** fighters/enemies/projectiles call the scene: `groundY`, `gravity`, `platforms`, `bounds(f)`, `targets(team)`, `spawn(p)`, `faceTarget(f)`, `floorBelow`, `fx`, `onHit`, `onEnemyKilled`, `addPickup`, `openGate`.
- **Campaign** (`CampaignScene`): `slots` = players (`local` = 'SOLO'/'P1'/'P2' or null for Wi-Fi). Co-op shares one camera, partner revive after 5 s, enemy HP scales with players (flyers excluded - they stay one-hit at 4 HP, so even the weakest slap, Zippy Zane's 4.2, knocks them out). Hearts after each gate and before bosses plus 2 power-ups per map are placed automatically (`placeHelpers`). Boss arena starts at `boss.x - 380`; a level's `length` must be >= `boss.x + 580`.
- **Duel** (`DuelScene`): 2-4 slots, free-for-all, last sloth standing wins the round, first to 2. CPU slots use `SS.CPU`.
- **Wi-Fi:** the host runs the real game and sends `snap` messages ~30/s (`SS.Sync.snapshot` / `duelSnapshot`, ~1.5-2.5 KB). Effects and sounds made during the host's update are recorded and replayed by guests. Guests send `in` messages (held keys + presses). Other messages: `welcome`, `lobby`, `pick` (guest's sloth + ready, also used to drop in mid-game), `start`, `toLobby`, and from the server `joined`, `left`, `hostLeft` (`rehost: true` = host is reconnecting with the same code), `replaced` (to the old host: another window started hosting, so this one stops and shows `LobbyScene({ stopped })`). **Only one window can host:** an automatic rehost (`rehost: true`) is refused with `taken` when a different code is running, so two host windows can never keep stealing the game from each other (that used to kick every player out every few seconds). `SS.Net.maintain()` runs every frame in every Wi-Fi scene and reconnects automatically: guests rejoin with the remembered code and `SS.Net.myCid`; the host re-opens with the same code. Server grace: 20 s for players, 30 s for the host.
- **Enemy behaviors:** walker, flyer, crab (pinch), thrower (keeps distance, throws `projectile`), hopper (kangaroo), charger (goat/raptor/taxi/goose), dangler (spider), boss (moves from `volley`/`slam`/`charge`/`burrow`), dragon (flying boss, also used by the Big UFO). Per-enemy splat/sound/word: `GORE` by art, or `d.gore`.
- **Guest-visible enemy poses** go through `visualFlags()` bits (1 punch, 2 charging, 4 UFO beam, 8 burrowed, 16 frozen).

## Adding content
- **Sloth:** add to `js/data/characters.js` (colors, `accessory` drawn in `js/art/sloth.js`, optional `build: 'buff'|'slim'`, `shoes`; stats; `special`). Stats that change the feel: `speed` (walk + acceleration), `atk` (slap speed: divides slap/big-slap timings), `power` (damage x power, knockback x sqrt(power)), `hp`, `weight`, plus traits `armor` (super armor: hits under 12 damage that aren't big don't stun) and `airJumps` (double jump). Give it a `role` and a one-line `trait` for the select screens; the stat bars (`SS.STAT_BARS` in `select.js`) are scaled to the current extremes (speed 400, power 1.8, hp 150). A new special needs a branch in `Fighter.updateMove`, an `armAngle` pose, and a range in `SS.CPU.goodSpecialRange`. The select screen fits 12 sloths (2 rows of 6); a 13th needs a new layout.
- **Map:** append to `js/data/levels.js` (theme, music, length, platforms, enemies, crates, pickups, gongs/gates, optional boss/props/gravity). New theme -> `THEMES` + decoration in `js/art/backgrounds.js`. Also add a duel stage to `SS.STAGES` in `js/scenes/select.js`.
- **Enemy:** add to `TYPES` in `js/entities/enemy.js`, art in `js/art/creatures*.js`, a `GORE` entry, and a new projectile kind in an art file's `A.projectile`.

## Testing
- **Automated:** `tools/run-tests.sh` (about 10 s; add `--full` to play every sloth on every map). It uses macOS's built-in JavaScriptCore with a fake browser (`tools/tests/harness.js`) and covers menus/map choice, touch buttons, sloth stats and specials (`test_sloths.js`), battles (with guest view), 3-player Wi-Fi co-op on every map, and a solo difficulty bot. Add new checks with `check(ok, 'what')`.
- **Visual:** `.claude/launch.json` runs `share_server.py --local --port 8770` for the app's built-in browser. Useful in-page shortcuts are `SS.Engine.setScene(new SS.CampaignScene({ charId, level }))`, `scene.openMapPicker()`, and `SS.Touch.enabled = true`.
- **Gotchas:**
  - a FX effect that Wi-Fi guests should see must be listed in `FX_METHODS` (sounds in `AUDIO_METHODS`) in `js/net/sync.js`; the host's own snapshot carries them, so tests must feed guests what `SS.Net.send` sent (see `test_battle.js`)
  - the co-op test bot sometimes gets stuck on map 17 and times out at 300 s (about 1 run in 12, before and after the slow-motion change); rerun before hunting a bug
  - restarting the preview server reloads its tabs
  - a hidden browser pane freezes animation, except on a Wi-Fi host, which has its own ticker
  - automated key presses within one frame collapse into one
  - Python edits: some files contain literal arrow characters (← → ◀ ▶); don't put `${...}` inside non-f-strings
