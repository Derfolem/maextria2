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
