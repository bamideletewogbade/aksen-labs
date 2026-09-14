import { neon } from '@neondatabase/serverless';
import { loadProspecting } from './prospecting-runtime.mjs';
process.loadEnvFile('.env');
const campaignId = process.argv[2];
if (!campaignId || !/^[a-f\d-]{36}$/.test(campaignId))
  throw new Error('Provide a saved campaign UUID.');
const sql = neon(process.env.DATABASE_URL);
const rows = await sql.query(
  'SELECT owner_id FROM prospect_campaigns WHERE id=$1',
  [campaignId],
);
if (!rows.length) throw new Error('Saved campaign not found.');
try {
  const { runProspecting } = await loadProspecting();
  console.log(
    JSON.stringify(
      await runProspecting(rows[0].owner_id, campaignId, {
        scheduled: !process.argv.includes('--now'),
      }),
    ),
  );
} catch {
  console.error(
    'Prospecting failed. Review saved search runs and AI activity.',
  );
  process.exitCode = 1;
}
