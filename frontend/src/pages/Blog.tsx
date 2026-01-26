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
  const [search, setSearch] = useState('');

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const levenshtein = (a: string, b: string) => {
    if (a === b) return 0;
    const aLen = a.length;
    const bLen = b.length;
    if (!aLen) return bLen;
    if (!bLen) return aLen;

    const dp = Array.from({ length: aLen + 1 }, () => new Array(bLen + 1).fill(0));
    for (let i = 0; i <= aLen; i += 1) dp[i][0] = i;
    for (let j = 0; j <= bLen; j += 1) dp[0][j] = j;

    for (let i = 1; i <= aLen; i += 1) {
      for (let j = 1; j <= bLen; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[aLen][bLen];
  };

  const normalizedQuery = useMemo(() => normalize(search), [search]);

  const results = useMemo(() => {
    if (!normalizedQuery) return posts;
    const tokens = normalizedQuery.split(' ').filter(Boolean);

    const scoreField = (field: string) => {
      if (!field) return 0;
      const hay = normalize(field);
      let score = 0;
      tokens.forEach((token) => {
        const idx = hay.indexOf(token);
        if (idx >= 0) {
          score += 2 + token.length / Math.max(hay.length, 1) + 1 / (idx + 1);
        } else if (token.length > 3) {
          const dist = levenshtein(token, hay.slice(0, Math.min(hay.length, token.length + 2)));
          if (dist <= 2) {
            score += 0.5;
          }
        }
      });
      return score;
    };

    return posts
      .map((post) => {
        const dateLabel = post.publicado_em
          ? new Date(post.publicado_em).toLocaleDateString('pt-BR')
          : '';
        const monthLabel = post.publicado_em
          ? new Date(post.publicado_em).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          : '';
        const score = [
          scoreField(post.titulo),
          scoreField(post.resumo || ''),
          scoreField(post.autor),
          scoreField(dateLabel),
          scoreField(monthLabel),
          scoreField(post.slug),
        ].reduce((acc, value) => acc + value, 0);
        return { post, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.post);
  }, [normalizedQuery, posts]);

  const featured = useMemo(() => (normalizedQuery ? null : results[0]), [normalizedQuery, results]);
  const rest = useMemo(
    () => (normalizedQuery ? results : results.slice(1)),
    [normalizedQuery, results]
  );

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
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 text-xs sm:text-sm text-white/70">
                <div className="rounded-2xl bg-white/10 p-4 text-center">
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/60">Trilhas</p>
                  <p className="text-base sm:text-lg font-semibold">Certificadas</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 text-center">
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/60">Foco</p>
                  <p className="text-base sm:text-lg font-semibold">Aplicacao real</p>
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
              <section className="grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
                <Link
                  to={`/blog/${featured.slug}`}
                  className="card p-0 overflow-hidden grid md:grid-cols-[1.1fr_0.9fr] group bg-slate-950 text-white"
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
                  <div className="min-h-[240px] md:min-h-[260px] bg-[hsl(var(--muted))]">
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
                  className="card relative overflow-hidden p-6 space-y-4 min-h-[240px] md:min-h-[260px]"
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

            <div className="card p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--muted-foreground))]">Pesquisar</p>
                  <h2 className="headline-font text-2xl md:text-3xl">Encontre artigos</h2>
                </div>
                <Link to="/courses" className="text-sm font-semibold text-[hsl(var(--primary))]">
                  Ver cursos
                </Link>
              </div>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input-field"
                placeholder="Pesquisar por nome, categoria, data ou tema"
              />
              {normalizedQuery && (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {results.length} resultado{results.length === 1 ? '' : 's'} para "{search}"
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--muted-foreground))]">Arquivo</p>
                <h2 className="headline-font text-2xl md:text-3xl">
                  {normalizedQuery ? 'Artigos encontrados' : 'Todos os artigos'}
                </h2>
              </div>
              {!normalizedQuery && (
                <Link to="/courses" className="text-sm font-semibold text-[hsl(var(--primary))]">
                  Ver cursos
                </Link>
              )}
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
                    <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-3">
                      {post.resumo}
                    </p>
                    <span className="text-sm text-[hsl(var(--primary))] font-medium">...ler mais</span>
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
