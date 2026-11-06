// Wi-Fi co-op client. Talks to the relay in tools/share_server.py:
//   POST /net/host, /net/join, /net/send, /net/leave   +   GET /net/events (Server-Sent Events)
// Only works when the game was opened from share-on-network.command (http://...), not file://.
(function () {
  const HEADERS = { 'Content-Type': 'application/json', 'X-Sloth': '1' };

  const N = (SS.Net = {
    role: null,        // 'host' | 'guest' | null
    id: null,          // player slot: 0 = host, 1..3 = guests
    token: null,
    code: null,
    address: null,
    es: null,
    status: 'off',     // 'off' | 'connecting' | 'connected' | 'reconnecting'
    onMessage: null,   // set by the current scene: (message, fromId) => void
    lastHeard: 0,
    inflight: 0,

    available() { return location.protocol === 'http:' || location.protocol === 'https:'; },
    get active() { return !!this.role; },

    async api(path, body) {
      const r = await fetch(path, { method: 'POST', headers: HEADERS, body: JSON.stringify(body || {}) });
      let data = {};
      try { data = await r.json(); } catch (e) { /* empty reply */ }
      if (!r.ok) throw new Error(data.error || 'Could not reach the host (error ' + r.status + ').');
      return data;
    },

    async host() {
      const d = await this.api('/net/host');
      Object.assign(this, { role: 'host', id: 0, token: d.token, code: d.code, address: d.address });
      this.open();
      SS.Engine.startHostTicker();
      return d;
    },

    async join(code) {
      const d = await this.api('/net/join', { code });
      Object.assign(this, { role: 'guest', id: d.id, token: d.token, code });
      this.open();
      return d;
    },

    open() {
      if (this.es) this.es.close();
      this.status = 'connecting';
      this.lastHeard = performance.now();
      const es = (this.es = new EventSource('/net/events?token=' + encodeURIComponent(this.token)));
      es.onopen = () => { this.status = 'connected'; this.lastHeard = performance.now(); };
      // CLOSED = the server no longer knows us (we were away too long, or the server restarted)
      es.onerror = () => { this.status = es.readyState === 2 ? 'closed' : 'reconnecting'; };
      es.onmessage = (e) => {
        this.lastHeard = performance.now();
        let msg;
        try { msg = JSON.parse(e.data); } catch (err) { return; }
        if (msg.from === 'server' && msg.m && msg.m.t === 'ping') return; // keep-alive: only resets the silence timer
        if (this.onMessage) this.onMessage(msg.m, msg.from);
      };
    },

    // Seconds since we last heard anything (the server pings every 10 s).
    silence() { return (performance.now() - this.lastHeard) / 1000; },

    // important = never skipped (inputs, start, picks); snapshots may be skipped if the network is busy.
    send(m, to = 'all', important = false) {
      if (!this.token) return false;
      if (!important && this.inflight > 2) return false;
      this.inflight++;
      fetch('/net/send?token=' + encodeURIComponent(this.token), {
        method: 'POST', headers: HEADERS, body: JSON.stringify({ to, m }),
      }).then((r) => { if (r.status === 403) this.status = 'closed'; })
        .catch(() => {}).finally(() => { this.inflight--; });
      return true;
    },

    // Host: open the game again with the SAME join code (after a lost connection / restarted window).
    async rehost() {
      const d = await this.api('/net/host', { code: this.code });
      Object.assign(this, { token: d.token, code: d.code, address: d.address || this.address });
      this.open();
    },

    // Player: join again with the remembered code (gets a fresh connection).
    async rejoin() {
      const d = await this.api('/net/join', { code: this.code });
      Object.assign(this, { id: d.id, token: d.token });
      this.open();
    },

    get lost() { return this.status === 'closed' || this.silence() > 12; },

    // What the join-code bar at the top shows (null when not in a Wi-Fi game).
    hudInfo() {
      if (!this.role || !this.code) return null;
      const address = this.role === 'host' ? (this.address || '').replace(/^https?:\/\//, '') : location.host;
      return { code: this.code, address, lost: this.lost || this.busy };
    },

    // Call every frame from Wi-Fi screens: quietly reconnects if the connection broke.
    // onBack(role) runs after a host re-opened its game or a player rejoined.
    maintain(dt, onBack) {
      if (!this.role || this.status === 'off') return; // never connected: nothing to repair
      this.retryT = (this.retryT || 0) - dt;
      if (this.busy || this.retryT > 0) return;
      if (this.status === 'closed') {
        this.busy = true;
        this.retryT = 3;
        (this.role === 'host' ? this.rehost() : this.rejoin())
          .then(() => { this.busy = false; this.lostFor = 0; if (onBack) onBack(this.role); })
          .catch(() => { this.busy = false; });
      } else if (this.silence() > 14) {
        this.retryT = 5;
        this.open(); // try the same connection again first
      }
    },

    leave() {
      if (this.token) {
        fetch('/net/leave?token=' + encodeURIComponent(this.token), {
          method: 'POST', headers: HEADERS, body: '{}', keepalive: true,
        }).catch(() => {});
      }
      if (this.es) this.es.close();
      if (this.role === 'host') SS.Engine.stopHostTicker();
      Object.assign(this, { role: null, id: null, token: null, code: null, es: null, status: 'off', onMessage: null });
    },
  });

  // Only really leave when the page is closed/reloaded. Phones also fire 'pagehide' when the
  // browser goes to the background (persisted = it may come back) - then we stay in the game.
  window.addEventListener('pagehide', (e) => { if (N.token && !e.persisted) N.leave(); });
  // Back from the lock screen / another app: reconnect right away instead of waiting.
  const comeBack = () => {
    if (!N.role || N.status === 'off') return;
    N.lastHeard = performance.now();
    if (N.status !== 'closed') N.open();
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) comeBack(); });
  window.addEventListener('pageshow', (e) => { if (e.persisted) comeBack(); });
})();
