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
      es.onerror = () => { this.status = 'reconnecting'; };
      es.onmessage = (e) => {
        this.lastHeard = performance.now();
        let msg;
        try { msg = JSON.parse(e.data); } catch (err) { return; }
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
      }).catch(() => {}).finally(() => { this.inflight--; });
      return true;
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

  window.addEventListener('pagehide', () => { if (N.token) N.leave(); });
})();
