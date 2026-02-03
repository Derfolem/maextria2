import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db, initDatabase } from '../database/schema';
import { generateToken } from '../utils/auth';
import coursesRoutes from './courses';

const app = express();
app.use(express.json());
app.use('/api/courses', coursesRoutes);

const ADMIN_ID = 'admin-test-001';
const TEACHER_ID = 'teacher-test-001';

const adminToken = generateToken({ userId: ADMIN_ID, email: 'admin@test.com', role: 'admin' });
const teacherToken = generateToken({ userId: TEACHER_ID, email: 'teacher@test.com', role: 'teacher' });

beforeAll(() => {
  initDatabase();

  db.prepare(`
    INSERT INTO users (id, email, password, name, role, cpf, created_at, updated_at)
    VALUES (?, ?, 'hash', ?, ?, ?, ?, ?)
  `).run(ADMIN_ID, 'admin@test.com', 'Admin Test', 'admin', '11144477735', Date.now(), Date.now());

  db.prepare(`
    INSERT INTO users (id, email, password, name, role, cpf, created_at, updated_at)
    VALUES (?, ?, 'hash', ?, ?, ?, ?, ?)
  `).run(TEACHER_ID, 'teacher@test.com', 'Teacher Test', 'teacher', '22255588846', Date.now(), Date.now());
});

beforeEach(() => {
  db.prepare('DELETE FROM lessons').run();
  db.prepare('DELETE FROM modules').run();
  db.prepare('DELETE FROM courses').run();
});

describe('POST /api/courses/bulk', () => {
  it('importa múltiplos cursos com módulos e aulas', async () => {
    const courses = [
      {
        title: 'Curso A',
        description: 'Descrição A',
        difficulty: 'beginner',
        price: 49.90,
        modules: [
          {
            title: 'Módulo 1',
            description: 'Primeiro módulo',
            order_index: 0,
            lessons: [
              { title: 'Aula 1', content: 'Conteúdo 1', order_index: 0 },
              { title: 'Aula 2', content: 'Conteúdo 2', order_index: 1 },
            ],
          },
        ],
      },
      {
        title: 'Curso B',
        description: 'Descrição B',
        difficulty: 'intermediate',
        price: 79.90,
        modules: [
          {
            title: 'Módulo 1',
            order_index: 0,
            lessons: [
              { title: 'Intro', content: 'Introdução', order_index: 0 },
            ],
          },
          {
            title: 'Módulo 2',
            order_index: 1,
            lessons: [
              { title: 'Avançado', content: 'Conteúdo avançado', order_index: 0 },
            ],
          },
        ],
      },
    ];

    const res = await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courses });

    expect(res.status).toBe(201);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0]).toMatchObject({ title: 'Curso A', modules: 1, lessons: 2 });
    expect(res.body.results[1]).toMatchObject({ title: 'Curso B', modules: 2, lessons: 2 });

    const dbCourses = db.prepare('SELECT * FROM courses').all();
    expect(dbCourses).toHaveLength(2);

    const dbModules = db.prepare('SELECT * FROM modules').all();
    expect(dbModules).toHaveLength(3);

    const dbLessons = db.prepare('SELECT * FROM lessons').all();
    expect(dbLessons).toHaveLength(4);
  });

  it('atribui teacher_id personalizado quando informado', async () => {
    const courses = [{
      title: 'Curso com Teacher',
      description: 'Teste',
      modules: [{ title: 'Mod', order_index: 0, lessons: [{ title: 'Aula', order_index: 0 }] }],
    }];

    const res = await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courses, teacher_id: TEACHER_ID });

    expect(res.status).toBe(201);

    const course = db.prepare('SELECT teacher_id FROM courses WHERE title = ?').get('Curso com Teacher') as any;
    expect(course.teacher_id).toBe(TEACHER_ID);
  });

  it('usa userId do admin quando teacher_id não é informado', async () => {
    const courses = [{
      title: 'Curso sem Teacher',
      description: 'Teste',
      modules: [{ title: 'Mod', order_index: 0, lessons: [{ title: 'Aula', order_index: 0 }] }],
    }];

    const res = await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courses });

    expect(res.status).toBe(201);

    const course = db.prepare('SELECT teacher_id FROM courses WHERE title = ?').get('Curso sem Teacher') as any;
    expect(course.teacher_id).toBe(ADMIN_ID);
  });

  it('preserva order_index das aulas dentro de cada módulo', async () => {
    const courses = [{
      title: 'Curso Ordenado',
      modules: [{
        title: 'Módulo 1',
        order_index: 0,
        lessons: [
          { title: 'Terceira', order_index: 2 },
          { title: 'Primeira', order_index: 0 },
          { title: 'Segunda', order_index: 1 },
        ],
      }],
    }];

    const res = await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courses });

    expect(res.status).toBe(201);

    const lessons = db.prepare('SELECT title, order_index FROM lessons ORDER BY order_index').all() as any[];
    expect(lessons[0]).toMatchObject({ title: 'Primeira', order_index: 0 });
    expect(lessons[1]).toMatchObject({ title: 'Segunda', order_index: 1 });
    expect(lessons[2]).toMatchObject({ title: 'Terceira', order_index: 2 });
  });

  it('todos os cursos ficam com is_published = 0', async () => {
    const courses = [
      { title: 'Rascunho 1', modules: [{ title: 'M', order_index: 0, lessons: [{ title: 'A', order_index: 0 }] }] },
      { title: 'Rascunho 2', modules: [{ title: 'M', order_index: 0, lessons: [{ title: 'A', order_index: 0 }] }] },
    ];

    await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courses });

    const published = db.prepare('SELECT is_published FROM courses').all() as any[];
    expect(published.every(c => c.is_published === 0)).toBe(true);
  });

  // --- Validação ---

  it('retorna 400 quando título está faltando', async () => {
    const courses = [{ title: '', modules: [{ title: 'Mod', order_index: 0, lessons: [] }] }];

    const res = await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courses });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].error).toBe('Título é obrigatório');
  });

  it('retorna 400 quando módulos estão faltando', async () => {
    const courses = [{ title: 'Sem Módulos', modules: [] }];

    const res = await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courses });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].error).toBe('Pelo menos um módulo é necessário');
  });

  it('retorna 400 quando array de cursos está vazio', async () => {
    const res = await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courses: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Um array de cursos é necessário');
  });

  it('retorna 400 quando mais que 50 cursos são enviados', async () => {
    const courses = Array.from({ length: 51 }, (_, i) => ({
      title: `Curso ${i}`,
      modules: [{ title: 'Mod', order_index: 0, lessons: [{ title: 'Aula', order_index: 0 }] }],
    }));

    const res = await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courses });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Limite máximo de 50 cursos por importação');
  });

  it('não insere nada quando um dos cursos falha na validação', async () => {
    const courses = [
      {
        title: 'Curso Válido',
        modules: [{ title: 'Mod', order_index: 0, lessons: [{ title: 'Aula', order_index: 0 }] }],
      },
      {
        title: '', // inválido
        modules: [{ title: 'Mod', order_index: 0, lessons: [] }],
      },
    ];

    const res = await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courses });

    expect(res.status).toBe(400);

    const dbCourses = db.prepare('SELECT * FROM courses').all();
    expect(dbCourses).toHaveLength(0);
  });

  // --- Autenticação / Autorização ---

  it('retorna 403 para usuário teacher (não-admin)', async () => {
    const courses = [{
      title: 'Tentativa Teacher',
      modules: [{ title: 'Mod', order_index: 0, lessons: [{ title: 'Aula', order_index: 0 }] }],
    }];

    const res = await request(app)
      .post('/api/courses/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ courses });

    expect(res.status).toBe(403);
  });

  it('retorna 401 quando nenhum token é enviado', async () => {
    const res = await request(app)
      .post('/api/courses/bulk')
      .send({ courses: [{ title: 'Sem Token' }] });

    expect(res.status).toBe(401);
  });
});
