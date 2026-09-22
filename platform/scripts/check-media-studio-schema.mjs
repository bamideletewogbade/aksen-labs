import { neon } from '@neondatabase/serverless';

process.loadEnvFile('.env');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
const q = neon(process.env.DATABASE_URL);
const rows = await q.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('media_episodes','media_render_jobs') ORDER BY table_name");
console.log('Media Studio tables: ' + (rows.map((row) => row.table_name).join(', ') || 'none'));
const columns = await q.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='media_episodes' AND column_name IN ('channel_posts','proof_checks') ORDER BY column_name");
console.log('Episode workflow columns: ' + (columns.map((row) => row.column_name).join(', ') || 'none'));
const counts = await q.query("SELECT (SELECT count(*) FROM media_episodes) AS episodes, (SELECT count(*) FROM media_render_jobs) AS video_jobs, (SELECT count(*) FROM media_assets WHERE kind='image') AS images, (SELECT coalesce(sum(length(url)),0) FROM media_assets WHERE kind='image') AS image_url_chars");
console.log('Media Studio row counts: ' + JSON.stringify(counts[0]));
const jev = await q.query("SELECT count(*)::int AS evaluations FROM media_jev_evaluations");
const jevColumns = await q.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='media_jev_evaluations' AND column_name IN ('provider','answers','selected_angle','outcome','cost_micros') ORDER BY column_name");
console.log('Jev evaluation columns: ' + jevColumns.map((row) => row.column_name).join(', '));
console.log('Jev evaluation rows: ' + jev[0].evaluations);
