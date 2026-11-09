// Local dev API only. `ng serve` proxies /api here (see proxy.conf.json).
// In production the same logic runs as the Vercel function in api/dashboard.js.
import 'dotenv/config';
import express from 'express';
import { dashboard } from './handler.js';

const app = express();
const PORT = Number(process.env.API_PORT) || 3111;

app.disable('x-powered-by');

app.get('/api/dashboard', async (req, res) => {
  const { status, body } = await dashboard({ refresh: req.query.refresh === '1', key: req.get('x-dashboard-key') || '' });
  res.status(status).set('Cache-Control', 'private, no-store').json(body);
});

app.listen(PORT, () => {
  console.log(`Dashboard API → http://localhost:${PORT}/api/dashboard  (${process.env.MOCK === '1' ? 'DEMO data' : 'live ClickUp'})`);
});
