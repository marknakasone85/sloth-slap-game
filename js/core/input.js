// Keyboard, pointer (mouse/touch) and gamepad input.
// Gamepads are mapped onto virtual key codes like "Pad0Left" so everything
// else can treat them exactly like keys.
(function () {
  const PREVENT = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Slash', 'Tab', 'Semicolon',
  ]);

  // Which keys the player is using, so on-screen hints can match them.
  const ARROW_SIDE = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyJ', 'KeyK', 'KeyL',
    'Comma', 'Period', 'Slash', 'Semicolon']);
  const WASD_SIDE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyR']);

  const I = (SS.Input = {
    lastDevice: 'wasd', // 'wasd' | 'arrows' | 'pad'
    keys: {},
    pressed: {},
    pointer: { x: 0, y: 0, down: false, pressed: false },
    _padPrev: {},

    init(canvas) {
      window.addEventListener('keydown', (e) => {
        if (PREVENT.has(e.code)) e.preventDefault();
        if (!this.keys[e.code]) this.pressed[e.code] = true;
        this.keys[e.code] = true;
        if (ARROW_SIDE.has(e.code)) this.lastDevice = 'arrows';
        else if (WASD_SIDE.has(e.code)) this.lastDevice = 'wasd';
        SS.Audio.unlock();
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });
      window.addEventListener('blur', () => {
        this.keys = {};
      });

      const toLocal = (e) => {
        const r = canvas.getBoundingClientRect();
        this.pointer.x = ((e.clientX - r.left) / r.width) * SS.W;
        this.pointer.y = ((e.clientY - r.top) / r.height) * SS.H;
      };
      canvas.addEventListener('pointerdown', (e) => {
        toLocal(e);
        this.pointer.down = true;
        this.pointer.pressed = true;
        SS.Audio.unlock();
      });
      canvas.addEventListener('pointermove', toLocal);
      window.addEventListener('pointerup', () => {
        this.pointer.down = false;
      });
      if (SS.Touch) SS.Touch.init(canvas);
    },

    // Read gamepads (first two) and the touch buttons into virtual keys.
    poll() {
      if (SS.Touch) SS.Touch.poll();
      if (!navigator.getGamepads) return;
      const pads = navigator.getGamepads();
      for (let i = 0; i < 2; i++) {
        const gp = pads[i];
        const st = {};
        if (gp) {
          const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
          const b = (n) => !!(gp.buttons[n] && gp.buttons[n].pressed);
          st.Left = ax < -0.4 || b(14);
          st.Right = ax > 0.4 || b(15);
          st.Up = ay < -0.6 || b(12);
          st.Down = ay > 0.6 || b(13) || b(4);
          st.R = b(5) || b(7);
          st.A = b(0);
          st.B = b(1);
          st.X = b(2);
          st.Y = b(3);
          st.Start = b(9);
        }
        for (const k of ['Left', 'Right', 'Up', 'Down', 'A', 'B', 'X', 'Y', 'R', 'Start']) {
          const code = 'Pad' + i + k;
          const now = !!st[k];
          if (now && !this._padPrev[code]) { this.pressed[code] = true; this.lastDevice = 'pad'; }
          this.keys[code] = now;
          this._padPrev[code] = now;
        }
      }
    },

    anyPressed() { return Object.keys(this.pressed).length > 0 || this.pointer.pressed; },
    down(code) { return !!this.keys[code]; },
    hit(code) { return !!this.pressed[code]; },
    anyDown(codes) { return codes.some((c) => this.keys[c]); },
    anyHit(codes) { return codes.some((c) => this.pressed[c]); },

    endFrame() {
      this.pressed = {};
      this.pointer.pressed = false;
    },
  });

  // ---------- Control schemes ----------
  const P1 = {
    left: ['KeyA', 'Pad0Left', 'TouchLeft'],
    right: ['KeyD', 'Pad0Right', 'TouchRight'],
    up: ['KeyW', 'Pad0Up', 'Pad0A', 'TouchJump'],
    down: ['KeyS', 'Pad0Down', 'TouchDown'],
    slap: ['KeyF', 'Pad0X', 'TouchSlap'],
    heavy: ['KeyG', 'Pad0Y', 'TouchHeavy'],
    special: ['KeyH', 'Pad0B', 'TouchSpecial'],
    shoot: ['KeyR', 'Pad0R', 'TouchShoot'],
  };
  const P2 = {
    left: ['ArrowLeft', 'Pad1Left'],
    right: ['ArrowRight', 'Pad1Right'],
    up: ['ArrowUp', 'Pad1Up', 'Pad1A'],
    down: ['ArrowDown', 'Pad1Down'],
    slap: ['Comma', 'Numpad1', 'Pad1X'],
    heavy: ['Period', 'Numpad2', 'Pad1Y'],
    special: ['Slash', 'Numpad3', 'Pad1B'],
    shoot: ['Semicolon', 'Numpad4', 'Pad1R'],
  };
  // Solo play accepts both halves of the keyboard plus J/K/L and Space.
  const SOLO = {};
  for (const k of Object.keys(P1)) SOLO[k] = P1[k].concat(P2[k]);
  SOLO.up.push('Space');
  SOLO.slap.push('KeyJ');
  SOLO.heavy.push('KeyK');
  SOLO.special.push('KeyL');

  SS.Controls = { P1, P2, SOLO };

  // Turn a scheme into the plain "controller state" fighters understand.
  SS.readControls = function (scheme) {
    return {
      left: I.anyDown(scheme.left),
      right: I.anyDown(scheme.right),
      down: I.anyDown(scheme.down),
      jumpP: I.anyHit(scheme.up),
      slapP: I.anyHit(scheme.slap),
      heavyP: I.anyHit(scheme.heavy),
      specialP: I.anyHit(scheme.special),
      shootP: I.anyHit(scheme.shoot),
    };
  };

  // Menu helpers
  SS.Menu = {
    up: () => I.anyHit(['ArrowUp', 'KeyW', 'Pad0Up', 'Pad1Up']),
    down: () => I.anyHit(['ArrowDown', 'KeyS', 'Pad0Down', 'Pad1Down']),
    left: () => I.anyHit(['ArrowLeft', 'KeyA', 'Pad0Left', 'Pad1Left']),
    right: () => I.anyHit(['ArrowRight', 'KeyD', 'Pad0Right', 'Pad1Right']),
    confirm: () => I.anyHit(['Enter', 'Space', 'KeyF', 'Pad0A', 'Pad1A', 'Pad0Start']),
    back: () => I.anyHit(['Escape', 'Backspace', 'Pad0B', 'Pad1B']),
    pause: () => I.anyHit(['Escape', 'KeyP', 'Pad0Start', 'Pad1Start', 'TouchPause']),
  };
})();
