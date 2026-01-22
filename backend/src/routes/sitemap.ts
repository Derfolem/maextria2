import { Router, Request, Response } from 'express';
import db from '../database';

const router = Router();

// Sitemap dinâmico - atualiza automaticamente com novos cursos
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];

    // Buscar todos os cursos ativos
    const courses = db.prepare(`
      SELECT id, titulo, categoria, updated_at, created_at
      FROM cursos
      WHERE ativo = 1
      ORDER BY created_at DESC
    `).all();

    // Buscar professores ativos
    const teachers = db.prepare(`
      SELECT DISTINCT u.id, u.nome
      FROM usuarios u
      INNER JOIN cursos c ON c.professor_id = u.id
      WHERE c.ativo = 1
    `).all();

    // Montar XML do sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">

  <!-- Página Principal -->
  <url>
    <loc>https://www.maextria.com.br/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Catálogo de Cursos -->
  <url>
    <loc>https://www.maextria.com.br/courses</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Landing Professores -->
  <url>
    <loc>https://www.maextria.com.br/sou-professor</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Verificação de Certificados -->
  <url>
    <loc>https://www.maextria.com.br/verificar-certificado</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Páginas de Auth -->
  <url>
    <loc>https://www.maextria.com.br/login</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>https://www.maextria.com.br/register</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
`;

    // Adicionar cada curso dinamicamente
    courses.forEach((course: any) => {
      const lastmod = course.updated_at || course.created_at || currentDate;
      const courseDate = new Date(lastmod).toISOString().split('T')[0];

      xml += `
  <!-- Curso: ${course.titulo} -->
  <url>
    <loc>https://www.maextria.com.br/course/${course.id}</loc>
    <lastmod>${courseDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    // Adicionar categorias (se tiver)
    const categories = new Set(courses.map((c: any) => c.categoria).filter(Boolean));
    categories.forEach((category) => {
      xml += `
  <!-- Categoria: ${category} -->
  <url>
    <loc>https://www.maextria.com.br/courses?category=${encodeURIComponent(category)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    xml += `
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    res.status(500).send('Erro ao gerar sitemap');
  }
});

export default router;
