// Campaign maps. Coordinates are world pixels; ground is at GROUND_Y.
// enemies: { type, x, y? }   crates: { x, loot: 'banana'|'hibiscus'|'none' }
// pickups: { type: 'banana'|'hibiscus', x, y }
// gongs/gates: slapping gong N opens gate N
// platforms: { x, y, w } one-way branches you can jump onto
// boss: if set, the hammock only appears once the boss is defeated
SS.GROUND_Y = 460;

SS.LEVELS = [
  {
    name: 'Jungle Jog',
    blurb: 'Slap your way to the nap hammock. Slowly.',
    theme: 'jungle', music: 'jungle', length: 3400,
    platforms: [{ x: 900, y: 360, w: 180 }, { x: 1180, y: 290, w: 160 }, { x: 2300, y: 350, w: 200 }],
    enemies: [
      { type: 'beetle', x: 700 }, { type: 'beetle', x: 1000 }, { type: 'toucan', x: 1350, y: 300 },
      { type: 'beetle', x: 1700 }, { type: 'beetle', x: 1780 }, { type: 'toucan', x: 2100, y: 260 },
      { type: 'beetle', x: 2600 }, { type: 'toucan', x: 2800, y: 280 }, { type: 'beetle', x: 2900 },
    ],
    crates: [{ x: 500, loot: 'banana' }, { x: 1550, loot: 'hibiscus' }, { x: 2450, loot: 'banana' }],
    pickups: [
      { type: 'banana', x: 960, y: 320 }, { type: 'banana', x: 1010, y: 320 },
      { type: 'banana', x: 1240, y: 250 }, { type: 'banana', x: 2380, y: 310 },
    ],
    gongs: [{ id: 1, x: 1900 }],
    gates: [{ id: 1, x: 2050 }],
  },
  {
    name: 'Banana Beach',
    blurb: 'Crabs. Seagulls. Monkeys throwing coconuts. Relaxing!',
    theme: 'beach', music: 'jungle', length: 4000,
    platforms: [{ x: 1400, y: 350, w: 200 }, { x: 2700, y: 340, w: 220 }, { x: 3000, y: 270, w: 160 }],
    enemies: [
      { type: 'crab', x: 650 }, { type: 'seagull', x: 900, y: 280 }, { type: 'crab', x: 1150 },
      { type: 'monkey', x: 1500 }, { type: 'crab', x: 1800 }, { type: 'seagull', x: 2000, y: 240 },
      { type: 'monkey', x: 2300 }, { type: 'crab', x: 2550 }, { type: 'crab', x: 2650 },
      { type: 'seagull', x: 3100, y: 230 }, { type: 'monkey', x: 3400 }, { type: 'crab', x: 3550 },
    ],
    crates: [{ x: 800, loot: 'banana' }, { x: 1950, loot: 'hibiscus' }, { x: 3250, loot: 'hibiscus' }],
    pickups: [
      { type: 'banana', x: 1460, y: 310 }, { type: 'banana', x: 1520, y: 310 },
      { type: 'banana', x: 3060, y: 230 }, { type: 'banana', x: 3110, y: 230 },
    ],
    gongs: [{ id: 1, x: 1250 }, { id: 2, x: 3000 }],
    gates: [{ id: 1, x: 1330 }, { id: 2, x: 3200 }],
  },
  {
    name: 'Temple of Mischief',
    blurb: 'Ancient ruins full of very rude monkeys.',
    theme: 'temple', music: 'jungle', length: 4200,
    platforms: [
      { x: 700, y: 360, w: 160 }, { x: 950, y: 290, w: 160 }, { x: 1200, y: 360, w: 160 },
      { x: 2400, y: 340, w: 240 }, { x: 3300, y: 350, w: 200 },
    ],
    enemies: [
      { type: 'monkey', x: 800 }, { type: 'beetle', x: 1100 }, { type: 'parrot', x: 1300, y: 260 },
      { type: 'monkey', x: 1650 }, { type: 'beetle', x: 1800 }, { type: 'beetle', x: 1880 },
      { type: 'monkey', x: 2250 }, { type: 'parrot', x: 2500, y: 230 }, { type: 'crab', x: 2800 },
      { type: 'monkey', x: 3100 }, { type: 'parrot', x: 3400, y: 240 }, { type: 'monkey', x: 3700 },
    ],
    crates: [{ x: 600, loot: 'banana' }, { x: 2000, loot: 'hibiscus' }, { x: 3550, loot: 'hibiscus' }],
    pickups: [
      { type: 'banana', x: 1010, y: 250 }, { type: 'banana', x: 1060, y: 250 },
      { type: 'banana', x: 2480, y: 300 }, { type: 'banana', x: 2560, y: 300 },
    ],
    gongs: [{ id: 1, x: 1450 }, { id: 2, x: 2950 }],
    gates: [{ id: 1, x: 1550 }, { id: 2, x: 3050 }],
  },
  {
    name: 'Volcano Snooze',
    blurb: 'King Bonkers stole the comfiest hammock. Slap him!',
    theme: 'volcano', music: 'duel', length: 3600,
    platforms: [{ x: 1000, y: 350, w: 200 }, { x: 1900, y: 340, w: 200 }],
    enemies: [
      { type: 'beetle', x: 600 }, { type: 'crab', x: 850 }, { type: 'monkey', x: 1200 },
      { type: 'parrot', x: 1500, y: 250 }, { type: 'crab', x: 1700 }, { type: 'monkey', x: 2100 },
      { type: 'beetle', x: 2300 }, { type: 'beetle', x: 2360 },
    ],
    crates: [{ x: 1400, loot: 'hibiscus' }, { x: 2500, loot: 'hibiscus' }],
    pickups: [{ type: 'banana', x: 1060, y: 310 }, { type: 'banana', x: 1960, y: 300 }],
    gongs: [{ id: 1, x: 2600 }],
    gates: [{ id: 1, x: 2700 }],
    boss: { type: 'kingBonkers', x: 3100 },
  },

  // ----------------- World tour -----------------
  {
    name: 'Crab Cove',
    blurb: 'Big Pinchy the Super Crab is hogging the beach. Pinch back!',
    theme: 'cove', music: 'jungle', length: 3800,
    platforms: [{ x: 900, y: 350, w: 200 }, { x: 1700, y: 340, w: 180 }, { x: 2000, y: 280, w: 160 }],
    enemies: [
      { type: 'crab', x: 600 }, { type: 'seagull', x: 800, y: 270 }, { type: 'crab', x: 1000 },
      { type: 'crab', x: 1120 }, { type: 'monkey', x: 1500 }, { type: 'seagull', x: 1650, y: 240 },
      { type: 'crab', x: 1900 }, { type: 'crab', x: 2050 }, { type: 'monkey', x: 2350 },
      { type: 'seagull', x: 2550, y: 250 },
    ],
    crates: [{ x: 750, loot: 'banana' }, { x: 1450, loot: 'hibiscus' }, { x: 2600, loot: 'hibiscus' }],
    pickups: [
      { type: 'banana', x: 960, y: 310 }, { type: 'banana', x: 1020, y: 310 },
      { type: 'banana', x: 2060, y: 240 }, { type: 'banana', x: 2110, y: 240 },
    ],
    gongs: [{ id: 1, x: 1250 }, { id: 2, x: 2700 }],
    gates: [{ id: 1, x: 1330 }, { id: 2, x: 2800 }],
    boss: { type: 'bigPinchy', x: 3250 },
  },
  {
    name: 'Pizza Piazza',
    blurb: 'Pigeons and pizza-flinging chef monkeys. Mamma mia!',
    theme: 'italy', music: 'italy', length: 4200,
    platforms: [
      { x: 700, y: 360, w: 160 }, { x: 950, y: 300, w: 150 }, { x: 1800, y: 350, w: 200 },
      { x: 2600, y: 340, w: 180 }, { x: 2850, y: 280, w: 160 }, { x: 3400, y: 350, w: 200 },
    ],
    enemies: [
      { type: 'pigeon', x: 650, y: 280 }, { type: 'chef', x: 900 }, { type: 'pigeon', x: 1200, y: 250 },
      { type: 'chef', x: 1600 }, { type: 'pigeon', x: 1750, y: 260 }, { type: 'chef', x: 2150 },
      { type: 'pigeon', x: 2300, y: 240 }, { type: 'beetle', x: 2450 }, { type: 'beetle', x: 2520 },
      { type: 'chef', x: 2950 }, { type: 'pigeon', x: 3150, y: 250 }, { type: 'chef', x: 3550 },
      { type: 'pigeon', x: 3750, y: 260 },
    ],
    crates: [{ x: 550, loot: 'banana' }, { x: 1950, loot: 'hibiscus' }, { x: 3250, loot: 'hibiscus' }],
    pickups: [
      { type: 'banana', x: 1000, y: 260 }, { type: 'banana', x: 1050, y: 260 },
      { type: 'banana', x: 2900, y: 240 }, { type: 'banana', x: 2950, y: 240 },
      { type: 'hibiscus', x: 3480, y: 310 },
    ],
    gongs: [{ id: 1, x: 1350 }, { id: 2, x: 3000 }],
    gates: [{ id: 1, x: 1450 }, { id: 2, x: 3150 }],
  },
  {
    name: 'Lantern Valley',
    blurb: 'Bamboo, golden monkeys and a very energetic dancing dragon.',
    theme: 'china', music: 'china', length: 4300,
    platforms: [
      { x: 600, y: 360, w: 150 }, { x: 820, y: 300, w: 150 }, { x: 1040, y: 240, w: 150 },
      { x: 1800, y: 350, w: 200 }, { x: 2400, y: 330, w: 200 },
    ],
    enemies: [
      { type: 'crane', x: 700, y: 260 }, { type: 'goldMonkey', x: 950 }, { type: 'beetle', x: 1150 },
      { type: 'crane', x: 1350, y: 240 }, { type: 'goldMonkey', x: 1650 }, { type: 'beetle', x: 1900 },
      { type: 'beetle', x: 1960 }, { type: 'crane', x: 2200, y: 250 }, { type: 'goldMonkey', x: 2550 },
      { type: 'goldMonkey', x: 2850 },
    ],
    crates: [{ x: 500, loot: 'banana' }, { x: 1700, loot: 'hibiscus' }, { x: 2650, loot: 'hibiscus' }],
    pickups: [
      { type: 'banana', x: 880, y: 260 }, { type: 'banana', x: 1100, y: 200 }, { type: 'banana', x: 1150, y: 200 },
      { type: 'banana', x: 2480, y: 290 },
    ],
    gongs: [{ id: 1, x: 1250 }, { id: 2, x: 2950 }],
    gates: [{ id: 1, x: 1400 }, { id: 2, x: 3050 }],
    boss: { type: 'dragon', x: 3500, y: 300 },
  },
  {
    name: 'Operation Nap Time',
    blurb: 'General Bonkers built an army base. Time for the final slap!',
    theme: 'military', music: 'march', length: 4500,
    platforms: [
      { x: 800, y: 350, w: 200 }, { x: 1500, y: 340, w: 160 }, { x: 1700, y: 280, w: 160 },
      { x: 2600, y: 340, w: 220 },
    ],
    enemies: [
      { type: 'drone', x: 600, y: 260 }, { type: 'soldier', x: 950 }, { type: 'beetle', x: 1100 },
      { type: 'drone', x: 1300, y: 240 }, { type: 'soldier', x: 1650 }, { type: 'crab', x: 1850 },
      { type: 'soldier', x: 2150 }, { type: 'drone', x: 2350, y: 250 }, { type: 'soldier', x: 2550 },
      { type: 'drone', x: 2800, y: 230 }, { type: 'soldier', x: 3000 }, { type: 'crab', x: 3120 },
    ],
    crates: [
      { x: 700, loot: 'banana' }, { x: 1950, loot: 'hibiscus' }, { x: 2900, loot: 'hibiscus' },
      { x: 3380, loot: 'hibiscus' },
    ],
    pickups: [
      { type: 'banana', x: 860, y: 310 }, { type: 'banana', x: 920, y: 310 },
      { type: 'banana', x: 1760, y: 240 }, { type: 'banana', x: 2700, y: 300 },
    ],
    gongs: [{ id: 1, x: 1350 }, { id: 2, x: 3200 }],
    gates: [{ id: 1, x: 1420 }, { id: 2, x: 3300 }],
    boss: { type: 'generalBonkers', x: 3800 },
  },

  // ----------------- World tour 2 -----------------
  {
    name: 'Mount Snoozemore',
    blurb: 'Snowballs, grumpy goats and a very fluffy Yeti.',
    theme: 'mountain', music: 'mountain', length: 4300,
    platforms: [
      { x: 700, y: 360, w: 180 }, { x: 950, y: 290, w: 160 }, { x: 1900, y: 350, w: 200 },
      { x: 2500, y: 330, w: 200 }, { x: 2750, y: 270, w: 160 },
    ],
    enemies: [
      { type: 'goat', x: 600 }, { type: 'eagle', x: 850, y: 260 }, { type: 'snowMonkey', x: 1100 },
      { type: 'kangaroo', x: 1220 }, { type: 'goat', x: 1650 }, { type: 'eagle', x: 1850, y: 250 },
      { type: 'snowMonkey', x: 2100 }, { type: 'kangaroo', x: 2350 }, { type: 'goat', x: 2650 },
      { type: 'snowMonkey', x: 2900 }, { type: 'eagle', x: 3000, y: 240 },
    ],
    crates: [{ x: 500, loot: 'banana' }, { x: 1550, loot: 'hibiscus' }, { x: 2450, loot: 'banana' }, { x: 3230, loot: 'hibiscus' }],
    pickups: [
      { type: 'banana', x: 1000, y: 250 }, { type: 'banana', x: 1050, y: 250 },
      { type: 'banana', x: 2800, y: 230 }, { type: 'banana', x: 2850, y: 230 },
    ],
    gongs: [{ id: 1, x: 1300 }, { id: 2, x: 3050 }],
    gates: [{ id: 1, x: 1400 }, { id: 2, x: 3150 }],
    boss: { type: 'yeti', x: 3700 },
  },
  {
    name: 'Castle Kerfuffle',
    blurb: 'Boxing kangaroos took over the castle. Their king packs a punch!',
    theme: 'castle', music: 'castle', length: 4400,
    platforms: [
      { x: 650, y: 360, w: 160 }, { x: 880, y: 300, w: 140 }, { x: 1100, y: 240, w: 160 },
      { x: 2000, y: 350, w: 220 }, { x: 2600, y: 330, w: 200 },
    ],
    enemies: [
      { type: 'bat', x: 600, y: 280 }, { type: 'knightMonkey', x: 850 }, { type: 'kangaroo', x: 1100 },
      { type: 'bat', x: 1300, y: 250 }, { type: 'knightMonkey', x: 1750 }, { type: 'kangaroo', x: 1950 },
      { type: 'bat', x: 2150, y: 260 }, { type: 'knightMonkey', x: 2450 }, { type: 'kangaroo', x: 2750 },
      { type: 'bat', x: 2900, y: 240 }, { type: 'knightMonkey', x: 3050 },
    ],
    crates: [{ x: 550, loot: 'banana' }, { x: 1650, loot: 'hibiscus' }, { x: 2550, loot: 'banana' }, { x: 3330, loot: 'hibiscus' }],
    pickups: [
      { type: 'banana', x: 1150, y: 200 }, { type: 'banana', x: 1200, y: 200 },
      { type: 'banana', x: 2080, y: 310 }, { type: 'banana', x: 2680, y: 290 },
    ],
    gongs: [{ id: 1, x: 1400 }, { id: 2, x: 3150 }],
    gates: [{ id: 1, x: 1500 }, { id: 2, x: 3250 }],
    boss: { type: 'kingKanga', x: 3800 },
  },
  {
    name: 'Lava Lagoon',
    blurb: 'Deep inside the volcano. Fire beetles, lava blobs and hot-headed kangaroos!',
    theme: 'lava', music: 'duel', length: 4200,
    platforms: [
      { x: 600, y: 350, w: 160 }, { x: 850, y: 290, w: 160 }, { x: 1700, y: 340, w: 200 },
      { x: 2300, y: 320, w: 180 }, { x: 2550, y: 260, w: 160 }, { x: 3300, y: 340, w: 220 },
    ],
    enemies: [
      { type: 'fireBeetle', x: 550 }, { type: 'lavaBlob', x: 800 }, { type: 'fireBat', x: 1000, y: 260 },
      { type: 'kangaroo', x: 1180 }, { type: 'fireBeetle', x: 1600 }, { type: 'lavaBlob', x: 1750 },
      { type: 'fireBat', x: 1950, y: 250 }, { type: 'kangaroo', x: 2150 }, { type: 'lavaBlob', x: 2400 },
      { type: 'fireBeetle', x: 2650 }, { type: 'fireBat', x: 3100, y: 240 }, { type: 'kangaroo', x: 3400 },
      { type: 'lavaBlob', x: 3600 }, { type: 'fireBeetle', x: 3700 },
    ],
    crates: [{ x: 700, loot: 'hibiscus' }, { x: 1550, loot: 'banana' }, { x: 2700, loot: 'hibiscus' }, { x: 3500, loot: 'banana' }],
    pickups: [
      { type: 'banana', x: 900, y: 250 }, { type: 'banana', x: 950, y: 250 },
      { type: 'banana', x: 2600, y: 220 }, { type: 'banana', x: 3380, y: 300 },
    ],
    gongs: [{ id: 1, x: 1300 }, { id: 2, x: 2800 }],
    gates: [{ id: 1, x: 1400 }, { id: 2, x: 2900 }],
  },
  {
    name: 'Jurassic Jog',
    blurb: 'A time machine! Slap your way through dinosaur times.',
    theme: 'dino', music: 'dino', length: 4400,
    props: [{ type: 'timeMachine', x: 70 }],
    platforms: [
      { x: 700, y: 350, w: 200 }, { x: 1000, y: 290, w: 160 }, { x: 1950, y: 340, w: 200 }, { x: 2650, y: 330, w: 220 },
    ],
    enemies: [
      { type: 'raptor', x: 650 }, { type: 'ptero', x: 900, y: 260 }, { type: 'caveMonkey', x: 1150 },
      { type: 'raptor', x: 1700 }, { type: 'ptero', x: 1900, y: 250 }, { type: 'caveMonkey', x: 2150 },
      { type: 'raptor', x: 2400 }, { type: 'raptor', x: 2500 }, { type: 'ptero', x: 2800, y: 240 },
      { type: 'caveMonkey', x: 3000 },
    ],
    crates: [{ x: 550, loot: 'banana' }, { x: 1600, loot: 'hibiscus' }, { x: 2300, loot: 'banana' }, { x: 3300, loot: 'hibiscus' }],
    pickups: [
      { type: 'banana', x: 760, y: 310 }, { type: 'banana', x: 1060, y: 250 },
      { type: 'banana', x: 2000, y: 300 }, { type: 'banana', x: 2720, y: 290 },
    ],
    gongs: [{ id: 1, x: 1350 }, { id: 2, x: 3100 }],
    gates: [{ id: 1, x: 1450 }, { id: 2, x: 3200 }],
    boss: { type: 'trex', x: 3800 },
  },
  {
    name: 'Space Station Zzz',
    blurb: 'Low gravity, high slaps! Stop the Big UFO for the comfiest nap in the galaxy.',
    theme: 'space', music: 'space', length: 4600, gravity: 0.55,
    platforms: [
      { x: 650, y: 330, w: 160 }, { x: 900, y: 240, w: 160 }, { x: 1150, y: 160, w: 140 },
      { x: 2000, y: 300, w: 200 }, { x: 2300, y: 200, w: 180 }, { x: 2900, y: 300, w: 200 },
    ],
    enemies: [
      { type: 'alien', x: 600 }, { type: 'miniUfo', x: 850, y: 250 }, { type: 'spaceMonkey', x: 1100 },
      { type: 'astroRoo', x: 1300 }, { type: 'alien', x: 1700 }, { type: 'alien', x: 1780 },
      { type: 'miniUfo', x: 1950, y: 230 }, { type: 'spaceMonkey', x: 2200 }, { type: 'astroRoo', x: 2500 },
      { type: 'miniUfo', x: 2750, y: 240 }, { type: 'spaceMonkey', x: 3000 }, { type: 'astroRoo', x: 3200 },
    ],
    crates: [{ x: 550, loot: 'banana' }, { x: 1600, loot: 'hibiscus' }, { x: 2600, loot: 'banana' }, { x: 3520, loot: 'hibiscus' }],
    pickups: [
      { type: 'banana', x: 1190, y: 120 }, { type: 'banana', x: 1240, y: 120 },
      { type: 'banana', x: 2360, y: 160 }, { type: 'banana', x: 2410, y: 160 },
    ],
    gongs: [{ id: 1, x: 1400 }, { id: 2, x: 3300 }],
    gates: [{ id: 1, x: 1500 }, { id: 2, x: 3400 }],
    boss: { type: 'bigUfo', x: 4000, y: 280 },
  },
];
