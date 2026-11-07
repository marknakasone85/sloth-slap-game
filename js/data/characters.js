// Playable sloths. Add a new character by adding an entry here.
//  role: 'FAST' | 'POWER' | 'BALANCED' (shown on the select screen)
//  speed: walk speed (px/s)   jump: jump velocity   power: damage (and knockback) multiplier
//  atk: slap speed (1 = normal; 1.5 = slaps 50% faster, 0.7 = slower wind-up)
//  hp: max health             weight: knockback resistance (1 = normal)
//  armor: true = small hits hurt but don't stop this sloth (super armor)
//  airJumps: extra jumps in mid-air (double jump)
//  trait: one line for the select screen
//  special: one of 'flurry' | 'dash' | 'bellyflop' | 'lullaby' | 'coconuts' |
//           'barrage' | 'missiles' | 'cannon' | 'freeze' | 'quake' | 'sprint'
SS.CHARACTERS = [
  {
    id: 'sir',
    name: 'Sir Slapsalot',
    quip: 'A gentleman never rushes. He just slaps.',
    look: {
      fur: '#9c7a54', furDark: '#6e5236', face: '#f1dfbd', mask: '#4a3424',
      belly: '#b8976c', accessory: 'tophat', accent: '#e63946',
    },
    role: 'BALANCED', trait: 'All-rounder: no weak spots.',
    scale: 1, speed: 210, jump: 650, power: 1.0, atk: 1.0, hp: 100, weight: 1.0,
    special: 'flurry', specialName: 'Triple Tea-Time Slap',
  },
  {
    id: 'sue',
    name: 'Speedy Sue',
    quip: 'Fastest sloth alive. Still pretty slow.',
    look: {
      fur: '#d9a38a', furDark: '#a8735d', face: '#fbe8d6', mask: '#6b3f30',
      belly: '#e8bba5', accessory: 'bow', accent: '#ff4d8d',
    },
    role: 'FAST', trait: 'Quick feet, quick slaps - but light hits.',
    scale: 0.92, speed: 310, jump: 720, power: 0.75, atk: 1.3, hp: 90, weight: 0.8,
    special: 'dash', specialName: 'Turbo Smack Dash',
  },
  {
    id: 'chonk',
    name: 'Big Chonk',
    quip: 'Ate 40 hibiscus flowers. Regrets nothing.',
    look: {
      fur: '#8a8a7a', furDark: '#5e5e52', face: '#e6e1cf', mask: '#3b3b33',
      belly: '#a5a593', accessory: 'headband', accent: '#3a86ff',
    },
    role: 'POWER', trait: 'Slow, but hits hard and hardly budges.',
    scale: 1.22, speed: 150, jump: 600, power: 1.5, atk: 0.8, hp: 140, weight: 1.6,
    special: 'bellyflop', specialName: 'Mega Belly Flop',
  },
  {
    id: 'dj',
    name: 'DJ Snooze',
    quip: 'Drops beats. Also drops asleep.',
    look: {
      fur: '#7d6a8f', furDark: '#56476a', face: '#ede0f5', mask: '#2f2540',
      belly: '#9785a8', accessory: 'shades', accent: '#00f5d4',
    },
    role: 'BALANCED', trait: 'Puts enemies to sleep with music.',
    scale: 1, speed: 215, jump: 660, power: 0.95, atk: 1.05, hp: 100, weight: 1.0,
    special: 'lullaby', specialName: 'Lullaby Bass Drop',
  },
  {
    id: 'queen',
    name: 'Queen Napoleona',
    quip: 'Royal decree: everyone gets slapped.',
    look: {
      fur: '#b08850', furDark: '#7c5e34', face: '#fff1d0', mask: '#4e3720',
      belly: '#c9a46a', accessory: 'crown', accent: '#9d4edd',
    },
    role: 'BALANCED', trait: 'All-rounder: makes coconuts rain.',
    scale: 1.05, speed: 200, jump: 640, power: 1.05, atk: 1.0, hp: 105, weight: 1.05,
    special: 'coconuts', specialName: 'Coconut Decree',
  },
  {
    id: 'sarge',
    name: 'Sergeant Snooze',
    quip: 'Ten-hut! Nap time is in five minutes. Slap time is NOW.',
    look: {
      fur: '#7d6a4f', furDark: '#5a4a36', face: '#efe2c9', mask: '#3d3020',
      belly: '#97835f', accessory: 'army', accent: '#556b2f',
    },
    role: 'POWER', trait: 'Tough and strong. Lobs banana bombs.',
    scale: 1.05, speed: 175, jump: 620, power: 1.25, atk: 0.9, hp: 120, weight: 1.25,
    special: 'barrage', specialName: 'Banana Barrage',
  },
  {
    id: 'wizzy',
    name: 'Wizzy the Wise',
    quip: 'Abraca-SLAP-ra! (I studied napping for 900 years.)',
    look: {
      fur: '#9e8fb0', furDark: '#6f6283', face: '#f1ecf7', mask: '#3b3350',
      belly: '#b6a9c7', accessory: 'wizard', accent: '#7b2cbf',
    },
    role: 'FAST', trait: 'Nimble and tricky: magic that chases.',
    scale: 0.98, speed: 255, jump: 700, power: 0.8, atk: 1.15, hp: 90, weight: 0.85,
    special: 'missiles', specialName: 'Magic Snooze Missiles',
  },
  {
    id: 'clawbeard',
    name: 'Captain Clawbeard',
    quip: 'Arr! Hand over yer hammock, matey!',
    look: {
      fur: '#8b6d4c', furDark: '#5f4a33', face: '#f0dcc0', mask: '#3e2c1c',
      belly: '#a5865f', accessory: 'pirate', accent: '#e63946',
    },
    role: 'POWER', trait: 'Heavy hitter with a belly cannon.',
    scale: 1.08, speed: 165, jump: 610, power: 1.35, atk: 0.85, hp: 125, weight: 1.35,
    special: 'cannon', specialName: 'Belly Cannon',
  },
  {
    id: 'flo',
    name: 'Frosty Flo',
    quip: 'Chill out. No really - I will freeze you.',
    look: {
      fur: '#b9c7d6', furDark: '#8a9aad', face: '#f4f9ff', mask: '#4a5a70',
      belly: '#d4e0ec', accessory: 'beanie', accent: '#4cc9f0',
    },
    role: 'FAST', trait: 'Quick, and freezes enemies solid.',
    scale: 0.95, speed: 270, jump: 700, power: 0.8, atk: 1.2, hp: 95, weight: 0.85,
    special: 'freeze', specialName: 'Brain Freeze Blast',
  },
  {
    id: 'gainz',
    name: 'Gorilla Gainz',
    quip: 'Did 10,000 slow-motion push-ups. Took three years.',
    look: {
      fur: '#58525f', furDark: '#38343d', face: '#cdbaa6', mask: '#1f1c24',
      belly: '#827b8b', accessory: 'gorilla', accent: '#ffd23f', build: 'buff',
    },
    role: 'POWER', trait: 'SUPER ARMOR: shrugs off small hits. Slow but mighty.',
    scale: 1.28, speed: 140, jump: 590, power: 1.8, atk: 0.7, hp: 150, weight: 2.0, armor: true,
    special: 'quake', specialName: 'Chest-Pound Quake',
  },
  {
    id: 'zane',
    name: 'Zippy Zane',
    quip: 'Ran a marathon in four minutes. Napped for four days.',
    look: {
      fur: '#c49a6c', furDark: '#93714c', face: '#fbeedd', mask: '#5a3d26',
      belly: '#dcb98f', accessory: 'athlete', accent: '#9ef01a', shoes: '#9ef01a', build: 'slim',
    },
    role: 'FAST', trait: 'DOUBLE JUMP: jump again in mid-air. Super fast.',
    scale: 0.94, speed: 400, jump: 780, power: 0.7, atk: 1.5, hp: 85, weight: 0.75, airJumps: 1,
    special: 'sprint', specialName: 'Lightning Lap',
  },
];

SS.ROLE_COLORS = { FAST: '#00f5d4', POWER: '#ff4d6d', BALANCED: '#ffd23f' };
SS.charById = (id) => SS.CHARACTERS.find((c) => c.id === id) || SS.CHARACTERS[0];
