import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'maextria.db');

let db: SqlJsDatabase;

async function initializeDatabase() {
  const SQL = await initSqlJs();

  // Tentar carregar banco existente
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

// Wrapper para compatibilidade com better-sqlite3
class DatabaseWrapper {
  private db: SqlJsDatabase | null = null;
  private initialized = false;

  async init() {
    if (!this.initialized) {
      this.db = await initializeDatabase();
      this.initialized = true;
    }
    return this.db!;
  }

  prepare(sql: string) {
    if (!this.db) throw new Error('Database not initialized');

    return {
      run: (...params: any[]) => {
        this.db!.run(sql, params);
        this.save();
        return { changes: this.db!.getRowsModified() };
      },
      get: (...params: any[]) => {
        const stmt = this.db!.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const result = stmt.getAsObject();
          stmt.free();
          return result;
        }
        stmt.free();
        return undefined;
      },
      all: (...params: any[]) => {
        const stmt = this.db!.prepare(sql);
        stmt.bind(params);
        const results: any[] = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }

  exec(sql: string) {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql);
    this.save();
  }

  pragma(pragma: string) {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(`PRAGMA ${pragma}`);
  }

  private save() {
    if (this.db) {
      const data = this.db.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    }
  }
}

const dbWrapper = new DatabaseWrapper();

export { dbWrapper as db };

export async function initDatabase() {
  await dbWrapper.init();

  // Ativar foreign keys
  dbWrapper.pragma('foreign_keys = ON');

  // Criar tabelas... (mesmo código das tabelas)
  dbWrapper.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
      cpf TEXT UNIQUE NOT NULL,
      phone TEXT,
      document TEXT,
      address TEXT,
      payment_info TEXT,
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      reset_token TEXT,
      reset_token_expiry INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  const cpfColumn = dbWrapper.prepare("SELECT 1 FROM pragma_table_info('users') WHERE name = 'cpf'").get();
  if (!cpfColumn) {
    dbWrapper.exec(`ALTER TABLE users ADD COLUMN cpf TEXT`);
  }
  dbWrapper.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf)`);

  // ... resto das tabelas igual ao schema original
  console.log('✅ Database initialized with sql.js');
}

export default dbWrapper;
