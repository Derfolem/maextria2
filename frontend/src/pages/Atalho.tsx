import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type AtalhoPost = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  autor: string;
  imagem_capa_url: string | null;
  publicado_em: string | null;
};

export default function Atalho() {
  const [posts, setPosts] = useState<AtalhoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [caseFilter, setCaseFilter] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'az'>('recent');

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const caseNames = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((post) => set.add(post.autor));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [posts]);

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
          if (dist <= 2) score += 0.5;
        }
      });
      return score;
    };

    return posts
      .map((post) => {
        const score = [
          scoreField(post.titulo),
          scoreField(post.resumo || ''),
          scoreField(post.autor),
          scoreField(post.slug),
        ].reduce((acc, value) => acc + value, 0);
        return { post, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.post);
  }, [normalizedQuery, posts]);

  const filteredResults = useMemo(() => {
    const base = normalizedQuery ? results : posts;
    return base.filter((post) => !caseFilter || post.autor === caseFilter);
  }, [results, posts, normalizedQuery, caseFilter]);

  const sortedResults = useMemo(() => {
    const base = [...filteredResults];
    switch (sortBy) {
      case 'oldest':
        return base.sort((a, b) => {
          const aDate = a.publicado_em ? new Date(a.publicado_em).getTime() : 0;
          const bDate = b.publicado_em ? new Date(b.publicado_em).getTime() : 0;
          return aDate - bDate;
        });
      case 'az':
        return base.sort((a, b) => a.titulo.localeCompare(b.titulo));
      default:
        return base.sort((a, b) => {
          const aDate = a.publicado_em ? new Date(a.publicado_em).getTime() : 0;
          const bDate = b.publicado_em ? new Date(b.publicado_em).getTime() : 0;
          return bDate - aDate;
        });
    }
  }, [filteredResults, sortBy]);

  const hasActiveFilters = Boolean(normalizedQuery) || Boolean(caseFilter) || sortBy !== 'recent';

  const featured = useMemo(() => (!hasActiveFilters ? sortedResults[0] : null), [hasActiveFilters, sortedResults]);
  const rest = useMemo(() => (featured ? sortedResults.slice(1) : sortedResults), [featured, sortedResults]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, titulo, slug, resumo, autor, imagem_capa_url, publicado_em')
        .eq('tipo', 'atalho')
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
      <div className="pointer-events-none absolute -top-24 right-[-5%] h-96 w-96 rounded-full bg-[hsl(var(--primary))]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-[-15%] h-[28rem] w-[28rem] rounded-full bg-[hsl(var(--accent))]/20 blur-3xl" />
      <div className="relative max-w-6xl mx-auto space-y-12">
        <section className="relative overflow-hidden rounded-[32px] bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/80 to-slate-950" />
          <div className="relative p-8 sm:p-10 md:p-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">Atalho MAEXTRIA</p>
              <h1 className="headline-font text-3xl sm:text-4xl md:text-5xl leading-tight">
                Conselhos que viram divisor de aguas
              </h1>
              <p className="text-white/80 text-lg">
                Histórias reais, decisões críticas e o caminho das pedras para acelerar sua evolução profissional.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/courses" className="btn-accent w-full sm:w-auto text-center">Ver cursos</Link>
                <Link to="/atalho" className="btn-outline text-white border-white/40 w-full sm:w-auto text-center">
                  Ver atalhos
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Por dentro do case</p>
                <h3 className="text-2xl font-semibold mt-3">
                  Conselhos que você aplicaria amanhã.
                </h3>
                <p className="text-sm text-white/70 mt-3">
                  Cada publicação apresenta um case real com passos práticos, escolhas difíceis e o impacto direto
                  na carreira.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/15" />
                  <div>
                    <p className="text-sm font-semibold">Comunidade MAEXTRIA</p>
                    <p className="text-xs text-white/60">Curadoria editorial</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-cyan-400/30 blur-2xl" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_2fr] items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Cases em destaque</p>
            <h2 className="headline-font text-2xl md:text-3xl mt-3">
              Aprenda com quem já venceu o caminho
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="search"
              className="input-field"
              placeholder="Buscar por nome ou tema"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="input-field"
              value={caseFilter}
              onChange={(event) => setCaseFilter(event.target.value)}
            >
              <option value="">Todos os cases</option>
              {caseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className="input-field"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            >
              <option value="recent">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="az">A-Z</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card p-6 space-y-4">
                <div className="h-40 rounded-[20px] bg-gray-200 shimmer" />
                <div className="h-5 bg-gray-200 rounded shimmer" />
                <div className="h-4 bg-gray-200 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : sortedResults.length === 0 ? (
          <div className="card p-6 text-[hsl(var(--muted-foreground))]">
            Nenhum atalho publicado ainda.
          </div>
        ) : (
          <div className="space-y-10">
            {featured && (
              <Link
                to={`/atalho/${featured.slug}`}
                className="group grid gap-6 lg:grid-cols-[1.25fr_0.9fr] items-center card overflow-hidden"
              >
                <div className="p-6 sm:p-8 space-y-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">
                    Case em destaque
                  </p>
                  <h3 className="headline-font text-2xl md:text-3xl">{featured.titulo}</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{featured.resumo}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-[hsl(var(--muted-foreground))]">
                    <span>{featured.autor}</span>
                    {featured.publicado_em && (
                      <span>{new Date(featured.publicado_em).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
                <div className="h-full min-h-[220px] bg-[hsl(var(--muted))]">
                  {featured.imagem_capa_url ? (
                    <img
                      src={featured.imagem_capa_url}
                      alt={featured.titulo}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)]" />
                  )}
                </div>
              </Link>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {rest.map((post) => (
                <Link key={post.id} to={`/atalho/${post.slug}`} className="group card overflow-hidden">
                  <div className="h-48 bg-[hsl(var(--muted))]">
                    {post.imagem_capa_url ? (
                      <img
                        src={post.imagem_capa_url}
                        alt={post.titulo}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_60%)]" />
                    )}
                  </div>
                  <div className="p-6 space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">{post.autor}</p>
                    <h3 className="headline-font text-xl">{post.titulo}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-3">{post.resumo}</p>
                    {post.publicado_em && (
                      <p className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--muted-foreground))]">
                        {new Date(post.publicado_em).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
