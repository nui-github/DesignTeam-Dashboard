// Lists Workspace and Space ids so you can fill .env. Usage: npm run discover
import 'dotenv/config';
import { discover } from '../server/clickup.js';

if (!process.env.CLICKUP_TOKEN) {
  console.error('Set CLICKUP_TOKEN in .env first (see .env.example).');
  process.exit(1);
}

try {
  const teams = await discover(process.env.CLICKUP_TOKEN);
  for (const t of teams) {
    console.log(`\nWorkspace: ${t.name}   CLICKUP_TEAM_ID=${t.id}`);
    for (const s of t.spaces) console.log(`  Space: ${s.name.padEnd(30)} id=${s.id}`);
  }
  console.log('\nPut the Design team Space id(s) in CLICKUP_SPACE_IDS (comma-separated).');
} catch (e) {
  console.error(e.message, e.hint ? `\n${e.hint}` : '');
  process.exit(1);
}
