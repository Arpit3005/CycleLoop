import EmbeddedPostgres from 'embedded-postgres';
import net from 'net';
import path from 'path';

let pgInstance: any = null;

function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, '127.0.0.1');
  });
}

export async function ensurePostgresRunning(port = 5432): Promise<string> {
  const isAvailable = await checkPortAvailable(port);
  const dbName = 'cycleloop';
  const user = 'postgres';
  const password = 'password';

  if (!isAvailable) {
    // Port is in use, assuming Postgres is already running on this port
    console.log(`[Postgres] Server detected listening on port ${port}.`);
    return `postgresql://${user}:${password}@127.0.0.1:${port}/${dbName}`;
  }

  // Not in use, start embedded postgres
  const dbDir = path.resolve(process.cwd(), 'pgdata');
  console.log(`[Postgres] Starting Embedded PostgreSQL on port ${port} (Data: ${dbDir})...`);

  // Type assertion since embedded-postgres exports default as class
  const PostgresConstructor = (EmbeddedPostgres as any).default || EmbeddedPostgres;
  pgInstance = new PostgresConstructor({
    databaseDir: dbDir,
    user,
    password,
    port,
    persistent: true,
    autoRehydrateSymlinks: true
  });

  try {
    await pgInstance.initialise();
  } catch (err: any) {
    // If already initialized, continue
    console.log('[Postgres] Cluster already initialized or resuming:', err.message || err);
  }

  await pgInstance.start();
  console.log(`[Postgres] Embedded PostgreSQL running on port ${port}`);

  try {
    await pgInstance.createDatabase(dbName);
    console.log(`[Postgres] Database '${dbName}' created or already exists.`);
  } catch (err: any) {
    // Database might already exist, safe to ignore
  }

  const databaseUrl = `postgresql://${user}:${password}@127.0.0.1:${port}/${dbName}`;
  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}

export async function stopEmbeddedPostgres(): Promise<void> {
  if (pgInstance) {
    try {
      await pgInstance.stop();
      console.log('[Postgres] Embedded PostgreSQL stopped.');
    } catch (err) {
      console.error('[Postgres] Error stopping Postgres:', err);
    }
  }
}
