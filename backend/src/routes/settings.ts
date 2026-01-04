import { Router, Request, Response } from 'express';
import db from '../database/schema';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get system settings
router.get('/', authenticate, authorize('admin'), (req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM system_settings').all();

    const settingsObj = settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profit share
router.put('/profit-share', authenticate, authorize('admin'), (req: Request, res: Response) => {
  try {
    const { admin_profit_share } = req.body;

    if (admin_profit_share === undefined || admin_profit_share < 0 || admin_profit_share > 100) {
      res.status(400).json({ error: 'Invalid profit share value (must be between 0 and 100)' });
      return;
    }

    const now = Date.now();

    db.prepare(`
      INSERT OR REPLACE INTO system_settings (key, value, updated_at)
      VALUES ('admin_profit_share', ?, ?)
    `).run(admin_profit_share.toString(), now);

    res.json({ message: 'Profit share updated successfully', admin_profit_share });
  } catch (error) {
    console.error('Update profit share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current profit share
router.get('/profit-share', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const setting = db.prepare(`
      SELECT value FROM system_settings WHERE key = 'admin_profit_share'
    `).get() as { value: string } | undefined;

    const adminProfitShare = setting ? parseFloat(setting.value) : 30;

    res.json({
      admin_profit_share: adminProfitShare,
      teacher_profit_share: 100 - adminProfitShare
    });
  } catch (error) {
    console.error('Get profit share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
