import dotenv from 'dotenv';
import { Pool, PoolClient } from 'pg';

dotenv.config();

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
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'postgres',
  max: 10,
  ssl: process.env.NODE_ENV === 'production'
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
    return this.query<T>(sql, params);
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
