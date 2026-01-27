import { Router, Request, Response } from 'express';
import db from '../database/schema';

const router = Router();

// Sitemap dinâmico - atualiza automaticamente com novos cursos
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];

    // Buscar todos os cursos publicados
    const courses = db.prepare(`
      SELECT id, title, category_id, updated_at, created_at
      FROM courses
      WHERE is_published = 1
      ORDER BY created_at DESC
    `).all() as Array<{ id: string; title: string; category_id: string; updated_at: string; created_at: string }>;

    // Buscar categorias
    const categories = db.prepare(`
      SELECT DISTINCT id, name FROM categories
    `).all() as Array<{ id: string; name: string }>;

    // Montar XML do sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Pagina Principal -->
  <url>
    <loc>https://www.maextria.com.br/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Catalogo de Cursos -->
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

  <!-- Verificacao de Certificados -->
  <url>
    <loc>https://www.maextria.com.br/verificar-certificado</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Paginas de Auth -->
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

  <!-- Perguntas Frequentes -->
  <url>
    <loc>https://www.maextria.com.br/faq</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
`;

    // Adicionar cada curso dinamicamente
    courses.forEach((course) => {
      const lastmod = course.updated_at || course.created_at || currentDate;
      const courseDate = new Date(lastmod).toISOString().split('T')[0];

      xml += `
  <url>
    <loc>https://www.maextria.com.br/course/${course.id}</loc>
    <lastmod>${courseDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    // Adicionar categorias
    categories.forEach((category) => {
      xml += `
  <url>
    <loc>https://www.maextria.com.br/courses?category=${encodeURIComponent(category.id)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    xml += `
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    res.status(500).set('Content-Type', 'text/plain').send('Erro ao gerar sitemap');
  }
});

export default router;
