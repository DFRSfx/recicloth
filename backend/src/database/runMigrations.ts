import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../');
const schemaPath = path.join(repoRoot, 'db.sql');
const seedPath = path.join(__dirname, 'seed.sql');

const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT || 5432);
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'postgres';
const isSupabase = host.includes('supabase.co') || host.includes('pooler.supabase.com');
const ssl = process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && isSupabase)
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({ host, port, user, password, database, ssl });

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running PostgreSQL migrations...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query(seedSql);
    await client.query('COMMIT');

    console.log('✅ Migrations completed (schema + seed).');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
