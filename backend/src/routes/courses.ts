import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { authenticate, authorize } from '../middleware/auth';
import { Course, Module, Lesson } from '../types';

const router = Router();

// List published courses (public)
router.get('/public', (req: Request, res: Response) => {
  try {
    const { category, difficulty, search } = req.query;
    let query = `
      SELECT c.*, cat.name as category_name, u.name as teacher_name,
             (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.is_published = 1
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND c.category_id = ?';
      params.push(category);
    }

    if (difficulty) {
      query += ' AND c.difficulty = ?';
      params.push(difficulty);
    }

    if (search) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.created_at DESC';

    const courses = db.prepare(query).all(...params);
    res.json(courses);
  } catch (error) {
    console.error('List public courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get course details (public)
router.get('/public/:courseId', (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const course = db.prepare(`
      SELECT c.*, cat.name as category_name, u.name as teacher_name, u.id as teacher_id
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ? AND c.is_published = 1
    `).get(courseId);

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Get modules and lessons
    const modules = db.prepare(`
      SELECT * FROM modules WHERE course_id = ? ORDER BY order_index
    `).all(courseId) as Module[];

    const courseDetalhado = {
      ...course,
      modules: modules.map(module => ({
        ...module,
        lessons: db.prepare(`
          SELECT id, title, duration_minutes, order_index
          FROM lessons WHERE module_id = ? ORDER BY order_index
        `).all(module.id)
      }))
    };

    res.json(courseDetalhado);
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List my courses (teacher)
router.get('/my-courses', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const courses = db.prepare(`
      SELECT c.*, cat.name as category_name,
             (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count,
             (SELECT COUNT(*) FROM certificates WHERE course_id = c.id AND payment_status = 'paid') as certificates_sold
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user!.userId);

    res.json(courses);
  } catch (error) {
    console.error('List my courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get course details (teacher/admin/student)
router.get('/:courseId', authenticate, authorize('teacher', 'admin', 'student'), (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const course = db.prepare(`
      SELECT c.*, cat.name as category_name, u.name as teacher_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `).get(courseId) as any;

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    if (req.user!.role === 'student') {
      const enrollment = db.prepare(`
        SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?
      `).get(courseId, req.user!.userId);

      if (!enrollment) {
        res.status(403).json({ error: 'Not enrolled in this course' });
        return;
      }
    } else if (req.user!.role !== 'admin' && course.teacher_id !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const modules = db.prepare(`
      SELECT * FROM modules WHERE course_id = ? ORDER BY order_index
    `).all(courseId) as Module[];

    const courseDetailed = {
      ...course,
      modules: modules.map((module) => ({
        ...module,
        lessons: db.prepare(`
          SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index
        `).all(module.id).map((lesson: any) => ({
          ...lesson,
          materials: db.prepare(`
            SELECT id, lesson_id, title, file_url, file_type
            FROM lesson_materials
            WHERE lesson_id = ?
            ORDER BY created_at
          `).all(lesson.id).map((material: any) => ({
            ...material,
            url: material.file_url,
            type: material.file_type || 'link',
          })),
        })),
      })),
    };

    res.json(courseDetailed);
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all courses (admin)
router.get('/', authenticate, authorize('admin'), (req: Request, res: Response) => {
  try {
    const courses = db.prepare(`
      SELECT c.*, cat.name as category_name, u.name as teacher_name,
             (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.created_at DESC
    `).all();

    res.json(courses);
  } catch (error) {
    console.error('List all courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create course
router.post('/', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category_id,
      cover_image,
      duration_hours,
      difficulty,
      certificate_price
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const courseId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO courses (
        id, title, description, category_id, teacher_id, cover_image,
        duration_hours, difficulty, certificate_price, is_published,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      courseId,
      title,
      description || null,
      category_id || null,
      req.user!.userId,
      cover_image || null,
      duration_hours || null,
      difficulty || 'beginner',
      certificate_price || 0,
      now,
      now
    );

    res.status(201).json({ id: courseId, message: 'Course created successfully' });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course
router.put('/:courseId', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    // Verificar permissão
    const course = db.prepare('SELECT teacher_id FROM courses WHERE id = ?')
      .get(courseId) as { teacher_id: string } | undefined;

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    if (course.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized to update this course' });
      return;
    }

    const {
      title,
      description,
      category_id,
      cover_image,
      duration_hours,
      difficulty,
      certificate_price
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      values.push(category_id);
    }
    if (cover_image !== undefined) {
      updates.push('cover_image = ?');
      values.push(cover_image);
    }
    if (duration_hours !== undefined) {
      updates.push('duration_hours = ?');
      values.push(duration_hours);
    }
    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      values.push(difficulty);
    }
    if (certificate_price !== undefined) {
      updates.push('certificate_price = ?');
      values.push(certificate_price);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(courseId);

    db.prepare(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish/Unpublish course
router.patch('/:courseId/publish', authenticate, authorize('admin'), (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { is_published } = req.body;

    // Verificar permissão
    const course = db.prepare('SELECT teacher_id FROM courses WHERE id = ?')
      .get(courseId) as { teacher_id: string } | undefined;

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    if (course.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    db.prepare('UPDATE courses SET is_published = ?, updated_at = ? WHERE id = ?')
      .run(is_published ? 1 : 0, Date.now(), courseId);

    res.json({ message: `Course ${is_published ? 'published' : 'unpublished'} successfully` });
  } catch (error) {
    console.error('Publish course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete course
router.delete('/:courseId', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    // Verificar permissão
    const course = db.prepare('SELECT teacher_id FROM courses WHERE id = ?')
      .get(courseId) as { teacher_id: string } | undefined;

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    if (course.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    db.prepare('DELETE FROM courses WHERE id = ?').run(courseId);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
