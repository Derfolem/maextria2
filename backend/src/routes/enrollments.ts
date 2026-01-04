import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get my enrollments (student)
router.get('/my', authenticate, (req: Request, res: Response) => {
  try {
    const enrollments = db.prepare(`
      SELECT e.*, c.title as course_title, c.cover_image, c.difficulty,
             c.certificate_price, u.name as teacher_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(req.user!.userId);

    res.json(enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enroll in course
router.post('/', authenticate, (req: Request, res: Response) => {
  try {
    const { course_id } = req.body;

    if (!course_id) {
      res.status(400).json({ error: 'Course ID is required' });
      return;
    }

    // Verificar se o curso existe e está publicado
    const course = db.prepare('SELECT id, is_published FROM courses WHERE id = ?')
      .get(course_id) as { id: string; is_published: number } | undefined;

    if (!course || !course.is_published) {
      res.status(404).json({ error: 'Course not found or not published' });
      return;
    }

    // Verificar se já está matriculado
    const existing = db.prepare(`
      SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?
    `).get(req.user!.userId, course_id);

    if (existing) {
      res.status(400).json({ error: 'Already enrolled in this course' });
      return;
    }

    const enrollmentId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO enrollments (id, student_id, course_id, progress, completed, enrolled_at)
      VALUES (?, ?, ?, 0, 0, ?)
    `).run(enrollmentId, req.user!.userId, course_id, now);

    // Atualizar contagem de alunos
    db.prepare(`
      UPDATE courses SET total_students = total_students + 1 WHERE id = ?
    `).run(course_id);

    // Log analytics
    const analyticsId = uuidv4();
    db.prepare(`
      INSERT INTO analytics_events (id, event_type, user_id, course_id, created_at)
      VALUES (?, 'enrollment', ?, ?, ?)
    `).run(analyticsId, req.user!.userId, course_id, now);

    res.status(201).json({ id: enrollmentId, message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enrollment progress
router.get('/:enrollmentId/progress', authenticate, (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = db.prepare(`
      SELECT * FROM enrollments WHERE id = ? AND student_id = ?
    `).get(enrollmentId, req.user!.userId);

    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    const progress = db.prepare(`
      SELECT lp.*, l.title as lesson_title, m.title as module_title
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      WHERE lp.enrollment_id = ?
      ORDER BY l.order_index
    `).all(enrollmentId);

    res.json({ enrollment, progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark lesson as completed
router.post('/:enrollmentId/lessons/:lessonId/complete', authenticate, (req: Request, res: Response) => {
  try {
    const { enrollmentId, lessonId } = req.params;

    // Verificar se a matrícula pertence ao usuário
    const enrollment = db.prepare(`
      SELECT * FROM enrollments WHERE id = ? AND student_id = ?
    `).get(enrollmentId, req.user!.userId);

    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    // Verificar se já está completa
    const existing = db.prepare(`
      SELECT id FROM lesson_progress WHERE enrollment_id = ? AND lesson_id = ?
    `).get(enrollmentId, lessonId);

    const now = Date.now();

    if (existing) {
      db.prepare(`
        UPDATE lesson_progress SET completed = 1, completed_at = ? WHERE enrollment_id = ? AND lesson_id = ?
      `).run(now, enrollmentId, lessonId);
    } else {
      const progressId = uuidv4();
      db.prepare(`
        INSERT INTO lesson_progress (id, enrollment_id, lesson_id, completed, completed_at)
        VALUES (?, ?, ?, 1, ?)
      `).run(progressId, enrollmentId, lessonId, now);
    }

    // Calcular progresso geral
    const totalLessons = db.prepare(`
      SELECT COUNT(*) as count
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.id = ?
    `).get(enrollmentId) as { count: number };

    const completedLessons = db.prepare(`
      SELECT COUNT(*) as count
      FROM lesson_progress
      WHERE enrollment_id = ? AND completed = 1
    `).get(enrollmentId) as { count: number };

    const progress = totalLessons.count > 0
      ? (completedLessons.count / totalLessons.count) * 100
      : 0;

    const isCompleted = progress === 100 ? 1 : 0;

    db.prepare(`
      UPDATE enrollments
      SET progress = ?, completed = ?, completed_at = ?
      WHERE id = ?
    `).run(progress, isCompleted, isCompleted ? now : null, enrollmentId);

    res.json({ message: 'Lesson marked as completed', progress });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
