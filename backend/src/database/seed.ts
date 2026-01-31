import { v4 as uuidv4 } from 'uuid';
import db, { initDatabase } from './schema';
import { hashPassword } from '../utils/auth';

async function seed() {
  console.log('🌱 Starting database seed...');

  initDatabase();

  const now = Date.now();

  // Criar usuários de exemplo
  const adminId = uuidv4();
  const teacher1Id = uuidv4();
  const teacher2Id = uuidv4();
  const student1Id = uuidv4();
  const student2Id = uuidv4();

  const hashedPassword = await hashPassword('senha123');

  const users = [
    {
      id: adminId,
      email: 'admin@maextria.com',
      password: hashedPassword,
      name: 'Administrador MAEXTRIA',
      role: 'admin',
      cpf: '24860890205',
      email_verified: 1
    },
    {
      id: teacher1Id,
      email: 'prof.maria@maextria.com',
      password: hashedPassword,
      name: 'Professora Maria Silva',
      role: 'teacher',
      cpf: '37203855317',
      email_verified: 1
    },
    {
      id: teacher2Id,
      email: 'prof.joao@maextria.com',
      password: hashedPassword,
      name: 'Professor João Santos',
      role: 'teacher',
      cpf: '69777727437',
      email_verified: 1
    },
    {
      id: student1Id,
      email: 'aluno1@example.com',
      password: hashedPassword,
      name: 'Ana Oliveira',
      role: 'student',
      cpf: '80165640383',
      email_verified: 1
    },
    {
      id: student2Id,
      email: 'aluno2@example.com',
      password: hashedPassword,
      name: 'Carlos Mendes',
      role: 'student',
      cpf: '99687615915',
      email_verified: 1
    }
  ];

  const userStmt = db.prepare(`
    INSERT INTO users (id, email, password, name, role, cpf, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    userStmt.run(
      user.id,
      user.email,
      user.password,
      user.name,
      user.role,
      user.cpf,
      user.email_verified,
      now,
      now
    );
  }

  console.log('✅ Users created');

  // Criar categorias
  const categories = [
    { id: uuidv4(), name: 'Desenvolvimento Web', description: 'Cursos de programação web, frontend e backend', created_by: adminId },
    { id: uuidv4(), name: 'Design Gráfico', description: 'Cursos de design, UI/UX e ferramentas criativas', created_by: adminId },
    { id: uuidv4(), name: 'Marketing Digital', description: 'Estratégias de marketing online e redes sociais', created_by: adminId },
    { id: uuidv4(), name: 'Gestão e Negócios', description: 'Administração, empreendedorismo e liderança', created_by: adminId },
    { id: uuidv4(), name: 'Idiomas', description: 'Cursos de línguas estrangeiras', created_by: teacher1Id },
    { id: uuidv4(), name: 'Saúde e Bem-estar', description: 'Cursos de nutrição, fitness e qualidade de vida', created_by: teacher2Id }
  ];

  const catStmt = db.prepare(`
    INSERT INTO categories (id, name, description, created_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const cat of categories) {
    catStmt.run(cat.id, cat.name, cat.description, cat.created_by, now);
  }

  console.log('✅ Categories created');

  // Criar cursos
  const courses = [
    {
      id: uuidv4(),
      title: 'JavaScript Moderno: Do Zero ao Avançado',
      description: 'Aprenda JavaScript desde os fundamentos até técnicas avançadas. Inclui ES6+, Async/Await, e muito mais.',
      category_id: categories[0].id,
      teacher_id: teacher1Id,
      duration_hours: 40,
      difficulty: 'intermediate',
      certificate_price: 49.90,
      is_published: 1,
      cover_image: '/hero-01.png'
    },
    {
      id: uuidv4(),
      title: 'React: Desenvolvimento de Aplicações Modernas',
      description: 'Domine React e crie aplicações web profissionais com hooks, context API e melhores práticas.',
      category_id: categories[0].id,
      teacher_id: teacher1Id,
      duration_hours: 35,
      difficulty: 'intermediate',
      certificate_price: 59.90,
      is_published: 1,
      cover_image: '/hero-02.png'
    },
    {
      id: uuidv4(),
      title: 'Design UI/UX Completo',
      description: 'Aprenda a criar interfaces incríveis e experiências de usuário memoráveis com Figma e princípios de design.',
      category_id: categories[1].id,
      teacher_id: teacher2Id,
      duration_hours: 30,
      difficulty: 'beginner',
      certificate_price: 39.90,
      is_published: 1,
      cover_image: '/hero-03.png'
    },
    {
      id: uuidv4(),
      title: 'Marketing Digital para Iniciantes',
      description: 'Descubra como promover seu negócio online com estratégias de SEO, redes sociais e marketing de conteúdo.',
      category_id: categories[2].id,
      teacher_id: teacher2Id,
      duration_hours: 25,
      difficulty: 'beginner',
      certificate_price: 34.90,
      is_published: 1,
      cover_image: '/hero-04.png'
    },
    {
      id: uuidv4(),
      title: 'Python para Data Science',
      description: 'Mergulhe no mundo da ciência de dados com Python, pandas, numpy e visualização de dados.',
      category_id: categories[0].id,
      teacher_id: teacher1Id,
      duration_hours: 50,
      difficulty: 'advanced',
      certificate_price: 69.90,
      is_published: 1,
      cover_image: '/hero-05.png'
    },
    {
      id: uuidv4(),
      title: 'Gestão de Projetos Ágeis',
      description: 'Aprenda metodologias ágeis como Scrum e Kanban para gerenciar projetos com eficiência.',
      category_id: categories[3].id,
      teacher_id: adminId,
      duration_hours: 20,
      difficulty: 'intermediate',
      certificate_price: 44.90,
      is_published: 1,
      cover_image: '/hero-06.png'
    },
    {
      id: uuidv4(),
      title: 'Inglês para Negócios',
      description: 'Desenvolva suas habilidades em inglês para contextos profissionais e corporativos.',
      category_id: categories[4].id,
      teacher_id: teacher1Id,
      duration_hours: 60,
      difficulty: 'intermediate',
      certificate_price: 79.90,
      is_published: 1,
      cover_image: '/hero-07.png'
    },
    {
      id: uuidv4(),
      title: 'Nutrição e Alimentação Saudável',
      description: 'Aprenda os fundamentos da nutrição e como criar um plano alimentar equilibrado.',
      category_id: categories[5].id,
      teacher_id: teacher2Id,
      duration_hours: 15,
      difficulty: 'beginner',
      certificate_price: 29.90,
      is_published: 1,
      cover_image: '/banners/maextria-banner-gratis.png'
    }
  ];

  const courseStmt = db.prepare(`
    INSERT INTO courses (
      id, title, description, category_id, teacher_id,
      duration_hours, difficulty, certificate_price, is_published,
      cover_image, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const course of courses) {
    courseStmt.run(
      course.id,
      course.title,
      course.description,
      course.category_id,
      course.teacher_id,
      course.duration_hours,
      course.difficulty,
      course.certificate_price,
      course.is_published,
      course.cover_image,
      now,
      now
    );
  }

  console.log('✅ Courses created');

  // Criar módulos e aulas para o primeiro curso
  const course1 = courses[0];
  const modules = [
    {
      id: uuidv4(),
      course_id: course1.id,
      title: 'Introdução ao JavaScript',
      description: 'Fundamentos da linguagem JavaScript',
      order_index: 0
    },
    {
      id: uuidv4(),
      course_id: course1.id,
      title: 'Funções e Escopo',
      description: 'Trabalhando com funções em JavaScript',
      order_index: 1
    },
    {
      id: uuidv4(),
      course_id: course1.id,
      title: 'Arrays e Objetos',
      description: 'Estruturas de dados essenciais',
      order_index: 2
    }
  ];

  const moduleStmt = db.prepare(`
    INSERT INTO modules (id, course_id, title, description, order_index, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const module of modules) {
    moduleStmt.run(module.id, module.course_id, module.title, module.description, module.order_index, now);
  }

  console.log('✅ Modules created');

  // Criar aulas
  const lessons = [
    {
      id: uuidv4(),
      module_id: modules[0].id,
      title: 'O que é JavaScript?',
      content: 'JavaScript é uma linguagem de programação essencial para desenvolvimento web...',
      video_url: 'https://www.youtube.com/watch?v=example1',
      duration_minutes: 15,
      order_index: 0
    },
    {
      id: uuidv4(),
      module_id: modules[0].id,
      title: 'Variáveis e Tipos de Dados',
      content: 'Nesta aula vamos aprender sobre variáveis (let, const, var) e tipos de dados primitivos...',
      video_url: 'https://www.youtube.com/watch?v=example2',
      duration_minutes: 20,
      order_index: 1
    },
    {
      id: uuidv4(),
      module_id: modules[0].id,
      title: 'Operadores e Expressões',
      content: 'Aprenda a trabalhar com operadores aritméticos, lógicos e de comparação...',
      video_url: 'https://www.youtube.com/watch?v=example3',
      duration_minutes: 18,
      order_index: 2
    },
    {
      id: uuidv4(),
      module_id: modules[1].id,
      title: 'Declaração de Funções',
      content: 'Diferentes formas de declarar funções em JavaScript...',
      video_url: 'https://www.youtube.com/watch?v=example4',
      duration_minutes: 25,
      order_index: 0
    },
    {
      id: uuidv4(),
      module_id: modules[1].id,
      title: 'Arrow Functions',
      content: 'Sintaxe moderna de funções com arrow functions (=>)...',
      video_url: 'https://www.youtube.com/watch?v=example5',
      duration_minutes: 22,
      order_index: 1
    }
  ];

  const lessonStmt = db.prepare(`
    INSERT INTO lessons (id, module_id, title, content, video_url, duration_minutes, order_index, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const lesson of lessons) {
    lessonStmt.run(
      lesson.id,
      lesson.module_id,
      lesson.title,
      lesson.content,
      lesson.video_url,
      lesson.duration_minutes,
      lesson.order_index,
      now
    );
  }

  console.log('✅ Lessons created');

  // Criar matrículas de exemplo
  const enrollments = [
    {
      id: uuidv4(),
      student_id: student1Id,
      course_id: courses[0].id,
      progress: 60,
      completed: 0
    },
    {
      id: uuidv4(),
      student_id: student1Id,
      course_id: courses[2].id,
      progress: 100,
      completed: 1
    },
    {
      id: uuidv4(),
      student_id: student2Id,
      course_id: courses[1].id,
      progress: 30,
      completed: 0
    }
  ];

  const enrollStmt = db.prepare(`
    INSERT INTO enrollments (id, student_id, course_id, progress, completed, enrolled_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const enroll of enrollments) {
    enrollStmt.run(enroll.id, enroll.student_id, enroll.course_id, enroll.progress, enroll.completed, now);
  }

  // Atualizar contagem de alunos
  db.prepare('UPDATE courses SET total_students = (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id)').run();

  console.log('✅ Enrollments created');

  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║            🌱 Database seeded successfully! 🌱        ║
║                                                       ║
║  Created:                                             ║
║  • 5 users (1 admin, 2 teachers, 2 students)          ║
║  • 6 categories                                       ║
║  • 8 courses                                          ║
║  • 3 modules                                          ║
║  • 5 lessons                                          ║
║  • 3 enrollments                                      ║
║                                                       ║
║  Test credentials:                                    ║
║  Admin:    admin@maextria.com / senha123              ║
║  Teacher:  prof.maria@maextria.com / senha123         ║
║  Student:  aluno1@example.com / senha123              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
}

seed().catch(console.error);
