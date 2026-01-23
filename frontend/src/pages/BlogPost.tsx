import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '../lib/supabase';
import { createArticleSchema } from '../components/AdvancedSchemas';
import { Breadcrumb } from '../components/Breadcrumb';

type BlogPost = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo_html: string;
  autor: string;
  imagem_capa_url: string | null;
  publicado_em: string | null;
  atualizado_em: string | null;
};

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, titulo, slug, resumo, conteudo_html, autor, imagem_capa_url, publicado_em, atualizado_em')
        .eq('slug', slug)
        .eq('publicado', true)
        .maybeSingle();
      if (!error) {
        setPost(data || null);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const sanitized = useMemo(() => (
    post?.conteudo_html ? DOMPurify.sanitize(post.conteudo_html) : ''
  ), [post?.conteudo_html]);

  const readingTime = useMemo(() => {
    if (!post?.conteudo_html) return null;
    const text = post.conteudo_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    const words = text.split(' ').length;
    const minutes = Math.max(1, Math.round(words / 220));
    return `${minutes} min de leitura`;
  }, [post?.conteudo_html]);

  const schema = useMemo(() => {
    if (!post?.publicado_em) return null;
    return createArticleSchema({
      headline: post.titulo,
      image: post.imagem_capa_url || 'https://www.maextria.com.br/maextria-logo.png',
      datePublished: post.publicado_em,
      dateModified: post.atualizado_em || post.publicado_em,
      author: post.autor,
      description: post.resumo || '',
    });
  }, [post]);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[hsl(var(--background))] py-12 px-[clamp(24px,5vw,80px)]">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb visual */}
        <Breadcrumb
          items={[
            { label: 'Blog', href: '/blog' },
            { label: post?.titulo || 'Artigo' },
          ]}
          className="mb-6"
        />

        {loading ? (
          <div className="card p-8 mt-6">
            <div className="h-6 w-2/3 bg-gray-200 rounded mb-3 shimmer" />
            <div className="h-4 w-1/3 bg-gray-200 rounded mb-6 shimmer" />
            <div className="h-44 bg-gray-200 rounded mb-6 shimmer" />
            <div className="h-4 bg-gray-200 rounded mb-2 shimmer" />
            <div className="h-4 bg-gray-200 rounded mb-2 shimmer" />
            <div className="h-4 bg-gray-200 rounded shimmer" />
          </div>
        ) : !post ? (
          <div className="card p-8 mt-6 text-[hsl(var(--muted-foreground))]">
            Artigo nao encontrado.
          </div>
        ) : (
          <article className="card relative mt-6 overflow-hidden">
            {schema && (
              <script type="application/ld+json">
                {JSON.stringify(schema)}
              </script>
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_55%)]" />
            <div className="relative p-8 space-y-10">
              <header className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">{post.autor}</p>
                <h1 className="headline-font text-3xl md:text-4xl leading-tight">{post.titulo}</h1>
                <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.25em] text-[hsl(var(--muted-foreground))]">
                  {post.publicado_em && (
                    <span>{new Date(post.publicado_em).toLocaleDateString('pt-BR')}</span>
                  )}
                  {readingTime && <span>{readingTime}</span>}
                </div>
                {post.resumo && (
                  <div className="rounded-[18px] bg-[hsl(var(--muted))] p-5 text-sm text-[hsl(var(--muted-foreground))]">
                    {post.resumo}
                  </div>
                )}
              </header>

              {post.imagem_capa_url && (
                <img
                  src={post.imagem_capa_url}
                  alt={post.titulo}
                  loading="lazy"
                  decoding="async"
                  width={960}
                  height={520}
                  className="w-full rounded-[22px] object-cover max-h-[480px]"
                />
              )}

              <div className="grid lg:grid-cols-[1fr_0.4fr] gap-10">
                <div className="space-y-6">
                  <div
                    className="prose prose-lg prose-neutral max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-figcaption:text-sm prose-figcaption:text-[hsl(var(--muted-foreground))] prose-img:rounded-[20px]"
                    dangerouslySetInnerHTML={{ __html: sanitized }}
                  />
                </div>
                <aside className="space-y-4 lg:sticky lg:top-24 self-start">
                  <div className="card p-5 bg-[hsl(var(--muted))]">
                    <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Proximo passo</p>
                    <h3 className="text-lg font-semibold mt-2">Cursos + Certificados</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                      Aprenda com foco, valide com certificado e leve prova real para o mercado.
                    </p>
                    <Link to="/courses" className="btn-accent mt-4 w-full text-center">
                      Ver cursos
                    </Link>
                  </div>
                  <div className="card p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
                      Dica rapida
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                      Use o certificado como prova no curriculo, no LinkedIn e nas entrevistas. A clareza acelera convites.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
