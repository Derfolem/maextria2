import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Helper function to get or create curriculum
function getOrCreateCurriculum(userId: string): string {
  const existing = db.prepare(`
    SELECT id FROM curricula WHERE student_id = ?
  `).get(userId) as { id: string } | undefined;

  if (existing) {
    return existing.id;
  }

  const curriculumId = uuidv4();
  const now = Date.now();
  db.prepare(`
    INSERT INTO curricula (id, student_id, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(curriculumId, userId, now, now);

  return curriculumId;
}

// GET /curriculum - Get full curriculum with all sections
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get or create curriculum
    const curriculumId = getOrCreateCurriculum(userId);

    // Get main curriculum data
    const curriculum = db.prepare(`
      SELECT * FROM curricula WHERE id = ?
    `).get(curriculumId) as any;

    // Get education entries
    const education = db.prepare(`
      SELECT * FROM curriculum_education
      WHERE curriculum_id = ?
      ORDER BY order_index ASC, created_at DESC
    `).all(curriculumId);

    // Get experience entries
    const experience = db.prepare(`
      SELECT * FROM curriculum_experience
      WHERE curriculum_id = ?
      ORDER BY order_index ASC, created_at DESC
    `).all(curriculumId);

    // Get external certifications
    const externalCerts = db.prepare(`
      SELECT * FROM curriculum_external_certs
      WHERE curriculum_id = ?
      ORDER BY order_index ASC, created_at DESC
    `).all(curriculumId);

    // Get skills
    const skills = db.prepare(`
      SELECT * FROM curriculum_skills
      WHERE curriculum_id = ?
      ORDER BY order_index ASC, created_at DESC
    `).all(curriculumId);

    // Get languages
    const languages = db.prepare(`
      SELECT * FROM curriculum_languages
      WHERE curriculum_id = ?
      ORDER BY order_index ASC, created_at DESC
    `).all(curriculumId);

    // Get user profile data
    const user = db.prepare(`
      SELECT id, name, email, cpf, phone, address FROM users WHERE id = ?
    `).get(userId);

    res.json({
      ...curriculum,
      user,
      education,
      experience,
      external_certs: externalCerts,
      skills,
      languages
    });
  } catch (error) {
    console.error('Get curriculum error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /curriculum - Update main curriculum (objective and additional info)
router.put('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { professional_objective, additional_info } = req.body;

    const curriculumId = getOrCreateCurriculum(userId);
    const now = Date.now();

    db.prepare(`
      UPDATE curricula
      SET professional_objective = ?, additional_info = ?, updated_at = ?
      WHERE id = ?
    `).run(professional_objective || null, additional_info || null, now, curriculumId);

    res.json({ message: 'Curriculum updated successfully' });
  } catch (error) {
    console.error('Update curriculum error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== EDUCATION ====================

// POST /curriculum/education - Add education entry
router.post('/education', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { institution, degree, field_of_study, start_date, end_date, is_current, description } = req.body;

    if (!institution || !degree) {
      res.status(400).json({ error: 'Institution and degree are required' });
      return;
    }

    const curriculumId = getOrCreateCurriculum(userId);
    const educationId = uuidv4();
    const now = Date.now();

    // Get next order index
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
      FROM curriculum_education WHERE curriculum_id = ?
    `).get(curriculumId) as { next_order: number };

    db.prepare(`
      INSERT INTO curriculum_education (
        id, curriculum_id, institution, degree, field_of_study,
        start_date, end_date, is_current, description, order_index, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      educationId, curriculumId, institution, degree,
      field_of_study || null, start_date || null, end_date || null,
      is_current ? 1 : 0, description || null, maxOrder.next_order, now
    );

    // Update curriculum updated_at
    db.prepare(`UPDATE curricula SET updated_at = ? WHERE id = ?`).run(now, curriculumId);

    res.status(201).json({ id: educationId, message: 'Education added successfully' });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /curriculum/education/:id - Update education entry
router.put('/education/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { institution, degree, field_of_study, start_date, end_date, is_current, description } = req.body;

    // Verify ownership
    const entry = db.prepare(`
      SELECT ce.id FROM curriculum_education ce
      JOIN curricula c ON ce.curriculum_id = c.id
      WHERE ce.id = ? AND c.student_id = ?
    `).get(id, userId);

    if (!entry) {
      res.status(404).json({ error: 'Education entry not found' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (institution !== undefined) { updates.push('institution = ?'); values.push(institution); }
    if (degree !== undefined) { updates.push('degree = ?'); values.push(degree); }
    if (field_of_study !== undefined) { updates.push('field_of_study = ?'); values.push(field_of_study || null); }
    if (start_date !== undefined) { updates.push('start_date = ?'); values.push(start_date || null); }
    if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date || null); }
    if (is_current !== undefined) { updates.push('is_current = ?'); values.push(is_current ? 1 : 0); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description || null); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(id);
    db.prepare(`UPDATE curriculum_education SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Education updated successfully' });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /curriculum/education/:id - Delete education entry
router.delete('/education/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Verify ownership
    const entry = db.prepare(`
      SELECT ce.id FROM curriculum_education ce
      JOIN curricula c ON ce.curriculum_id = c.id
      WHERE ce.id = ? AND c.student_id = ?
    `).get(id, userId);

    if (!entry) {
      res.status(404).json({ error: 'Education entry not found' });
      return;
    }

    db.prepare('DELETE FROM curriculum_education WHERE id = ?').run(id);

    res.json({ message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== EXPERIENCE ====================

// POST /curriculum/experience - Add experience entry
router.post('/experience', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { company, position, location, start_date, end_date, is_current, description } = req.body;

    if (!company || !position) {
      res.status(400).json({ error: 'Company and position are required' });
      return;
    }

    const curriculumId = getOrCreateCurriculum(userId);
    const experienceId = uuidv4();
    const now = Date.now();

    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
      FROM curriculum_experience WHERE curriculum_id = ?
    `).get(curriculumId) as { next_order: number };

    db.prepare(`
      INSERT INTO curriculum_experience (
        id, curriculum_id, company, position, location,
        start_date, end_date, is_current, description, order_index, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      experienceId, curriculumId, company, position,
      location || null, start_date || null, end_date || null,
      is_current ? 1 : 0, description || null, maxOrder.next_order, now
    );

    db.prepare(`UPDATE curricula SET updated_at = ? WHERE id = ?`).run(now, curriculumId);

    res.status(201).json({ id: experienceId, message: 'Experience added successfully' });
  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /curriculum/experience/:id - Update experience entry
router.put('/experience/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { company, position, location, start_date, end_date, is_current, description } = req.body;

    const entry = db.prepare(`
      SELECT ce.id FROM curriculum_experience ce
      JOIN curricula c ON ce.curriculum_id = c.id
      WHERE ce.id = ? AND c.student_id = ?
    `).get(id, userId);

    if (!entry) {
      res.status(404).json({ error: 'Experience entry not found' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (company !== undefined) { updates.push('company = ?'); values.push(company); }
    if (position !== undefined) { updates.push('position = ?'); values.push(position); }
    if (location !== undefined) { updates.push('location = ?'); values.push(location || null); }
    if (start_date !== undefined) { updates.push('start_date = ?'); values.push(start_date || null); }
    if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date || null); }
    if (is_current !== undefined) { updates.push('is_current = ?'); values.push(is_current ? 1 : 0); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description || null); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(id);
    db.prepare(`UPDATE curriculum_experience SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Experience updated successfully' });
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /curriculum/experience/:id - Delete experience entry
router.delete('/experience/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const entry = db.prepare(`
      SELECT ce.id FROM curriculum_experience ce
      JOIN curricula c ON ce.curriculum_id = c.id
      WHERE ce.id = ? AND c.student_id = ?
    `).get(id, userId);

    if (!entry) {
      res.status(404).json({ error: 'Experience entry not found' });
      return;
    }

    db.prepare('DELETE FROM curriculum_experience WHERE id = ?').run(id);

    res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== EXTERNAL CERTIFICATIONS ====================

// POST /curriculum/external-certs - Add external certification
router.post('/external-certs', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, institution, issue_date, expiration_date, credential_url } = req.body;

    if (!name || !institution) {
      res.status(400).json({ error: 'Name and institution are required' });
      return;
    }

    const curriculumId = getOrCreateCurriculum(userId);
    const certId = uuidv4();
    const now = Date.now();

    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
      FROM curriculum_external_certs WHERE curriculum_id = ?
    `).get(curriculumId) as { next_order: number };

    db.prepare(`
      INSERT INTO curriculum_external_certs (
        id, curriculum_id, name, institution, issue_date,
        expiration_date, credential_url, order_index, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      certId, curriculumId, name, institution,
      issue_date || null, expiration_date || null,
      credential_url || null, maxOrder.next_order, now
    );

    db.prepare(`UPDATE curricula SET updated_at = ? WHERE id = ?`).run(now, curriculumId);

    res.status(201).json({ id: certId, message: 'External certification added successfully' });
  } catch (error) {
    console.error('Add external cert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /curriculum/external-certs/:id - Update external certification
router.put('/external-certs/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, institution, issue_date, expiration_date, credential_url } = req.body;

    const entry = db.prepare(`
      SELECT ce.id FROM curriculum_external_certs ce
      JOIN curricula c ON ce.curriculum_id = c.id
      WHERE ce.id = ? AND c.student_id = ?
    `).get(id, userId);

    if (!entry) {
      res.status(404).json({ error: 'External certification not found' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (institution !== undefined) { updates.push('institution = ?'); values.push(institution); }
    if (issue_date !== undefined) { updates.push('issue_date = ?'); values.push(issue_date || null); }
    if (expiration_date !== undefined) { updates.push('expiration_date = ?'); values.push(expiration_date || null); }
    if (credential_url !== undefined) { updates.push('credential_url = ?'); values.push(credential_url || null); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(id);
    db.prepare(`UPDATE curriculum_external_certs SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'External certification updated successfully' });
  } catch (error) {
    console.error('Update external cert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /curriculum/external-certs/:id - Delete external certification
router.delete('/external-certs/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const entry = db.prepare(`
      SELECT ce.id FROM curriculum_external_certs ce
      JOIN curricula c ON ce.curriculum_id = c.id
      WHERE ce.id = ? AND c.student_id = ?
    `).get(id, userId);

    if (!entry) {
      res.status(404).json({ error: 'External certification not found' });
      return;
    }

    db.prepare('DELETE FROM curriculum_external_certs WHERE id = ?').run(id);

    res.json({ message: 'External certification deleted successfully' });
  } catch (error) {
    console.error('Delete external cert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== SKILLS ====================

// POST /curriculum/skills - Add skill
router.post('/skills', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, level } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Skill name is required' });
      return;
    }

    const validLevels = ['basic', 'intermediate', 'advanced', 'expert'];
    if (level && !validLevels.includes(level)) {
      res.status(400).json({ error: 'Invalid skill level' });
      return;
    }

    const curriculumId = getOrCreateCurriculum(userId);
    const skillId = uuidv4();
    const now = Date.now();

    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
      FROM curriculum_skills WHERE curriculum_id = ?
    `).get(curriculumId) as { next_order: number };

    db.prepare(`
      INSERT INTO curriculum_skills (id, curriculum_id, name, level, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(skillId, curriculumId, name, level || 'intermediate', maxOrder.next_order, now);

    db.prepare(`UPDATE curricula SET updated_at = ? WHERE id = ?`).run(now, curriculumId);

    res.status(201).json({ id: skillId, message: 'Skill added successfully' });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /curriculum/skills/:id - Update skill
router.put('/skills/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, level } = req.body;

    const entry = db.prepare(`
      SELECT cs.id FROM curriculum_skills cs
      JOIN curricula c ON cs.curriculum_id = c.id
      WHERE cs.id = ? AND c.student_id = ?
    `).get(id, userId);

    if (!entry) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    const validLevels = ['basic', 'intermediate', 'advanced', 'expert'];
    if (level && !validLevels.includes(level)) {
      res.status(400).json({ error: 'Invalid skill level' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (level !== undefined) { updates.push('level = ?'); values.push(level); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(id);
    db.prepare(`UPDATE curriculum_skills SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Skill updated successfully' });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /curriculum/skills/:id - Delete skill
router.delete('/skills/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const entry = db.prepare(`
      SELECT cs.id FROM curriculum_skills cs
      JOIN curricula c ON cs.curriculum_id = c.id
      WHERE cs.id = ? AND c.student_id = ?
    `).get(id, userId);

    if (!entry) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    db.prepare('DELETE FROM curriculum_skills WHERE id = ?').run(id);

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== LANGUAGES ====================

// POST /curriculum/languages - Add language
router.post('/languages', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { language, proficiency } = req.body;

    if (!language) {
      res.status(400).json({ error: 'Language is required' });
      return;
    }

    const validProficiencies = ['basic', 'intermediate', 'advanced', 'fluent', 'native'];
    if (proficiency && !validProficiencies.includes(proficiency)) {
      res.status(400).json({ error: 'Invalid proficiency level' });
      return;
    }

    const curriculumId = getOrCreateCurriculum(userId);
    const langId = uuidv4();
    const now = Date.now();

    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
      FROM curriculum_languages WHERE curriculum_id = ?
    `).get(curriculumId) as { next_order: number };

    db.prepare(`
      INSERT INTO curriculum_languages (id, curriculum_id, language, proficiency, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(langId, curriculumId, language, proficiency || 'intermediate', maxOrder.next_order, now);

    db.prepare(`UPDATE curricula SET updated_at = ? WHERE id = ?`).run(now, curriculumId);

    res.status(201).json({ id: langId, message: 'Language added successfully' });
  } catch (error) {
    console.error('Add language error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /curriculum/languages/:id - Update language
router.put('/languages/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { language, proficiency } = req.body;

    const entry = db.prepare(`
      SELECT cl.id FROM curriculum_languages cl
      JOIN curricula c ON cl.curriculum_id = c.id
      WHERE cl.id = ? AND c.student_id = ?
    `).get(id, userId);

    if (!entry) {
      res.status(404).json({ error: 'Language not found' });
      return;
    }

    const validProficiencies = ['basic', 'intermediate', 'advanced', 'fluent', 'native'];
    if (proficiency && !validProficiencies.includes(proficiency)) {
      res.status(400).json({ error: 'Invalid proficiency level' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (language !== undefined) { updates.push('language = ?'); values.push(language); }
    if (proficiency !== undefined) { updates.push('proficiency = ?'); values.push(proficiency); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(id);
    db.prepare(`UPDATE curriculum_languages SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Language updated successfully' });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /curriculum/languages/:id - Delete language
router.delete('/languages/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const entry = db.prepare(`
      SELECT cl.id FROM curriculum_languages cl
      JOIN curricula c ON cl.curriculum_id = c.id
      WHERE cl.id = ? AND c.student_id = ?
    `).get(id, userId);

    if (!entry) {
      res.status(404).json({ error: 'Language not found' });
      return;
    }

    db.prepare('DELETE FROM curriculum_languages WHERE id = ?').run(id);

    res.json({ message: 'Language deleted successfully' });
  } catch (error) {
    console.error('Delete language error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== PLATFORM CERTIFICATES ====================

// GET /curriculum/platform-certs - Get user's paid platform certificates
router.get('/platform-certs', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const certificates = db.prepare(`
      SELECT c.id, c.issued_at, c.payment_date,
             co.title as course_title, co.duration_hours,
             u.name as teacher_name
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON co.teacher_id = u.id
      WHERE c.student_id = ? AND c.payment_status = 'paid'
      ORDER BY c.issued_at DESC
    `).all(userId);

    res.json(certificates);
  } catch (error) {
    console.error('Get platform certs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== PDF EXPORT ====================

// GET /curriculum/export/pdf - Export curriculum as PDF
router.get('/export/pdf', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get curriculum data
    const curriculumId = getOrCreateCurriculum(userId);

    const curriculum = db.prepare(`SELECT * FROM curricula WHERE id = ?`).get(curriculumId) as any;
    const user = db.prepare(`SELECT name, email, cpf, phone, address FROM users WHERE id = ?`).get(userId) as any;
    const education = db.prepare(`SELECT * FROM curriculum_education WHERE curriculum_id = ? ORDER BY order_index`).all(curriculumId);
    const experience = db.prepare(`SELECT * FROM curriculum_experience WHERE curriculum_id = ? ORDER BY order_index`).all(curriculumId);
    const externalCerts = db.prepare(`SELECT * FROM curriculum_external_certs WHERE curriculum_id = ? ORDER BY order_index`).all(curriculumId);
    const skills = db.prepare(`SELECT * FROM curriculum_skills WHERE curriculum_id = ? ORDER BY order_index`).all(curriculumId);
    const languages = db.prepare(`SELECT * FROM curriculum_languages WHERE curriculum_id = ? ORDER BY order_index`).all(curriculumId);

    // Get paid platform certificates
    const platformCerts = db.prepare(`
      SELECT c.issued_at, co.title as course_title, co.duration_hours
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      WHERE c.student_id = ? AND c.payment_status = 'paid'
      ORDER BY c.issued_at DESC
    `).all(userId);

    // Import PDF generation function
    const { generateCurriculumPdf } = await import('../utils/pdf');

    const pdfBuffer = generateCurriculumPdf({
      user,
      professional_objective: curriculum.professional_objective,
      additional_info: curriculum.additional_info,
      education,
      experience,
      external_certs: externalCerts,
      platform_certs: platformCerts,
      skills,
      languages
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="curriculo-${user.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Export curriculum PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
