type CertificatePdfData = {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  teacherName: string;
  durationHours?: number | null;
  issuedAt: number;
};

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function generateCertificatePdf(data: CertificatePdfData) {
  const dateText = new Date(data.issuedAt).toISOString().slice(0, 10);
  const durationText = data.durationHours ? `${data.durationHours} horas` : 'Carga horaria nao informada';

  const lines = [
    { text: 'Certificado de Conclusao', size: 28 },
    { text: `Certificamos que ${data.studentName}`, size: 14 },
    { text: `concluiu o curso "${data.courseTitle}"`, size: 14 },
    { text: `Instrutor(a): ${data.teacherName}`, size: 12 },
    { text: `Carga horaria: ${durationText}`, size: 12 },
    { text: `Data de emissao: ${dateText}`, size: 12 },
    { text: `Codigo: ${data.certificateId}`, size: 10 }
  ];

  const contentLines: string[] = [];
  contentLines.push('BT');
  contentLines.push('/F1 28 Tf');
  contentLines.push('72 720 Td');
  contentLines.push(`(${escapePdfText(lines[0].text)}) Tj`);

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    contentLines.push(`/F1 ${line.size} Tf`);
    contentLines.push('0 -24 Td');
    contentLines.push(`(${escapePdfText(line.text)}) Tj`);
  }
  contentLines.push('ET');

  const contentStream = `${contentLines.join('\n')}\n`;

  const chunks: string[] = [];
  const offsets: number[] = [];
  let length = 0;

  const addChunk = (value: string) => {
    chunks.push(value);
    length += Buffer.byteLength(value, 'utf8');
  };

  const addObject = (id: number, body: string) => {
    offsets[id] = length;
    addChunk(`${id} 0 obj\n${body}\nendobj\n`);
  };

  addChunk('%PDF-1.4\n');

  addObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
  addObject(2, '<< /Type /Pages /Count 1 /Kids [3 0 R] >>');
  addObject(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  addObject(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject(5, `<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}endstream`);

  const xrefStart = length;
  const objectCount = 5;

  addChunk(`xref\n0 ${objectCount + 1}\n`);
  addChunk('0000000000 65535 f \n');

  for (let i = 1; i <= objectCount; i += 1) {
    const offset = offsets[i] || 0;
    addChunk(`${String(offset).padStart(10, '0')} 00000 n \n`);
  }

  addChunk(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\n`);
  addChunk(`startxref\n${xrefStart}\n%%EOF\n`);

  return Buffer.from(chunks.join(''), 'utf8');
}

// Curriculum PDF types
type CurriculumPdfData = {
  user: {
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
    address?: string;
  };
  professional_objective?: string;
  additional_info?: string;
  education: Array<{
    institution: string;
    degree: string;
    field_of_study?: string;
    start_date?: string;
    end_date?: string;
    is_current?: number;
  }>;
  experience: Array<{
    company: string;
    position: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_current?: number;
    description?: string;
  }>;
  external_certs: Array<{
    name: string;
    institution: string;
    issue_date?: string;
  }>;
  platform_certs: Array<{
    course_title: string;
    duration_hours?: number;
    issued_at: number;
  }>;
  skills: Array<{
    name: string;
    level?: string;
  }>;
  languages: Array<{
    language: string;
    proficiency?: string;
  }>;
};

const levelLabels: Record<string, string> = {
  basic: 'Basico',
  intermediate: 'Intermediario',
  advanced: 'Avancado',
  expert: 'Expert',
  fluent: 'Fluente',
  native: 'Nativo'
};

export function generateCurriculumPdf(data: CurriculumPdfData): Buffer {
  const lines: Array<{ text: string; size: number; bold?: boolean }> = [];

  // Header - Name
  lines.push({ text: data.user.name || 'Nome nao informado', size: 24, bold: true });

  // Contact info
  const contactParts: string[] = [];
  if (data.user.email) contactParts.push(data.user.email);
  if (data.user.phone) contactParts.push(data.user.phone);
  if (contactParts.length > 0) {
    lines.push({ text: contactParts.join(' | '), size: 10 });
  }
  if (data.user.address) {
    lines.push({ text: data.user.address, size: 10 });
  }

  // Professional Objective
  if (data.professional_objective) {
    lines.push({ text: '', size: 10 });
    lines.push({ text: 'OBJETIVO PROFISSIONAL', size: 12, bold: true });
    lines.push({ text: data.professional_objective, size: 10 });
  }

  // Education
  if (data.education.length > 0) {
    lines.push({ text: '', size: 10 });
    lines.push({ text: 'FORMACAO ACADEMICA', size: 12, bold: true });
    for (const edu of data.education) {
      const period = edu.is_current
        ? `${edu.start_date || ''} - Atual`
        : `${edu.start_date || ''} - ${edu.end_date || ''}`;
      lines.push({ text: `${edu.degree} - ${edu.institution}`, size: 10 });
      if (edu.field_of_study) {
        lines.push({ text: `Area: ${edu.field_of_study} | ${period}`, size: 9 });
      } else {
        lines.push({ text: period, size: 9 });
      }
    }
  }

  // Experience
  if (data.experience.length > 0) {
    lines.push({ text: '', size: 10 });
    lines.push({ text: 'EXPERIENCIA PROFISSIONAL', size: 12, bold: true });
    for (const exp of data.experience) {
      const period = exp.is_current
        ? `${exp.start_date || ''} - Atual`
        : `${exp.start_date || ''} - ${exp.end_date || ''}`;
      lines.push({ text: `${exp.position} - ${exp.company}`, size: 10 });
      const locationPeriod = exp.location ? `${exp.location} | ${period}` : period;
      lines.push({ text: locationPeriod, size: 9 });
      if (exp.description) {
        lines.push({ text: exp.description, size: 9 });
      }
    }
  }

  // Certifications (Platform + External)
  const allCerts = [
    ...data.platform_certs.map(c => ({
      name: c.course_title,
      institution: 'MAEXTRIA',
      date: new Date(c.issued_at).toISOString().slice(0, 10)
    })),
    ...data.external_certs.map(c => ({
      name: c.name,
      institution: c.institution,
      date: c.issue_date || ''
    }))
  ];

  if (allCerts.length > 0) {
    lines.push({ text: '', size: 10 });
    lines.push({ text: 'CURSOS E CERTIFICACOES', size: 12, bold: true });
    for (const cert of allCerts) {
      lines.push({ text: `${cert.name} - ${cert.institution}`, size: 10 });
      if (cert.date) {
        lines.push({ text: cert.date, size: 9 });
      }
    }
  }

  // Skills
  if (data.skills.length > 0) {
    lines.push({ text: '', size: 10 });
    lines.push({ text: 'HABILIDADES', size: 12, bold: true });
    const skillTexts = data.skills.map(s =>
      s.level ? `${s.name} (${levelLabels[s.level] || s.level})` : s.name
    );
    lines.push({ text: skillTexts.join(', '), size: 10 });
  }

  // Languages
  if (data.languages.length > 0) {
    lines.push({ text: '', size: 10 });
    lines.push({ text: 'IDIOMAS', size: 12, bold: true });
    const langTexts = data.languages.map(l =>
      l.proficiency ? `${l.language} - ${levelLabels[l.proficiency] || l.proficiency}` : l.language
    );
    lines.push({ text: langTexts.join(', '), size: 10 });
  }

  // Additional Info
  if (data.additional_info) {
    lines.push({ text: '', size: 10 });
    lines.push({ text: 'INFORMACOES ADICIONAIS', size: 12, bold: true });
    lines.push({ text: data.additional_info, size: 10 });
  }

  // Build PDF content
  const contentLines: string[] = [];
  contentLines.push('BT');
  contentLines.push('/F1 24 Tf');
  contentLines.push('50 750 Td');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i > 0) {
      const spacing = line.size >= 12 ? -20 : -14;
      contentLines.push(`0 ${spacing} Td`);
    }
    contentLines.push(`/F1 ${line.size} Tf`);
    contentLines.push(`(${escapePdfText(line.text)}) Tj`);
  }
  contentLines.push('ET');

  const contentStream = `${contentLines.join('\n')}\n`;

  const chunks: string[] = [];
  const offsets: number[] = [];
  let length = 0;

  const addChunk = (value: string) => {
    chunks.push(value);
    length += Buffer.byteLength(value, 'utf8');
  };

  const addObject = (id: number, body: string) => {
    offsets[id] = length;
    addChunk(`${id} 0 obj\n${body}\nendobj\n`);
  };

  addChunk('%PDF-1.4\n');

  addObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
  addObject(2, '<< /Type /Pages /Count 1 /Kids [3 0 R] >>');
  addObject(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  addObject(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject(5, `<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}endstream`);

  const xrefStart = length;
  const objectCount = 5;

  addChunk(`xref\n0 ${objectCount + 1}\n`);
  addChunk('0000000000 65535 f \n');

  for (let i = 1; i <= objectCount; i += 1) {
    const offset = offsets[i] || 0;
    addChunk(`${String(offset).padStart(10, '0')} 00000 n \n`);
  }

  addChunk(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\n`);
  addChunk(`startxref\n${xrefStart}\n%%EOF\n`);

  return Buffer.from(chunks.join(''), 'utf8');
}
