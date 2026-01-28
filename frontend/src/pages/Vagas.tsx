import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { SEO } from '../components/SEO';

const areaOptions = [
  'Inteligência Artificial',
  'Ciência de Dados',
  'Automação Industrial',
  'Engenharia',
  'Tecnologia da Informação',
  'Produto & Inovação',
];

const workTypeOptions = [
  { label: 'Remoto', value: '2' },
  { label: 'Presencial', value: '1' },
  { label: 'Híbrido', value: '3' },
];

const levelOptions = ['Estágio', 'Júnior', 'Pleno', 'Sênior'];

export default function Vagas() {
  const [keyword, setKeyword] = useState('');
  const [area, setArea] = useState('');
  const [workType, setWorkType] = useState('');
  const [level, setLevel] = useState('');
  const [location, setLocation] = useState('Brasil');

  const keywordsPreview = useMemo(() => {
    return [keyword, area, level].filter(Boolean).join(' ').trim();
  }, [keyword, area, level]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const keywords = keywordsPreview || 'Tecnologia';
    params.set('keywords', keywords);
    params.set('location', location.trim() || 'Brasil');
    if (workType) {
      params.set('f_WT', workType);
    }
    const url = `https://www.linkedin.com/jobs/search/?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <SEO
        title="Vagas em Tecnologia, Dados e IA | Maextria"
        description="Pesquise vagas em tecnologia, dados, automação e IA. Use os filtros e acesse oportunidades atualizadas diretamente no LinkedIn Jobs."
        url="https://www.maextria.com.br/vagas"
        image="https://www.maextria.com.br/maextria-logo.png"
        keywords={[
          'vagas tecnologia',
          'vagas dados',
          'vagas inteligencia artificial',
          'vagas automacao',
          'carreira em tecnologia',
          'linkedin jobs',
        ]}
      />

      <section className="hero-gradient text-white">
        <div className="hero-grid">
          <div className="max-w-6xl mx-auto px-[clamp(24px,5vw,72px)] py-[clamp(56px,10vh,120px)]">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">Carreira MAEXTRIA</p>
                <h1 className="headline-font text-4xl md:text-5xl">
                  Pesquise vagas em tecnologia, dados e IA
                </h1>
                <p className="text-base md:text-lg text-white/80 max-w-xl">
                  Use os filtros abaixo para encontrar oportunidades atualizadas diretamente no LinkedIn
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-white/75">
                  {['Tecnologia', 'Dados', 'Automação', 'IA', 'Produto'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/15 bg-white/10 px-4 py-2"
                    >
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
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Ex: Engenheiro de Dados, IA, Automação"
                  />
                </label>

                <label className="space-y-2 text-sm font-semibold">
                  <span>Área de atuação</span>
                  <select
                    className="input-field"
                    value={area}
                    onChange={(event) => setArea(event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {areaOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm font-semibold">
                  <span>Tipo de trabalho</span>
                  <select
                    className="input-field"
                    value={workType}
                    onChange={(event) => setWorkType(event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {workTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-semibold">
                  <span>Nível</span>
                  <select
                    className="input-field"
                    value={level}
                    onChange={(event) => setLevel(event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {levelOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-semibold">
                  <span>Localização</span>
                  <input
                    type="text"
                    className="input-field"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-4">
                <button type="submit" className="btn-accent text-center">
                  Buscar vagas no LinkedIn
                </button>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  A Maextria não hospeda nem publica vagas. Todas as oportunidades são exibidas diretamente no LinkedIn, garantindo informações atualizadas e confiáveis.
                </p>
                {keywordsPreview && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Pesquisa preparada: <span className="font-semibold text-[hsl(var(--foreground))]">{keywordsPreview}</span>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

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
