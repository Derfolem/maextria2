import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  // URL do site (ajuste se mudar domínio)
  const site = "https://www.maextria.com.br";

  // Conexão ao Supabase com as variáveis da Vercel
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  // Busca cursos publicados
  const { data: cursos } = await supabase
    .from("cursos")
    .select("slug, updated_at")
    .eq("publicado", true);

  // Busca posts publicados (opcional)
  const { data: posts } = await supabase
    .from("marketing_posts")
    .select("slug, updated_at, publicado")
    .eq("publicado", true);

  // Monta as URLs
  const urls: string[] = [];

  // Página inicial
  urls.push(
    `<url><loc>${site}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`
  );

  // Cursos
  (cursos || []).forEach((c) => {
    const lastmod = c.updated_at
      ? new Date(c.updated_at).toISOString()
      : undefined;
    urls.push(
      `<url><loc>${site}/curso/${c.slug}</loc>${
        lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
      }<changefreq>weekly</changefreq><priority>0.8</priority></url>`
    );
  });

  // Posts
  (posts || []).forEach((p) => {
    const lastmod = p.updated_at
      ? new Date(p.updated_at).toISOString()
      : undefined;
    urls.push(
      `<url><loc>${site}/blog/${p.slug}</loc>${
        lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
      }<changefreq>weekly</changefreq><priority>0.7</priority></url>`
    );
  });

  // Gera XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
