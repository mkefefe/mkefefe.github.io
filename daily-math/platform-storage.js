/* Bridge-only persistence in the Playgama build. Restore before loading game assets.
 * https://wiki.playgama.com/playgama/bridge-sdk/api/storage
 * Sync facade serves restored memory; meaningful game saves batch through Bridge.
 */
(function (root) {
  'use strict';
  const hosted = root.DAILY_PLATFORM_CONFIG?.enabled === true;
  const cache = new Map(), dirty = new Map(), listeners = new Set();
  let initialization, initialized = false, writable = false, writing = null, scheduled = false;
  let status = hosted ? 'loading' : 'local';
  const publish = value => { status = value; for (const fn of listeners) { try { fn(status); } catch (_) {} } };
  function keysForGame() {
    const keys = ['daily-math-v1', 'daily-math-player'];
    const config = root.DAILY_SCORE_CONFIG;
    // Match online-scores.js: endpoint presence enables the service. Invalid
    // configuration must not prevent the offline game from booting.
    if (config?.endpoint) {
      try { keys.push('daily-math-online-v1:' + encodeURIComponent(new URL(config.endpoint).origin)); } catch (_) {}
    }
    return keys;
  }
  function initialize(keys = keysForGame()) {
    if (initialization) return initialization;
    if (!hosted) { initialized = true; return (initialization = Promise.resolve(true)); }
    initialization = (async () => {
      let timer;
      try {
        if (!await root.DailyPlatform.initialize()) throw new Error('Platform unavailable');
        const unique = [...new Set(keys)];
        const values = await Promise.race([
          // Bridge v2 defaults parse=true and otherwise JSON-decodes our JSON
          // strings into objects. This facade must preserve localStorage strings.
          root.bridge.storage.get(unique, false),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Save restore timed out')), 10000); })
        ]);
        if (!Array.isArray(values) || values.length !== unique.length) throw new Error('Invalid saved data');
        unique.forEach((key, index) => {
          const value = values[index];
          cache.set(key, value == null ? null : typeof value === 'string' ? value : JSON.stringify(value));
        });
        initialized = true; writable = true; publish('ready'); return true;
      } catch (_) {
        // Do not overwrite an existing cloud save with defaults after a failed read.
        initialized = true; writable = false; publish('session-only'); return false;
      } finally { clearTimeout(timer); }
    })();
    return initialization;
  }
  function requireReady() { if (!initialized) throw new Error('Await DailyStorage.initialize before loading the game'); }
  function getItem(key) {
    requireReady();
    return hosted ? (cache.get(String(key)) ?? null) : root.localStorage.getItem(key);
  }
  function schedule() {
    if (scheduled || !writable) return;
    scheduled = true;
    Promise.resolve().then(() => { scheduled = false; void flush(); });
  }
  function setItem(key, value) {
    requireReady();
    if (!hosted) return root.localStorage.setItem(key, value);
    key = String(key); value = String(value);
    cache.set(key, value); dirty.set(key, value); schedule();
  }
  function removeItem(key) {
    requireReady();
    if (!hosted) return root.localStorage.removeItem(key);
    key = String(key); cache.delete(key); dirty.set(key, null); schedule();
  }
  function flush() {
    if (!hosted) return Promise.resolve(true);
    if (!writable) return Promise.resolve(false);
    if (writing) return writing;
    if (!dirty.size) return Promise.resolve(true);
    writing = Promise.resolve().then(async () => {
      try {
        while (dirty.size) {
          const entries = [...dirty]; dirty.clear();
          try {
            await root.bridge.storage.set(entries.map(([key]) => key), entries.map(([, value]) => value));
          } catch (_) {
            // Keep newer changes; retry at the next meaningful save or explicit flush.
            for (const [key, value] of entries) if (!dirty.has(key)) dirty.set(key, value);
            publish('save-error'); return false;
          }
        }
        publish('ready'); return true;
      } finally { writing = null; }
    });
    return writing;
  }
  function onChange(fn) {
    listeners.add(fn); try { fn(status); } catch (_) {}
    return () => listeners.delete(fn);
  }
  root.DailyStorage = Object.freeze({ initialize, getItem, setItem, removeItem, flush, onChange, status: () => status });
})(window);
