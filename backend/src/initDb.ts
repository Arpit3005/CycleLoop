import { ensurePostgresRunning } from './embeddedDb.js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('[InitDb] Starting database service...');
  const dbUrl = await ensurePostgresRunning(5432);
  console.log(`[InitDb] Postgres ready at: ${dbUrl}`);

  console.log('[InitDb] Pushing Prisma schema to PostgreSQL...');
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl }
  });

  console.log('[InitDb] Generating Prisma client...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl }
  });

  console.log('[InitDb] Database initialized successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[InitDb] Failed to initialize database:', err);
  process.exit(1);
});
