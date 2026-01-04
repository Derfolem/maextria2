import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// List all categories (public)
router.get('/', (req: Request, res: Response) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, u.name as created_by_name,
             (SELECT COUNT(*) FROM courses WHERE category_id = c.id) as course_count
      FROM categories c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.name
    `).all();

    res.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create category
router.post('/', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    // Verificar se já existe
    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
    if (existing) {
      res.status(400).json({ error: 'Category already exists' });
      return;
    }

    const categoryId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO categories (id, name, description, created_by, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(categoryId, name, description || null, req.user!.userId, now);

    res.status(201).json({ id: categoryId, message: 'Category created successfully' });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category (admin only)
router.delete('/:categoryId', authenticate, authorize('admin'), (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
