// Playable sloths. Add a new character by adding an entry here.
//  speed: walk speed (px/s)   jump: jump velocity   power: damage multiplier
//  hp: max health             weight: knockback resistance (1 = normal)
//  special: one of 'flurry' | 'dash' | 'bellyflop' | 'lullaby' | 'coconuts' |
//           'barrage' | 'missiles' | 'cannon' | 'freeze'
SS.CHARACTERS = [
  {
    id: 'sir',
    name: 'Sir Slapsalot',
    quip: 'A gentleman never rushes. He just slaps.',
    look: {
      fur: '#9c7a54', furDark: '#6e5236', face: '#f1dfbd', mask: '#4a3424',
      belly: '#b8976c', accessory: 'tophat', accent: '#e63946',
    },
    scale: 1, speed: 190, jump: 640, power: 1.0, hp: 100, weight: 1.0,
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
    scale: 0.92, speed: 255, jump: 690, power: 0.85, hp: 90, weight: 0.85,
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
    scale: 1.22, speed: 150, jump: 600, power: 1.35, hp: 130, weight: 1.5,
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
    scale: 1, speed: 200, jump: 650, power: 0.95, hp: 95, weight: 1.0,
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
    scale: 1.05, speed: 180, jump: 630, power: 1.05, hp: 105, weight: 1.1,
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
    scale: 1.05, speed: 185, jump: 630, power: 1.05, hp: 110, weight: 1.15,
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
    scale: 0.98, speed: 190, jump: 660, power: 0.9, hp: 90, weight: 0.95,
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
    scale: 1.08, speed: 175, jump: 620, power: 1.15, hp: 115, weight: 1.2,
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
    scale: 0.95, speed: 215, jump: 670, power: 0.9, hp: 95, weight: 0.9,
    special: 'freeze', specialName: 'Brain Freeze Blast',
  },
];

SS.charById = (id) => SS.CHARACTERS.find((c) => c.id === id) || SS.CHARACTERS[0];
