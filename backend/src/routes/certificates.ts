import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { authenticate, authorize } from '../middleware/auth';
import { sendCertificateEmail } from '../utils/email';
import { generateCertificatePdf } from '../utils/pdf';

const router = Router();

// Request certificate (student must complete course)
router.post('/request', authenticate, async (req: Request, res: Response) => {
  try {
    const { enrollment_id } = req.body;

    if (!enrollment_id) {
      res.status(400).json({ error: 'Enrollment ID is required' });
      return;
    }

    // Verificar se a matrícula está completa
    const enrollment = db.prepare(`
      SELECT e.*, c.certificate_price, c.teacher_id, c.title as course_title,
             u.name as student_name, u.email as student_email
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON e.student_id = u.id
      WHERE e.id = ? AND e.student_id = ? AND e.completed = 1
    `).get(enrollment_id, req.user!.userId) as any;

    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment not found or course not completed' });
      return;
    }

    // Verificar se já existe certificado
    const existing = db.prepare(`
      SELECT id FROM certificates WHERE enrollment_id = ?
    `).get(enrollment_id);

    if (existing) {
      res.status(400).json({ error: 'Certificate already requested' });
      return;
    }

    // Obter configuração de partilha de lucros
    const settings = db.prepare(`
      SELECT value FROM system_settings WHERE key = 'admin_profit_share'
    `).get() as { value: string } | undefined;

    const adminProfitShare = settings ? parseFloat(settings.value) : 30;
    const adminShare = (enrollment.certificate_price * adminProfitShare) / 100;
    const teacherShare = enrollment.certificate_price - adminShare;

    const certificateId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO certificates (
        id, enrollment_id, student_id, course_id, teacher_id,
        price, teacher_share, admin_share, payment_status, issued_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      certificateId,
      enrollment_id,
      req.user!.userId,
      enrollment.course_id,
      enrollment.teacher_id,
      enrollment.certificate_price,
      teacherShare,
      adminShare,
      now
    );

    // Log analytics
    const analyticsId = uuidv4();
    db.prepare(`
      INSERT INTO analytics_events (id, event_type, user_id, course_id, metadata, created_at)
      VALUES (?, 'certificate_request', ?, ?, ?, ?)
    `).run(
      analyticsId,
      req.user!.userId,
      enrollment.course_id,
      JSON.stringify({ certificate_id: certificateId, price: enrollment.certificate_price }),
      now
    );

    res.status(201).json({
      id: certificateId,
      message: 'Certificate requested successfully',
      price: enrollment.certificate_price,
      payment_required: enrollment.certificate_price > 0
    });
  } catch (error) {
    console.error('Request certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process certificate payment (simulação)
router.post('/:certificateId/pay', authenticate, async (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;

    const certificate = db.prepare(`
      SELECT c.*, e.course_id, co.title as course_title, u.name, u.email
      FROM certificates c
      JOIN enrollments e ON c.enrollment_id = e.id
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.student_id = u.id
      WHERE c.id = ? AND c.student_id = ? AND c.payment_status = 'pending'
    `).get(certificateId, req.user!.userId) as any;

    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found or already paid' });
      return;
    }

    const now = Date.now();

    // Atualizar status de pagamento
    db.prepare(`
      UPDATE certificates SET payment_status = 'paid', payment_date = ? WHERE id = ?
    `).run(now, certificateId);

    // Log analytics
    const analyticsId = uuidv4();
    db.prepare(`
      INSERT INTO analytics_events (id, event_type, user_id, course_id, metadata, created_at)
      VALUES (?, 'certificate_payment', ?, ?, ?, ?)
    `).run(
      analyticsId,
      req.user!.userId,
      certificate.course_id,
      JSON.stringify({ certificate_id: certificateId, price: certificate.price }),
      now
    );

    // Enviar email com certificado
    try {
      await sendCertificateEmail(certificate.email, certificate.name, certificate.course_title, certificateId);
    } catch (error) {
      console.error('Failed to send certificate email:', error);
    }

    res.json({ message: 'Payment processed successfully', certificate_id: certificateId });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my certificates
router.get('/my', authenticate, (req: Request, res: Response) => {
  try {
    const certificates = db.prepare(`
      SELECT c.*, co.title as course_title, co.cover_image, u.name as teacher_name
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON co.teacher_id = u.id
      WHERE c.student_id = ?
      ORDER BY c.issued_at DESC
    `).all(req.user!.userId);

    res.json(certificates);
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get certificate details (public with ID)
router.get('/:certificateId', (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;

    const certificate = db.prepare(`
      SELECT c.*, co.title as course_title, co.duration_hours,
             u.name as student_name, t.name as teacher_name
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.student_id = u.id
      JOIN users t ON co.teacher_id = t.id
      WHERE c.id = ? AND c.payment_status = 'paid'
    `).get(certificateId);

    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    res.json(certificate);
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export certificate as PDF (public with ID)
router.get('/:certificateId/export', (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;

    const certificate = db.prepare(`
      SELECT c.*, co.title as course_title, co.duration_hours,
             u.name as student_name, t.name as teacher_name
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.student_id = u.id
      JOIN users t ON co.teacher_id = t.id
      WHERE c.id = ? AND c.payment_status = 'paid'
    `).get(certificateId) as any;

    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    const pdfBuffer = generateCertificatePdf({
      certificateId,
      studentName: certificate.student_name,
      courseTitle: certificate.course_title,
      teacherName: certificate.teacher_name,
      durationHours: certificate.duration_hours,
      issuedAt: certificate.issued_at
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${certificateId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Export certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List certificates for teacher's courses
router.get('/teacher/sales', authenticate, authorize('teacher', 'admin'), (req: Request, res: Response) => {
  try {
    const certificates = db.prepare(`
      SELECT c.*, co.title as course_title, u.name as student_name
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.student_id = u.id
      WHERE c.teacher_id = ?
      ORDER BY c.issued_at DESC
    `).all(req.user!.userId);

    res.json(certificates);
  } catch (error) {
    console.error('Get teacher certificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all certificates (admin)
router.get('/', authenticate, authorize('admin'), (req: Request, res: Response) => {
  try {
    const certificates = db.prepare(`
      SELECT c.*, co.title as course_title, u.name as student_name, t.name as teacher_name
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.student_id = u.id
      JOIN users t ON co.teacher_id = t.id
      ORDER BY c.issued_at DESC
    `).all();

    res.json(certificates);
  } catch (error) {
    console.error('List certificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
