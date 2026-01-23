import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type BlogPost = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  autor: string;
  imagem_capa_url: string | null;
  publicado_em: string | null;
};

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const featured = useMemo(() => posts[0], [posts]);
  const rest = useMemo(() => posts.slice(1), [posts]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, titulo, slug, resumo, autor, imagem_capa_url, publicado_em')
        .eq('publicado', true)
        .order('publicado_em', { ascending: false });
      if (!error) {
        setPosts(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[hsl(var(--background))] py-12 px-[clamp(24px,5vw,80px)]">
      <div className="max-w-6xl mx-auto space-y-12">
        <section className="relative overflow-hidden rounded-[28px] bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/60 via-transparent to-[hsl(var(--accent))]/40" />
          <div className="relative p-10 md:p-14 grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">Blog MAEXTRIA</p>
              <h1 className="headline-font text-4xl md:text-5xl">Insights que viram movimento de carreira</h1>
              <p className="text-white/80">
                Conteudos densos e aplicaveis sobre mercado, certificacoes e habilidades que aceleram sua evolucao.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/courses" className="btn-accent">Ver cursos</Link>
                <Link to="/blog" className="btn-outline text-white border-white/40">Ler blog</Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img src="/og-maextria.png" alt="Blog MAEXTRIA" loading="lazy" decoding="async" width={600} height={400} className="w-full rounded-[22px] shadow-2xl" />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6">
                <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 shimmer" />
                <div className="h-5 bg-gray-200 rounded mb-2 shimmer" />
                <div className="h-4 bg-gray-200 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-8 text-center text-[hsl(var(--muted-foreground))]">
            Nenhum artigo publicado ainda.
          </div>
        ) : (
          <>
            {featured && (
              <Link
                to={`/blog/${featured.slug}`}
                className="card p-0 overflow-hidden grid md:grid-cols-[1.1fr_0.9fr] group"
              >
                <div className="p-8 space-y-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                    Destaque
                  </p>
                  <h2 className="headline-font text-3xl md:text-4xl group-hover:text-[hsl(var(--primary))] transition">
                    {featured.titulo}
                  </h2>
                  <p className="text-[hsl(var(--muted-foreground))]">{featured.resumo}</p>
                  <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                    <span>{featured.autor}</span>
                    {featured.publicado_em && (
                      <span>{new Date(featured.publicado_em).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
                <div className="min-h-[240px] bg-[hsl(var(--muted))]">
                  <img
                    src={featured.imagem_capa_url || '/og-maextria.png'}
                    alt={featured.titulo}
                    loading="lazy"
                    decoding="async"
                    width={640}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
            )}

            <div className="grid md:grid-cols-3 gap-8">
              {rest.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="card p-6 group hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition"
                >
                  <div className="w-full h-44 rounded-[16px] mb-4 overflow-hidden bg-[hsl(var(--muted))]">
                    {post.imagem_capa_url ? (
                      <img
                        src={post.imagem_capa_url}
                        alt={post.titulo}
                        loading="lazy"
                        decoding="async"
                        width={400}
                        height={250}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-[hsl(var(--primary))]">
                        {post.titulo.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                      {post.autor}
                    </p>
                    <h3 className="text-xl font-semibold group-hover:text-[hsl(var(--primary))] transition">
                      {post.titulo}
                    </h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {post.resumo}
                    </p>
                    {post.publicado_em && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(post.publicado_em).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <section className="card p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Seu proximo passo e agora</h2>
            <p className="text-[hsl(var(--muted-foreground))]">
              Cursos curados e certificados que comprovam sua evolucao. Menos duvida, mais resultado.
            </p>
          </div>
          <Link to="/courses" className="btn-accent">Explorar cursos</Link>
        </section>
      </div>
    </div>
  );
}
