#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️  Gerando sitemap.xml...');

// Configurar Supabase (opcional)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zcrwmdctwjqrvzbvfpuj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

let supabase = null;
if (supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase configurado - buscando cursos...');
} else {
  console.log('⚠️  Chave Supabase não encontrada - gerando sitemap básico...');
}

async function generateSitemap() {
  try {
    const currentDate = new Date().toISOString().split('T')[0];

    // Buscar cursos do Supabase (se configurado)
    let courses = [];
    let categories = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('cursos')
          .select('id, titulo, categoria, updated_at, created_at')
          .eq('ativo', true);

        if (!error && data) {
          courses = data;
          categories = [...new Set(data.map(c => c.categoria).filter(Boolean))];
          console.log(`✅ Encontrados ${courses.length} cursos e ${categories.length} categorias`);
        }
      } catch (err) {
        console.log('⚠️  Erro ao buscar cursos:', err.message);
      }
    }

    // Montar XML do sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

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

  <url>
    <loc>https://www.maextria.com.br/reset-password</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`;

    // Adicionar cada curso dinamicamente
    if (courses.length > 0) {
      courses.forEach((course) => {
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

      // Adicionar categorias únicas
      if (categories.length > 0) {
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
      }
    }

    xml += `
</urlset>`;

    // Salvar arquivo
    const publicDir = path.join(__dirname, '..', 'public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    fs.writeFileSync(sitemapPath, xml, 'utf-8');

    console.log('✅ Sitemap gerado com sucesso!');
    console.log(`📍 Localização: ${sitemapPath}`);
    console.log(`🔗 URL: https://www.maextria.com.br/sitemap.xml`);
    console.log(`📊 Total de URLs: ${courses.length + 7 + (categories ? categories.length : 0)}`);

  } catch (error) {
    console.error('❌ Erro ao gerar sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
