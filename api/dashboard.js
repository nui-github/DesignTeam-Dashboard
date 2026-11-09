// Vercel serverless function: GET /api/dashboard
// The ClickUp token lives only in Vercel env vars and never reaches the browser.
import { dashboard } from '../server/handler.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { status, body } = await dashboard({
    refresh: req.query?.refresh === '1',
    key: req.headers['x-dashboard-key'] || '',
  });

  // `private`: never let a shared CDN cache keep a response that may be password-protected.
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(status).json(body);
}
