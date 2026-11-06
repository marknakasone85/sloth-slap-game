# The Sloth Slap Game

A comical cartoon slap-'em-up starring a crew of sloths.

- **Campaign**: eight side-scrolling maps. Slap enemies, smash crates for bananas and hibiscus, ring gongs to open gates (each one is also a checkpoint), beat the bosses, and reach the nap hammock. Progress and best scores are saved in the browser.

  | # | Map | Highlights |
  |---|---|---|
  | 1 | Jungle Jog | beetles, toucans |
  | 2 | Banana Beach | crabs, seagulls, coconut monkeys |
  | 3 | Temple of Mischief | platforms, parrots, rude monkeys |
  | 4 | Volcano Snooze | boss: **King Bonkers** |
  | 5 | Crab Cove | boss: **Big Pinchy the Super Crab** |
  | 6 | Pizza Piazza (Italy) | pigeons, pizza-flinging chef monkeys, leaning tower |
  | 7 | Lantern Valley (China) | cranes, golden monkeys, pagodas; boss: **The Dancing Dragon** |
  | 8 | Operation Nap Time (military base) | drones, helmet monkeys with water balloons; boss: **General Bonkers** |
  | 9 | Mount Snoozemore (mountain) | charging goats, eagles, snowball monkeys, boxing kangaroos; boss: **Big Fluffy the Yeti** |
  | 10 | Castle Kerfuffle (castle) | bats, knight monkeys with cannonballs, boxing kangaroos; boss: **King Kanga** |
  | 11 | Lava Lagoon (inside the volcano) | fire beetles, bouncing lava blobs, fire bats, kangaroos |
  | 12 | Jurassic Jog (time machine) | charging raptors, pterodactyls, rock-throwing cave monkeys; boss: **Tiny-Arms Rex** |
  | 13 | Space Station Zzz (low gravity!) | alien blobs, astronaut monkeys, astro-kangaroos, mini UFOs; boss: **The Big UFO** |
  | 14 | Capitol Capers (Washington DC) | acorn-throwing squirrels, charging geese, pigeons; boss: **The Mega Goose** |
  | 15 | Pyramid Panic (Egypt) | mummies, scorpions, spitting camels, vultures; boss: **The Mummy King** |
  | 16 | Crystal Caverns (dark cave: light only around your sloths) | dropping spiders, bats, crystal crabs; boss: **The Giant Mole** (burrows and pops up under you) |
  | 17 | Big Apple Bash (New York City) | pizza rats, speeding taxis, hot-dog monkeys, pigeons; final boss: **Mega Pizza Rat** |

  Flying enemies (birds, bats, drones, UFOs) go down with one slap or one shot.

  **Health & power-ups:** a heart (+50 HP) waits just past every gate and before each boss. Enemies sometimes drop leaf snacks (+10) or hearts. Each map has two glowing power-up bubbles, and crates sometimes hold one:
  🛡️ Bubble Shield (no damage), 👊 Super Slap (double damage), 🔫 Rapid Fire (unlimited ammo), ☕ Coffee (super speed): each lasts 12 seconds.
  🍌 Lucky Banana: an extra life. If you get snoozed you pop right back up.

  Secret: type **S L O T H** on the map-select screen to unlock every map.

- **Co-op campaign** (Campaign → choose how to play):
  - **2 Players (this computer):** P1 uses WASD + F/G/H/R and P2 uses the arrow keys + , . / ;
  - **Wi-Fi co-op, 2 to 4 players** on different computers on the same Wi-Fi (see *Playing together on Wi-Fi* below).
  - Everyone shares one screen. If you get snoozed while a teammate is still up, you pop back in next to them after 5 seconds. Checkpoints are only needed if the whole team goes down. Enemies get tougher the more sloths there are.
- **Slapdown Duel**: a fighting mode, first to 2 round wins.
  - **vs CPU** (Sleepy / Grumpy / Savage) or **2 Players** on one keyboard.
  - **Wi-Fi Battle, 2 to 4 sloths:** free-for-all, and the last sloth standing wins the round (if time runs out, the most health left wins). The host can add **CPU sloths** in the lobby (C = add, X = remove) to fill empty spots. Late arrivals jump in at the next round. After a match: **Rematch** or **Back to Lobby** (same join code, nobody has to rejoin).

There are nine sloths, each with their own stats and special move:

| Sloth | Style | Special |
|---|---|---|
| Sir Slapsalot | Balanced | Triple Tea-Time Slap (3-hit flurry) |
| Speedy Sue | Fast, fragile | Turbo Smack Dash |
| Big Chonk | Slow, heavy hitter | Mega Belly Flop (shockwave) |
| DJ Snooze | Zoner | Lullaby Bass Drop (puts the target to sleep) |
| Queen Napoleona | All-rounder | Coconut Decree (coconuts rain down) |
| Sergeant Snooze | Soldier, tough | Banana Barrage (three exploding banana bombs) |
| Wizzy the Wise | Wizard | Magic Snooze Missiles (three homing missiles) |
| Captain Clawbeard | Pirate, heavy hitter | Belly Cannon (a huge cannonball) |
| Frosty Flo | Ice, quick | Brain Freeze Blast (freezes the target solid) |

## Play it

### Web browser (any OS)
Double-click `index.html`. That's all: there are no dependencies, no build step, and every graphic and sound is generated in code.

To host it online, upload the folder as-is to any static host (itch.io as an HTML5 game, GitHub Pages, Netlify).

### Native macOS / Windows app
This needs [Node.js](https://nodejs.org) (LTS) installed once.

```bash
npm install          # first time only
npm start            # run as a desktop app
npm run dist:mac     # build dist/*.dmg   (run on a Mac)
npm run dist:win     # build dist/*.exe   (best run on Windows)
```

## Sharing

**Another Mac:** in Finder, right-click the `Sloth-Slap-Game` folder, choose **Share → AirDrop**, and pick the other Mac. Or copy the folder over with a USB stick. On the other Mac, double-click `index.html`.

**Your home network:** double-click **`share-on-network.command`**. A window opens with an address like `http://192.168.1.23:8000`. Anyone on the same Wi-Fi can type that into their web browser to play. Keep the window open while people play; close it to stop sharing.
- Only the game files are shared, read-only. Hidden files, the backup history and settings are never served, and folders can't be browsed (see `tools/share_server.py`).
- Sharing stops by itself after 3 hours.
- Only use it on your own home Wi-Fi, not on public Wi-Fi.
- The first time, macOS may ask whether Python can accept incoming network connections. Click **Allow**, or nobody else can connect.

## Playing on phones and tablets

Phones and tablets play in the web browser. On the computer, double-click `share-on-network.command`, then on the phone (on the same Wi-Fi) open the address it shows, like `http://192.168.1.23:8000`. Phones can't open the `index.html` file directly.

- **Touch buttons** appear the first time you touch the screen. On the left: ◀ ▶ to move and BLOCK. On the right: SLAP (big), JUMP, BIG, SHOOT and SUPER (glows when your special is ready). Pause is at the bottom middle. Use several fingers at once to run and slap together.
- Hold the phone **sideways**. If you hold it upright, the game waits and asks you to turn it.
- Menus work by tapping, and screens that use Esc have a **◀ Back** button.
- Works for the solo campaign, Slapdown Duel vs the CPU, and **joining a Wi-Fi co-op game from a phone**.
- Tip: on iPhone/iPad, *Share → Add to Home Screen* makes it open full-screen like an app.
- Pause → **On-screen controls** switches between touch buttons, key hints, or nothing.

## Playing together on Wi-Fi (2-4 players)

1. **Host** (the computer that runs the game): double-click `share-on-network.command`, then open **http://localhost:8000** in a browser on that same computer.
   - Co-op: **Campaign → Host Wi-Fi Game**. Battle: **Slapdown Duel → Host Wi-Fi Battle**.
   - Pick your sloth and the lobby shows a **4-digit join code**.
2. **Everyone else** (computers or phones): open the address shown in the host's sharing window (like `http://192.168.1.23:8000`), choose **Join Wi-Fi Game** or **Join Wi-Fi Battle**, type the code, pick a sloth and press **Enter** (or tap) when ready.
3. The host picks a map or stage with ←/→ (battles: C adds a CPU sloth) and presses **Enter** to start. Late arrivals can still join.

How it works: the host's computer runs the real game. The others send their button presses and draw what the host sends back (about 30 updates a second, roughly 1.5 KB each). The host's game keeps running even if its window is hidden, covered or in a background tab.

Security: only the host's own computer can start a game, joining needs the code, a device that types too many wrong codes is locked out for a minute, every player gets a secret token, messages are small and never saved, other websites can't talk to it, and it's still home-network only and turns off by itself after 3 hours.

## Backups

The folder is a git repository, so every saved version of the game can be restored. Ask Claude to "save a backup" after changes, or to "go back to the version from before X".

## Controls

| Action | Player 1 | Player 2 |
|---|---|---|
| Move | A / D | ← / → |
| Jump | W | ↑ |
| Block (hold) | S | ↓ |
| Slap | F | , |
| Big Slap | G | . |
| Special (when the meter is full) | H | / |
| Shoot (6 bullets, refill slowly; crates drop ammo) | R | ; |
| Pause | Esc / P | Esc / P |

In single-player you can also use the arrow keys, Space, and J / K / L. In both the campaign and Slapdown Duel, a key-hint strip along the bottom shows each player's keys and lights up the move they're doing. You can switch it off in the pause menu, and **Pause → Controls** shows the full list. Enemies splatter in their own color (monkeys red, beetles green, crabs blue, drones oil) and make silly noises when they go down. **Pause → Blood: OFF** swaps the blood for confetti. Gamepads work too: X = slap, Y = big slap, B = special, RB = shoot, A = jump, LB = block. Menus also work with the mouse or touch.

## Project layout

```
index.html            entry page (plain <script> tags, so it works from file://)
css/style.css
js/core/              engine loop + scaling, input (keys/mouse/touch/gamepad), synth audio, FX
js/art/               procedural cartoon art: sloths, enemies/props, parallax backgrounds
js/data/              characters.js (roster + stats), levels.js (campaign maps)
js/entities/          fighter.js (sloths + moves + projectiles), enemy.js, ai.js (duel CPU)
js/scenes/            menu, select, campaign, duel, ui helpers
desktop/main.js       Electron wrapper for the Mac/Windows builds
```

### Adding content
- **New sloth**: add an entry to `js/data/characters.js` with colors, an accessory (`tophat`, `shades`, `crown`, `headband`, `bow`, `helmet`), stats, and one of the existing specials.
- **New map**: add an entry to `js/data/levels.js` with a theme (`jungle`, `beach`, `temple`, `volcano`), enemies, crates, pickups, gongs/gates, platforms, and an optional boss.

## Roadmap ideas
- On-screen touch buttons for phones and tablets (the game already scales to any screen)
- Non-sloth duel characters (the monkey art is already there)
- 2-player co-op campaign
- More maps, bosses and specials
