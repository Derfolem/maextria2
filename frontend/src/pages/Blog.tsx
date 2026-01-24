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
    <div className="relative min-h-[calc(100vh-8rem)] bg-[hsl(var(--background))] py-12 px-[clamp(24px,5vw,80px)] overflow-hidden">
      <div className="pointer-events-none absolute -top-20 right-[-10%] h-80 w-80 rounded-full bg-[hsl(var(--primary))]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-[-10%] h-96 w-96 rounded-full bg-[hsl(var(--accent))]/20 blur-3xl" />
      <div className="relative max-w-6xl mx-auto space-y-12">
        <section className="relative overflow-hidden rounded-[32px] bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/80 to-slate-950" />
          <div className="relative p-8 sm:p-10 md:p-14 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-center">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">Blog MAEXTRIA</p>
              <h1 className="headline-font text-3xl sm:text-4xl md:text-5xl leading-tight">
                Insights que viram movimento de carreira
              </h1>
              <p className="text-white/80 text-lg">
                Conteudos densos, com decisao clara. Mercado, certificacoes e habilidades que aceleram sua evolucao.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/courses" className="btn-accent w-full sm:w-auto text-center">Ver cursos</Link>
                <Link to="/blog" className="btn-outline text-white border-white/40 w-full sm:w-auto text-center">
                  Ler blog
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 text-sm text-white/70">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Trilhas</p>
                  <p className="text-lg font-semibold">Certificadas</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Foco</p>
                  <p className="text-lg font-semibold">Aplicacao real</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="/hero-01.webp"
                alt="Blog MAEXTRIA"
                loading="lazy"
                decoding="async"
                width={600}
                height={400}
                className="w-full rounded-[24px] shadow-2xl border border-white/10"
              />
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
              <section className="grid grid-cols-[1.1fr_0.9fr] gap-4 sm:gap-6">
                <Link
                  to={`/blog/${featured.slug}`}
                  className="card p-0 overflow-hidden grid grid-cols-[1.1fr_0.9fr] group bg-slate-950 text-white"
                >
                  <div className="relative p-8 space-y-4 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-20"
                      style={{ backgroundImage: `url(${featured.imagem_capa_url || '/hero-01.webp'})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/85 to-slate-950" />
                    <div className="relative space-y-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                        Destaque editorial
                      </p>
                      <h2 className="headline-font text-3xl md:text-4xl group-hover:text-[hsl(var(--primary))] transition">
                        {featured.titulo}
                      </h2>
                      <p className="text-white/80 text-lg">{featured.resumo}</p>
                      <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-white/60">
                        <span>{featured.autor}</span>
                        {featured.publicado_em && (
                          <span>{new Date(featured.publicado_em).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="min-h-[260px] bg-[hsl(var(--muted))]">
                    <img
                      src={featured.imagem_capa_url || '/hero-01.webp'}
                      alt={featured.titulo}
                      loading="lazy"
                      decoding="async"
                      width={640}
                      height={420}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <div
                  className="card relative overflow-hidden p-6 space-y-4"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.9)), url('/blog/trilha-futuro.svg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />
                  <div className="relative space-y-4 text-white">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">Leitura guiada</p>
                  <p className="text-lg font-semibold">Sua proxima habilidade em 30 dias</p>
                  <p className="text-sm text-white/80">
                    Descubra como escolher a trilha certa, criar prova pratica e acelerar sua entrada em vagas reais.
                  </p>
                  <Link to="/courses" className="btn-accent w-full text-center">Explorar trilhas</Link>
                  </div>
                </div>
              </section>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--muted-foreground))]">Arquivo</p>
                <h2 className="headline-font text-2xl md:text-3xl">Todos os artigos</h2>
              </div>
              <Link to="/courses" className="text-sm font-semibold text-[hsl(var(--primary))]">
                Ver cursos
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {rest.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="card p-6 group hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition"
                >
                  <div className="w-full h-44 rounded-[18px] mb-4 overflow-hidden bg-[hsl(var(--muted))]">
                    {post.imagem_capa_url ? (
                      <img
                        src={post.imagem_capa_url}
                        alt={post.titulo}
                        loading="lazy"
                        decoding="async"
                        width={400}
                        height={260}
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
