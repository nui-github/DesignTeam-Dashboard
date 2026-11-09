// Framework-agnostic /api/dashboard logic. Used by:
//  - server/index.js   (local dev API behind the Angular proxy)
//  - api/dashboard.js  (Vercel serverless function)
import crypto from 'node:crypto';
import { fetchRaw, loadConfig, ClickUpError } from './clickup.js';
import { aggregate } from './aggregate.js';
import { createCache } from './cache.js';
import { mockRaw } from './mock.js';

const cache = createCache((Number(process.env.CACHE_TTL_SECONDS) || 300) * 1000);

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();

/** Optional shared password. Unset DASHBOARD_PASSWORD = open (fine on localhost, not on the public web). */
function authorised(key) {
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) return true;
  return crypto.timingSafeEqual(sha(key || ''), sha(pw));
}

/**
 * @param {{ refresh?: boolean, key?: string }} input
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function dashboard({ refresh = false, key = '' } = {}) {
  if (!authorised(key)) return { status: 401, body: { error: 'Unauthorised' } };

  const mock = process.env.MOCK === '1';
  try {
    const { data, cachedAt } = await cache.get(
      async () => {
        const raw = mock ? mockRaw() : await fetchRaw(loadConfig());
        return aggregate(raw, { mode: mock ? 'demo' : 'live' });
      },
      { force: refresh },
    );
    return { status: 200, body: { ...data, cachedAt } };
  } catch (e) {
    const known = e instanceof ClickUpError;
    if (!known) console.error(e);
    return { status: known ? 502 : 500, body: { error: e.message, hint: e.hint || null } };
  }
}
