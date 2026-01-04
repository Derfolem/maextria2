import { Router, Request, Response } from 'express';
import db from '../database/schema';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Teacher dashboard
router.get('/teacher', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    // Total de cursos do professor
    const coursesCount = db.prepare(`
      SELECT COUNT(*) as count FROM courses WHERE teacher_id = ?
    `).get(req.user!.userId) as { count: number };

    // Total de alunos
    const studentsCount = db.prepare(`
      SELECT COUNT(DISTINCT e.student_id) as count
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.teacher_id = ?
    `).get(req.user!.userId) as { count: number };

    // Total de certificados vendidos
    const certificatesSold = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(teacher_share), 0) as revenue
      FROM certificates
      WHERE teacher_id = ? AND payment_status = 'paid'
    `).get(req.user!.userId) as { count: number; revenue: number };

    // Cursos mais populares
    const topCourses = db.prepare(`
      SELECT c.id, c.title, c.cover_image,
             COUNT(DISTINCT e.id) as students,
             COALESCE(SUM(CASE WHEN cert.payment_status = 'paid' THEN cert.teacher_share ELSE 0 END), 0) as revenue
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN certificates cert ON c.id = cert.course_id
      WHERE c.teacher_id = ?
      GROUP BY c.id
      ORDER BY students DESC
      LIMIT 5
    `).all(req.user!.userId);

    // Receita por mês (últimos 6 meses)
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
    const revenueByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', datetime(payment_date / 1000, 'unixepoch')) as month,
        SUM(teacher_share) as revenue
      FROM certificates
      WHERE teacher_id = ? AND payment_status = 'paid' AND payment_date >= ?
      GROUP BY month
      ORDER BY month
    `).all(req.user!.userId, sixMonthsAgo);

    // Matrículas por mês
    const enrollmentsByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', datetime(enrolled_at / 1000, 'unixepoch')) as month,
        COUNT(*) as enrollments
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.teacher_id = ? AND e.enrolled_at >= ?
      GROUP BY month
      ORDER BY month
    `).all(req.user!.userId, sixMonthsAgo);

    // Taxa média de conclusão
    const completionRate = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.teacher_id = ?
    `).get(req.user!.userId) as { total: number; completed: number };

    const avgCompletionRate = completionRate.total > 0
      ? (completionRate.completed / completionRate.total) * 100
      : 0;

    res.json({
      totalCourses: coursesCount.count,
      totalStudents: studentsCount.count,
      certificatesSold: certificatesSold.count,
      totalRevenue: certificatesSold.revenue,
      topCourses,
      revenueByMonth,
      enrollmentsByMonth,
      avgCompletionRate: avgCompletionRate.toFixed(2)
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin dashboard
router.get('/admin', authenticate, authorize('admin'), (req: Request, res: Response) => {
  try {
    // Total de usuários por tipo
    const usersCount = db.prepare(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `).all() as Array<{ role: string; count: number }>;

    // Total de cursos
    const coursesCount = db.prepare(`
      SELECT COUNT(*) as count FROM courses
    `).get() as { count: number };

    // Total de certificados e receita
    const certificates = db.prepare(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(price), 0) as total_revenue,
        COALESCE(SUM(admin_share), 0) as admin_revenue,
        COALESCE(SUM(teacher_share), 0) as teacher_revenue
      FROM certificates
      WHERE payment_status = 'paid'
    `).get() as any;

    // Receita por mês
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
    const revenueByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', datetime(payment_date / 1000, 'unixepoch')) as month,
        SUM(admin_share) as admin_revenue,
        SUM(teacher_share) as teacher_revenue,
        SUM(price) as total_revenue
      FROM certificates
      WHERE payment_status = 'paid' AND payment_date >= ?
      GROUP BY month
      ORDER BY month
    `).all(sixMonthsAgo);

    // Cursos mais populares
    const topCourses = db.prepare(`
      SELECT c.id, c.title, u.name as teacher_name,
             COUNT(DISTINCT e.id) as students,
             COALESCE(SUM(CASE WHEN cert.payment_status = 'paid' THEN cert.price ELSE 0 END), 0) as revenue
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN certificates cert ON c.id = cert.course_id
      GROUP BY c.id
      ORDER BY students DESC
      LIMIT 10
    `).all();

    // Categorias mais procuradas
    const topCategories = db.prepare(`
      SELECT cat.name, COUNT(e.id) as enrollments
      FROM categories cat
      JOIN courses c ON cat.id = c.category_id
      JOIN enrollments e ON c.id = e.course_id
      GROUP BY cat.id
      ORDER BY enrollments DESC
      LIMIT 5
    `).all();

    // Buscas e eventos recentes
    const recentEvents = db.prepare(`
      SELECT event_type, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ?
      GROUP BY event_type
      ORDER BY count DESC
    `).all(sixMonthsAgo);

    // Média de preço de certificados
    const avgCertificatePrice = db.prepare(`
      SELECT AVG(price) as avg_price
      FROM certificates
      WHERE payment_status = 'paid'
    `).get() as { avg_price: number };

    // Distribuição por nível de dificuldade
    const difficultyStats = db.prepare(`
      SELECT c.difficulty, COUNT(e.id) as enrollments
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE c.difficulty IS NOT NULL
      GROUP BY c.difficulty
    `).all();

    // Total de horas de curso
    const totalHours = db.prepare(`
      SELECT SUM(duration_hours) as total FROM courses WHERE duration_hours IS NOT NULL
    `).get() as { total: number };

    res.json({
      users: usersCount.reduce((acc: any, item) => {
        acc[item.role] = item.count;
        return acc;
      }, {}),
      totalCourses: coursesCount.count,
      certificates: {
        total: certificates.count,
        totalRevenue: certificates.total_revenue,
        adminRevenue: certificates.admin_revenue,
        teacherRevenue: certificates.teacher_revenue
      },
      revenueByMonth,
      topCourses,
      topCategories,
      recentEvents,
      avgCertificatePrice: avgCertificatePrice.avg_price || 0,
      difficultyStats,
      totalCourseHours: totalHours.total || 0
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Student dashboard
router.get('/student', authenticate, (req: Request, res: Response) => {
  try {
    // Meus cursos
    const enrolledCourses = db.prepare(`
      SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?
    `).get(req.user!.userId) as { count: number };

    // Cursos completados
    const completedCourses = db.prepare(`
      SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND completed = 1
    `).get(req.user!.userId) as { count: number };

    // Certificados
    const certificates = db.prepare(`
      SELECT COUNT(*) as count FROM certificates WHERE student_id = ? AND payment_status = 'paid'
    `).get(req.user!.userId) as { count: number };

    // Progresso médio
    const avgProgress = db.prepare(`
      SELECT AVG(progress) as avg FROM enrollments WHERE student_id = ?
    `).get(req.user!.userId) as { avg: number };

    // Últimas atividades
    const recentActivity = db.prepare(`
      SELECT c.title, e.progress, e.enrolled_at, e.completed
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
      LIMIT 5
    `).all(req.user!.userId);

    res.json({
      enrolledCourses: enrolledCourses.count,
      completedCourses: completedCourses.count,
      certificates: certificates.count,
      avgProgress: avgProgress.avg || 0,
      recentActivity
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
