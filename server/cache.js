// Tiny in-memory TTL cache. One entry is enough for this app.
export function createCache(ttlMs) {
  let value = null;
  let at = 0;
  let inflight = null;

  return {
    async get(loader, { force = false } = {}) {
      const fresh = value && Date.now() - at < ttlMs;
      if (fresh && !force) return { data: value, cachedAt: at, hit: true };
      // Collapse concurrent loads into one upstream fetch.
      if (!inflight) {
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
      const data = await inflight;
      return { data, cachedAt: at, hit: false };
    },
  };
}
