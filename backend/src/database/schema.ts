import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'maextria.db');
const db = new Database(dbPath);
export { db };

// Ativar foreign keys
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Tabela de usuários
  db.exec(`
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

  const cpfColumn = db.prepare("SELECT 1 FROM pragma_table_info('users') WHERE name = 'cpf'").get();
  if (!cpfColumn) {
    db.exec(`ALTER TABLE users ADD COLUMN cpf TEXT`);
  }
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf)`);

  // Tabela de categorias
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tabela de cursos
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      teacher_id TEXT NOT NULL,
      cover_image TEXT,
      duration_hours INTEGER,
      difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
      certificate_price REAL DEFAULT 0,
      is_published INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      total_students INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tabela de módulos
  db.exec(`
    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // Tabela de aulas
  db.exec(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      video_url TEXT,
      duration_minutes INTEGER,
      order_index INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    )
  `);

  // Tabela de materiais complementares
  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_materials (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    )
  `);

  // Tabela de matrículas
  db.exec(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      progress REAL DEFAULT 0,
      completed INTEGER DEFAULT 0,
      enrolled_at INTEGER NOT NULL,
      completed_at INTEGER,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id)
    )
  `);

  // Tabela de progresso de aulas
  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      enrollment_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at INTEGER,
      FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
      UNIQUE(enrollment_id, lesson_id)
    )
  `);

  // Tabela de certificados
  db.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      enrollment_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      price REAL NOT NULL,
      teacher_share REAL NOT NULL,
      admin_share REAL NOT NULL,
      payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'refunded')),
      payment_date INTEGER,
      issued_at INTEGER NOT NULL,
      FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(enrollment_id)
    )
  `);

  // Tabela de configurações do sistema
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Tabela de analytics/métricas
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      user_id TEXT,
      course_id TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
    )
  `);

  // Inserir configuração padrão de partilha de lucros
  const defaultProfitShare = db.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value, updated_at)
    VALUES (?, ?, ?)
  `);

  defaultProfitShare.run('admin_profit_share', '30', Date.now());

  console.log('✅ Database schema initialized successfully');
}

export default db;
