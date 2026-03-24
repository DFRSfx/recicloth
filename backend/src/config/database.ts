import dotenv from 'dotenv';
import { Pool, PoolClient } from 'pg';

dotenv.config();

const rawHost = process.env.DB_HOST || 'localhost';
const rawPort = Number(process.env.DB_PORT || 5432);
const rawDatabase = process.env.DB_NAME || 'postgres';
const rawUser = process.env.DB_USER || 'postgres';

const isSupabaseHost =
  rawHost.includes('supabase.co') || rawHost.includes('pooler.supabase.com');

const normalizedPort = rawPort === 3306 ? 5432 : rawPort;
if (rawPort === 3306) {
  console.warn('⚠️ DB_PORT=3306 detected (MySQL default). Using 5432 for PostgreSQL.');
}

if (rawHost === 'localhost' && rawDatabase === 'arte_em_ponto') {
  console.warn('⚠️ MySQL-looking DB settings detected. Please update backend/.env to PostgreSQL values.');
}

const toPgParams = (sql: string): string => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

const adaptSql = (sql: string): string => {
  const withParams = toPgParams(sql);
  const isInsert = /^\s*INSERT\s+INTO/i.test(withParams);
  const hasReturning = /\bRETURNING\b/i.test(withParams);
  if (isInsert && !hasReturning) {
    return `${withParams.trimEnd()} RETURNING *`;
  }
  return withParams;
};

const pgPool = new Pool({
  host: rawHost,
  port: normalizedPort,
  user: rawUser,
  password: process.env.DB_PASSWORD || '',
  database: rawDatabase,
  max: 10,
  ssl: process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && isSupabaseHost)
    ? { rejectUnauthorized: false }
    : false
});

class PgConnectionCompat {
  constructor(private readonly client: PoolClient) {}

  async beginTransaction() {
    await this.client.query('BEGIN');
  }

  async commit() {
    await this.client.query('COMMIT');
  }

  async rollback() {
    await this.client.query('ROLLBACK');
  }

  async query(sql: string, params: any[] = []) {
    const result = await this.client.query(adaptSql(sql), params);
    if (result.command === 'SELECT') {
      return [result.rows] as const;
    }
    return [{ affectedRows: result.rowCount, insertId: result.rows?.[0]?.id, rows: result.rows }] as const;
  }

  async execute(sql: string, params: any[] = []) {
    return this.query(sql, params);
  }

  release() {
    this.client.release();
  }
}

const pool = {
  async query<T = any>(sql: string, params: any[] = []) {
    const result = await pgPool.query(adaptSql(sql), params);
    if (result.command === 'SELECT') {
      return [result.rows as T[]] as const;
    }
    return [{ affectedRows: result.rowCount, insertId: (result.rows as any[])?.[0]?.id, rows: result.rows }] as const;
  },

  async execute<T = any>(sql: string, params: any[] = []) {
    const result = await pgPool.query(adaptSql(sql), params);
    if (result.command === 'SELECT') {
      return [result.rows as T[]] as const;
    }
    return [{ affectedRows: result.rowCount, insertId: (result.rows as any[])?.[0]?.id, rows: result.rows }] as const;
  },

  async getConnection() {
    const client = await pgPool.connect();
    return new PgConnectionCompat(client);
  }
};

pgPool.connect()
  .then(client => {
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err.message);
  });

export default pool;
