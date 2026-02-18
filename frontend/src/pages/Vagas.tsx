import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaSearch, FaMapMarkerAlt, FaBriefcase, FaBuilding, FaExternalLinkAlt } from 'react-icons/fa';
import { SEO } from '../components/SEO';

const APP_ID = import.meta.env.VITE_ADZUNA_APP_ID as string;
const APP_KEY = import.meta.env.VITE_ADZUNA_APP_KEY as string;
const RESULTS_PER_PAGE = 10;

const workTypeOptions = [
  { label: 'Remoto', value: 'remote' },
  { label: 'Presencial', value: 'presencial' },
  { label: 'Período integral', value: 'full_time' },
  { label: 'Meio período', value: 'part_time' },
];

const levelOptions = [
  { label: 'Estágio', value: 'estagio' },
  { label: 'Júnior', value: 'junior' },
  { label: 'Pleno', value: 'pleno' },
  { label: 'Sênior', value: 'senior' },
];

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  company: { display_name: string };
  location: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  redirect_url: string;
  created: string;
  contract_type?: string;
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return '';
  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `A partir de ${fmt(min)}`;
  if (max) return `Até ${fmt(max)}`;
  return '';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function Vagas() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState('');
  const [level, setLevel] = useState('');

  const [jobs, setJobs] = useState<AdzunaJob[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const buildQuery = (kw: string, lv: string, wt: string) => {
    const parts: string[] = [];
    if (kw.trim()) parts.push(kw.trim());
    if (lv) parts.push(lv);
    if (wt === 'remote') parts.push('remoto');
    if (wt === 'full_time') parts.push('período integral');
    if (wt === 'part_time') parts.push('meio período');
    return parts.join(' ') || 'tecnologia';
  };

  const fetchJobs = async (pageNum: number, kw = keyword, lv = level, wt = workType, loc = location) => {
    setLoading(true);
    setError('');
    try {
      const what = encodeURIComponent(buildQuery(kw, lv, wt));
      const where = encodeURIComponent(loc.trim() || 'Brasil');
      const url =
        `https://api.adzuna.com/v1/api/jobs/br/search/${pageNum}` +
        `?app_id=${APP_ID}&app_key=${APP_KEY}` +
        `&results_per_page=${RESULTS_PER_PAGE}` +
        `&what=${what}` +
        `&where=${where}` +
        `&content-type=application/json`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setJobs(data.results ?? []);
      setTotal(data.count ?? 0);
      setPage(pageNum);
      setSearched(true);
    } catch {
      setError('Não foi possível carregar as vagas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(1);
  };

  const resetFilters = () => {
    setKeyword('');
    setLocation('');
    setWorkType('');
    setLevel('');
    setJobs([]);
    setTotal(null);
    setSearched(false);
    setError('');
    setPage(1);
  };

  const totalPages = total ? Math.ceil(total / RESULTS_PER_PAGE) : 0;

  return (
    <>
      <SEO
        title="Vagas de Emprego no Brasil | Maextria"
        description="Pesquise vagas de emprego no Brasil em tecnologia, dados, automação e muito mais. Resultados atualizados em tempo real."
        url="https://www.maextria.com.br/vagas"
        image="https://www.maextria.com.br/maextria-logo.png"
        keywords={[
          'vagas emprego brasil',
          'vagas tecnologia',
          'vagas dados',
          'vagas inteligencia artificial',
          'vagas automacao',
          'empregos brasil',
        ]}
      />

      {/* Hero */}
      <section className="hero-gradient text-white">
        <div className="hero-grid">
          <div className="max-w-6xl mx-auto px-[clamp(24px,5vw,72px)] py-[clamp(56px,10vh,120px)]">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">Carreira MAEXTRIA</p>
                <h1 className="headline-font text-4xl md:text-5xl">
                  Vagas de emprego atualizadas no Brasil
                </h1>
                <p className="text-base md:text-lg text-white/80 max-w-xl">
                  Busque oportunidades em tempo real — tecnologia, dados, automação, indústria e muito mais.
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-white/75">
                  {['Tecnologia', 'Dados', 'Automação', 'IA', 'Produto', 'Indústria'].map((tag) => (
                    <span key={tag} className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hero-frame rounded-[32px] p-6">
                <picture>
                  <source srcSet="/hero-01.avif" type="image/avif" />
                  <source srcSet="/hero-01.webp" type="image/webp" />
                  <img
                    src="/hero-01.png"
                    alt="Profissionais em tecnologia"
                    loading="lazy"
                    decoding="async"
                    width={1280}
                    height={800}
                    className="w-full rounded-[24px]"
                  />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulário de busca */}
      <section className="py-[clamp(48px,8vh,120px)]">
        <div className="max-w-6xl mx-auto px-[clamp(24px,5vw,72px)]">
          <div className="card p-6 md:p-10 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold">
                  <span>Cargo ou palavra-chave</span>
                  <input
                    type="text"
                    className="input-field"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Ex: Engenheiro de Dados, Analista, Python"
                  />
                </label>

                <label className="space-y-2 text-sm font-semibold">
                  <span>Localização</span>
                  <input
                    type="text"
                    className="input-field"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: São Paulo, Remoto, Brasil"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold">
                  <span>Tipo de trabalho</span>
                  <select className="input-field" value={workType} onChange={(e) => setWorkType(e.target.value)}>
                    <option value="">Todos</option>
                    {workTypeOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-semibold">
                  <span>Nível</span>
                  <select className="input-field" value={level} onChange={(e) => setLevel(e.target.value)}>
                    <option value="">Todos</option>
                    {levelOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="submit" className="btn-accent flex items-center gap-2" disabled={loading}>
                  <FaSearch />
                  {loading ? 'Buscando...' : 'Buscar vagas'}
                </button>
                <button type="button" className="btn-outline" onClick={resetFilters}>
                  Limpar filtros
                </button>
              </div>
            </form>
          </div>

          {/* Resultados */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-10 flex flex-col items-center gap-4 text-[hsl(var(--muted-foreground))]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
              <p className="text-sm">Buscando vagas no Brasil...</p>
            </div>
          )}

          {!loading && searched && (
            <>
              <div className="mt-8 mb-4 flex items-center justify-between">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {total !== null && (
                    <>
                      <span className="font-semibold text-[hsl(var(--foreground))]">
                        {total.toLocaleString('pt-BR')}
                      </span>{' '}
                      vagas encontradas
                    </>
                  )}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Página {page} de {totalPages}
                </p>
              </div>

              {jobs.length === 0 ? (
                <div className="card p-10 text-center text-[hsl(var(--muted-foreground))]">
                  Nenhuma vaga encontrada para essa busca. Tente outros termos.
                </div>
              ) : (
                <div className="grid gap-4">
                  {jobs.map((job) => {
                    const salary = formatSalary(job.salary_min, job.salary_max);
                    const desc = stripHtml(job.description).slice(0, 160);
                    return (
                      <div
                        key={job.id}
                        className="card p-5 md:p-6 flex flex-col gap-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h2 className="font-semibold text-base md:text-lg leading-snug">
                              {job.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                              <span className="flex items-center gap-1">
                                <FaBuilding className="text-xs" />
                                {job.company.display_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <FaMapMarkerAlt className="text-xs" />
                                {job.location.display_name}
                              </span>
                              {job.contract_type && (
                                <span className="flex items-center gap-1">
                                  <FaBriefcase className="text-xs" />
                                  {job.contract_type}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                            {salary && (
                              <span className="text-sm font-semibold text-[hsl(var(--primary))]">
                                {salary}
                              </span>
                            )}
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              {formatDate(job.created)}
                            </span>
                          </div>
                        </div>

                        {desc && (
                          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                            {desc}…
                          </p>
                        )}

                        <a
                          href={job.redirect_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-accent self-start flex items-center gap-2 text-sm"
                        >
                          Ver vaga completa
                          <FaExternalLinkAlt className="text-xs" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <button
                    className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
                    onClick={() => fetchJobs(page - 1)}
                    disabled={page <= 1 || loading}
                  >
                    ← Anterior
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                    const p = start + i;
                    return (
                      <button
                        key={p}
                        className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                          p === page
                            ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
                            : 'btn-outline'
                        }`}
                        onClick={() => fetchJobs(p)}
                        disabled={loading}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
                    onClick={() => fetchJobs(page + 1)}
                    disabled={page >= totalPages || loading}
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Especialização */}
      <section className="pb-[clamp(48px,8vh,120px)]">
        <div className="max-w-6xl mx-auto px-[clamp(24px,5vw,72px)]">
          <div className="card border border-[hsl(var(--border))] p-6 md:p-10 grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Especialização</p>
              <h2 className="headline-font text-2xl md:text-3xl">
                Encontrou alguma vaga e não tem especialização para ela?
              </h2>
              <p className="text-[hsl(var(--muted-foreground))]">
                Clique em se especializar agora e escolha o curso ideal para acelerar sua contratação.
              </p>
            </div>
            <Link to="/courses" className="btn-accent flex items-center gap-2 justify-center w-full md:w-auto">
              Se especializar agora
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
