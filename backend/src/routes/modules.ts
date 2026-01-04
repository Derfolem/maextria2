import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get modules for a course
router.get('/course/:courseId', (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const modules = db.prepare(`
      SELECT m.*,
             (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count
      FROM modules m
      WHERE m.course_id = ?
      ORDER BY m.order_index
    `).all(courseId);

    res.json(modules);
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get module with lessons
router.get('/:moduleId', (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(moduleId);

    if (!module) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    const lessons = db.prepare(`
      SELECT l.*,
             (SELECT COUNT(*) FROM lesson_materials WHERE lesson_id = l.id) as material_count
      FROM lessons l
      WHERE l.module_id = ?
      ORDER BY l.order_index
    `).all(moduleId);

    res.json({ ...module, lessons });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create module
router.post('/', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { course_id, title, description, order_index } = req.body;

    if (!course_id || !title) {
      res.status(400).json({ error: 'Course ID and title are required' });
      return;
    }

    // Verificar permissão no curso
    const course = db.prepare('SELECT teacher_id FROM courses WHERE id = ?')
      .get(course_id) as { teacher_id: string } | undefined;

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    if (course.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const moduleId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO modules (id, course_id, title, description, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(moduleId, course_id, title, description || null, order_index || 0, now);

    res.status(201).json({ id: moduleId, message: 'Module created successfully' });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update module
router.put('/:moduleId', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { title, description, order_index } = req.body;

    // Verificar permissão
    const module = db.prepare(`
      SELECT m.id, c.teacher_id
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = ?
    `).get(moduleId) as { id: string; teacher_id: string } | undefined;

    if (!module) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    if (module.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

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
    if (order_index !== undefined) {
      updates.push('order_index = ?');
      values.push(order_index);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(moduleId);

    db.prepare(`UPDATE modules SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Module updated successfully' });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete module
router.delete('/:moduleId', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    // Verificar permissão
    const module = db.prepare(`
      SELECT m.id, c.teacher_id
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = ?
    `).get(moduleId) as { id: string; teacher_id: string } | undefined;

    if (!module) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    if (module.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    db.prepare('DELETE FROM modules WHERE id = ?').run(moduleId);

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create lesson
router.post('/:moduleId/lessons', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { title, content, video_url, duration_minutes, order_index } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    // Verificar permissão
    const module = db.prepare(`
      SELECT m.id, c.teacher_id
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = ?
    `).get(moduleId) as { id: string; teacher_id: string } | undefined;

    if (!module) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    if (module.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const lessonId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO lessons (id, module_id, title, content, video_url, duration_minutes, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      lessonId,
      moduleId,
      title,
      content || null,
      video_url || null,
      duration_minutes || null,
      order_index || 0,
      now
    );

    res.status(201).json({ id: lessonId, message: 'Lesson created successfully' });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lesson details
router.get('/lessons/:lessonId', (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;

    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);

    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    const materials = db.prepare(`
      SELECT * FROM lesson_materials WHERE lesson_id = ?
    `).all(lessonId);

    res.json({ ...lesson, materials });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lesson
router.put('/lessons/:lessonId', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const { title, content, video_url, duration_minutes, order_index } = req.body;

    // Verificar permissão
    const lesson = db.prepare(`
      SELECT l.id, c.teacher_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = ?
    `).get(lessonId) as { id: string; teacher_id: string } | undefined;

    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    if (lesson.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (video_url !== undefined) {
      updates.push('video_url = ?');
      values.push(video_url);
    }
    if (duration_minutes !== undefined) {
      updates.push('duration_minutes = ?');
      values.push(duration_minutes);
    }
    if (order_index !== undefined) {
      updates.push('order_index = ?');
      values.push(order_index);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(lessonId);

    db.prepare(`UPDATE lessons SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Lesson updated successfully' });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete lesson
router.delete('/lessons/:lessonId', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;

    // Verificar permissão
    const lesson = db.prepare(`
      SELECT l.id, c.teacher_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = ?
    `).get(lessonId) as { id: string; teacher_id: string } | undefined;

    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    if (lesson.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    db.prepare('DELETE FROM lessons WHERE id = ?').run(lessonId);

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add material to lesson
router.post('/lessons/:lessonId/materials', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const { title, file_url, file_type, file_size } = req.body;

    if (!title || !file_url) {
      res.status(400).json({ error: 'Title and file URL are required' });
      return;
    }

    // Verificar permissão
    const lesson = db.prepare(`
      SELECT l.id, c.teacher_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = ?
    `).get(lessonId) as { id: string; teacher_id: string } | undefined;

    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    if (lesson.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const materialId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO lesson_materials (id, lesson_id, title, file_url, file_type, file_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(materialId, lessonId, title, file_url, file_type || null, file_size || null, now);

    res.status(201).json({ id: materialId, message: 'Material added successfully' });
  } catch (error) {
    console.error('Add material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete material
router.delete('/materials/:materialId', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { materialId } = req.params;

    // Verificar permissão
    const material = db.prepare(`
      SELECT lm.id, c.teacher_id
      FROM lesson_materials lm
      JOIN lessons l ON lm.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE lm.id = ?
    `).get(materialId) as { id: string; teacher_id: string } | undefined;

    if (!material) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    if (material.teacher_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    db.prepare('DELETE FROM lesson_materials WHERE id = ?').run(materialId);

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
