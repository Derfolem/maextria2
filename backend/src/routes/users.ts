import { Router, Request, Response } from 'express';
import db from '../database/schema';
import { authenticate, authorize } from '../middleware/auth';
import { hashPassword } from '../utils/auth';
import { isValidCpf, normalizeCpf } from '../utils/cpf';
import { User } from '../types';

const router = Router();

// Get current user profile
router.get('/me', authenticate, (req: Request, res: Response) => {
  try {
    const user = db.prepare(`
      SELECT id, email, name, role, cpf, phone, document, address, payment_info, email_verified, created_at
      FROM users WHERE id = ?
    `).get(req.user!.userId) as Omit<User, 'password'> | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, phone, document, address, payment_info, cpf } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (document !== undefined) {
      updates.push('document = ?');
      values.push(document);
    }
    if (cpf !== undefined) {
      const normalizedCpf = normalizeCpf(cpf);
      if (!isValidCpf(normalizedCpf)) {
        res.status(400).json({ error: 'CPF inválido' });
        return;
      }

      const existingCpf = db.prepare('SELECT id FROM users WHERE cpf = ? AND id != ?').get(normalizedCpf, req.user!.userId);
      if (existingCpf) {
        res.status(400).json({ error: 'CPF já cadastrado' });
        return;
      }
      updates.push('cpf = ?');
      values.push(normalizedCpf);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (payment_info !== undefined) {
      updates.push('payment_info = ?');
      values.push(payment_info);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(req.user!.userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/me/password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    const user = db.prepare('SELECT password FROM users WHERE id = ?')
      .get(req.user!.userId) as { password: string } | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { comparePassword } = await import('../utils/auth');
    const isValid = await comparePassword(currentPassword, user.password);

    if (!isValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?')
      .run(hashedPassword, Date.now(), req.user!.userId);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete own account
router.delete('/me', authenticate, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user!.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: List all users
router.get('/', authenticate, authorize('admin'), (req: Request, res: Response) => {
  try {
    const { role, search } = req.query;
    let query = `
      SELECT id, email, name, role, phone, email_verified, created_at
      FROM users WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const users = db.prepare(query).all(...params);
    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update user role
router.put('/:userId/role', authenticate, authorize('admin'), (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['student', 'teacher', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
      .run(role, Date.now(), userId);

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete user
router.delete('/:userId', authenticate, authorize('admin'), (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Não permitir que admin delete a si mesmo
    if (userId === req.user!.userId) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
