import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const serverEntry = path.join(rootDir, 'dist-ssr', 'entry-server.js');
const templatePath = path.join(distDir, 'index.html');

const routes = [
  '/',
  '/courses',
  '/sou-professor',
  '/verificar-certificado',
  '/login',
  '/register',
  '/reset-password',
];

const template = await readFile(templatePath, 'utf-8');
if (!template.includes('<!--app-html-->')) {
  throw new Error('Missing <!--app-html--> placeholder in index.html.');
}

const baseUrl = 'https://www.maextria.com.br';
const routeMeta = {
  '/': {
    title: 'MAEXTRIA - Plataforma de Cursos Online',
    description: 'MAEXTRIA: plataforma de cursos online com trilhas, certificados e conteudo com IA.',
    ogImage: `${baseUrl}/maextria-logo.png`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'MAEXTRIA',
        url: baseUrl,
        logo: `${baseUrl}/maextria-logo.png`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'MAEXTRIA',
        url: baseUrl,
      },
    ],
  },
  '/courses': {
    title: 'Cursos | MAEXTRIA',
    description: 'Explore cursos curados para aprender, aplicar e expandir com foco pratico.',
    ogImage: `${baseUrl}/hero-01.png`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Cursos MAEXTRIA',
        url: `${baseUrl}/courses`,
      },
    ],
  },
  '/sou-professor': {
    title: 'Sou Professor | MAEXTRIA',
    description: 'Compartilhe sua experiencia e crie cursos com a MAEXTRIA.',
    ogImage: `${baseUrl}/hero-02.png`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Sou Professor',
        url: `${baseUrl}/sou-professor`,
      },
    ],
  },
  '/verificar-certificado': {
    title: 'Verificar Certificado | MAEXTRIA',
    description: 'Valide certificados emitidos pela MAEXTRIA com seguranca.',
    ogImage: `${baseUrl}/hero-03.png`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Verificar Certificado',
        url: `${baseUrl}/verificar-certificado`,
      },
    ],
  },
  '/login': {
    title: 'Entrar | MAEXTRIA',
    description: 'Acesse sua conta MAEXTRIA.',
    ogImage: `${baseUrl}/maextria-logo.png`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Entrar',
        url: `${baseUrl}/login`,
      },
    ],
  },
  '/register': {
    title: 'Criar Conta | MAEXTRIA',
    description: 'Crie sua conta gratuita e comece a aprender na MAEXTRIA.',
    ogImage: `${baseUrl}/maextria-logo.png`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Criar Conta',
        url: `${baseUrl}/register`,
      },
    ],
  },
  '/reset-password': {
    title: 'Recuperar Senha | MAEXTRIA',
    description: 'Redefina sua senha para acessar sua conta.',
    ogImage: `${baseUrl}/maextria-logo.png`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Recuperar Senha',
        url: `${baseUrl}/reset-password`,
      },
    ],
  },
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const replaceTag = (html, regex, next) => {
  if (!regex.test(html)) return html;
  return html.replace(regex, next);
};

const injectBeforeHeadClose = (html, snippet) => {
  if (!snippet) return html;
  const marker = '</head>';
  if (!html.includes(marker)) return html;
  return html.replace(marker, `${snippet}\n  ${marker}`);
};

const upsertPreload = (html, href) => {
  const tag = `<link rel="preload" as="image" href="${href}" type="image/avif" imagesizes="100vw" />`;
  if (html.includes(tag)) return html;
  return injectBeforeHeadClose(html, tag);
};

const { render } = await import(serverEntry);

const writeRoute = async (route) => {
  const appHtml = render(route);
  const meta = routeMeta[route] || routeMeta['/'];
  const canonical = `${baseUrl}${route === '/' ? '/' : route}`;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const ogImage = meta.ogImage || routeMeta['/'].ogImage;
  const heroPreload = route === '/' ? `${baseUrl}/hero-01.avif` : '';

  let html = template.replace('<!--app-html-->', appHtml);
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = replaceTag(
    html,
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`
  );
  html = replaceTag(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`
  );
  html = replaceTag(
    html,
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${title}" />`
  );
  html = replaceTag(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${description}" />`
  );
  html = replaceTag(
    html,
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonical}" />`
  );
  html = replaceTag(
    html,
    /<meta property="og:image" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${ogImage}" />`
  );
  html = replaceTag(
    html,
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${title}" />`
  );
  html = replaceTag(
    html,
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${description}" />`
  );
  html = replaceTag(
    html,
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${ogImage}" />`
  );

  const jsonLd = meta.jsonLd || [];
  const jsonLdTags = jsonLd
    .map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`)
    .join('\n');
  html = injectBeforeHeadClose(html, jsonLdTags);
  if (heroPreload) {
    html = upsertPreload(html, heroPreload);
  }

  const targetDir = route === '/' ? distDir : path.join(distDir, route.slice(1));
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, 'index.html'), html);
};

await Promise.all(routes.map(writeRoute));
