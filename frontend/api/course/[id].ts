import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://www.maextria.com.br';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.redirect(302, `${SITE_URL}/courses`);
  }

  const courseUrl = `${SITE_URL}/courses/${id}`;

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return res.redirect(302, courseUrl);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: course } = await supabase
      .from('cursos')
      .select('id, titulo, descricao, thumbnail')
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle();

    if (!course) {
      return res.redirect(302, courseUrl);
    }

    const title = escapeHtml(`${course.titulo} - Curso Online com Certificado | MAEXTRIA`);
    const rawDesc = stripHtml(course.descricao || '');
    const description = escapeHtml(
      rawDesc.substring(0, 160) ||
        `Aprenda ${course.titulo} com certificado reconhecido. Acesso vitalício e suporte especializado.`
    );
    const image = escapeHtml(course.thumbnail || `${SITE_URL}/maextria-logo.png`);
    const safeUrl = escapeHtml(courseUrl);

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="MAEXTRIA" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="canonical" href="${safeUrl}" />
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
  <script>window.location.replace("${safeUrl}");</script>
</head>
<body>
  <p>Redirecionando para <a href="${safeUrl}">${escapeHtml(course.titulo)}</a>...</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).send(html);
  } catch {
    return res.redirect(302, courseUrl);
  }
}
