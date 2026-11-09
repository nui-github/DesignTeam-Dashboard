// Tiny in-memory cache with stale-while-revalidate. One entry is enough for this app.
//  - fresh (younger than ttl): served as is
//  - stale: served immediately, and refreshed in the background (viewers never wait for ClickUp after the first load)
//  - force (Refresh button): waits for a new load
// A failed background refresh keeps the old value; only the very first load can throw.
export function createCache(ttlMs) {
  let value = null;
  let at = 0;
  let inflight = null;

  const load = (loader) => {
    if (!inflight) {
      // Collapse concurrent loads into one upstream fetch.
      inflight = loader()
        .then((v) => {
          value = v;
          at = Date.now();
          return v;
        })
        .finally(() => {
          inflight = null;
        });
    }
    return inflight;
  };

  return {
    async get(loader, { force = false } = {}) {
      if (value && !force) {
        if (Date.now() - at >= ttlMs) {
          load(loader).catch((e) => console.error('Background refresh failed:', e.message));
        }
        return { data: value, cachedAt: at, hit: true };
      }
      const data = await load(loader);
      return { data, cachedAt: at, hit: false };
    },
  };
}
