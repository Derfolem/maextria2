/**
 * Vercel Edge Middleware
 * Detecta robôs de redes sociais acessando /courses/:id e retorna
 * HTML com OG tags dinâmicos do curso (título, imagem, descrição).
 * Usuários normais passam direto para o SPA sem interferência.
 */

export const config = {
  matcher: ['/courses/:path+'],
};

const SITE_URL = 'https://www.maextria.com.br';

const SOCIAL_BOTS =
  /facebookexternalhit|facebookcatalog|twitterbot|linkedinbot|whatsapp|telegrambot|pinterest|slackbot|discordbot|vkshare|baiduspider|applebot|googlebot|bingbot/i;

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

export default async function middleware(request: Request): Promise<Response | undefined> {
  const userAgent = request.headers.get('user-agent') || '';

  // Deixa usuários normais passarem para o SPA
  if (!SOCIAL_BOTS.test(userAgent)) {
    return undefined;
  }

  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const courseId = parts[1]; // /courses/:id → parts = ['courses', ':id']

  if (!courseId) return undefined;

  const courseUrl = `${SITE_URL}/courses/${courseId}`;

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) return undefined;

    const apiUrl = `${supabaseUrl}/rest/v1/cursos?id=eq.${encodeURIComponent(courseId)}&is_published=eq.true&select=id,titulo,descricao,thumbnail&limit=1`;

    const resp = await fetch(apiUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!resp.ok) return undefined;

    const data: any[] = await resp.json();
    const course = Array.isArray(data) ? data[0] : null;

    if (!course) return undefined;

    const title = escapeHtml(`${course.titulo} - Curso Online com Certificado | MAEXTRIA`);
    const rawDesc = stripHtml(course.descricao || '');
    const description = escapeHtml(
      rawDesc.substring(0, 160) ||
        `Aprenda ${course.titulo} com certificado reconhecido. Acesso vitalício.`
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
</head>
<body>
  <p><a href="${safeUrl}">${escapeHtml(course.titulo)}</a></p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch {
    return undefined;
  }
}
