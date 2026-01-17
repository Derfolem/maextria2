import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaChartLine, FaHandshake, FaShieldAlt, FaStar } from 'react-icons/fa';
import { supabase } from '../lib/supabase';

export default function TeacherLanding() {
  const [teacherBanner, setTeacherBanner] = useState({
    enabled: false,
    imageUrl: '',
    linkUrl: '',
    alt: 'Banner para professores',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    area: '',
    background: '',
    intent: '',
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const subject = 'Aplicação Professor MAEXTRIA';
    const body = [
      `Nome: ${formData.name}`,
      `Email: ${formData.email}`,
      `Area de atuacao: ${formData.area}`,
      `Formacao/experiência: ${formData.background}`,
      `Intencao na MAEXTRIA: ${formData.intent}`,
    ].join('\n');

    const mailto = `mailto:melfredfred25@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  useEffect(() => {
    const loadTeacherBanner = async () => {
      const { data } = await supabase
        .from('configuracoes_site')
        .select('chave, valor')
        .in('chave', [
          'teacher_banner_enabled',
          'teacher_banner_image_url',
          'teacher_banner_link_url',
          'teacher_banner_alt',
        ]);
      const resolve = (key: string) => data?.find((item: any) => item.chave === key)?.valor ?? '';
      const enabled = resolve('teacher_banner_enabled') === '1';
      setTeacherBanner({
        enabled,
        imageUrl: resolve('teacher_banner_image_url'),
        linkUrl: resolve('teacher_banner_link_url'),
        alt: resolve('teacher_banner_alt') || 'Banner para professores',
      });
    };

    loadTeacherBanner();
  }, []);

  return (
    <div>
      {teacherBanner.enabled && teacherBanner.imageUrl && (
        <section className="w-full py-6">
          {teacherBanner.linkUrl ? (
            <a href={teacherBanner.linkUrl} target="_blank" rel="noreferrer" className="block">
              <div className="mx-auto h-[279px] w-[2394px] max-w-full">
                <img
                  src={teacherBanner.imageUrl}
                  alt={teacherBanner.alt}
                  className="h-full w-full object-contain"
                />
              </div>
            </a>
          ) : (
            <div className="mx-auto h-[279px] w-[2394px] max-w-full">
              <img
                src={teacherBanner.imageUrl}
                alt={teacherBanner.alt}
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </section>
      )}

      <section className="hero-gradient text-white">
        <div className="hero-grid">
          <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(80px,10vh,160px)] lg:py-[clamp(120px,14vh,200px)]">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">Sou professor</p>
                <h1 className="headline-font text-5xl md:text-6xl leading-tight">
                  Transforme conhecimento em legado
                </h1>
                <p className="text-lg text-white/80 max-w-xl">
                  A MAEXTRIA conecta especialistas a alunos comprometidos. Curadoria, suporte e
                  reputacao para você ensinar com autoridade e receber pelo impacto que gera.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="#formulario" className="btn-accent flex items-center gap-2">
                    Quero me candidatar
                    <FaArrowRight />
                  </a>
                  <Link to="/" className="btn-outline text-white border-white/60 hover:border-white">
                    Conhecer a MAEXTRIA
                  </Link>
                </div>
                <div className="flex flex-wrap gap-6 text-sm text-white/70">
                  <div>
                    <p className="text-2xl font-semibold text-white">Curadoria</p>
                    <p>Equipe MAEXTRIA avalia cada curso</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">Receita</p>
                    <p>Participacao em certificados vendidos</p>
                  </div>
                </div>
              </div>

              <div className="hero-frame rounded-[32px] p-6">
                <img src="/hero-06.png" alt="Professor MAEXTRIA" className="rounded-[24px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-[clamp(80px,10vh,160px)]">
        <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)]">
          <div className="flex flex-col items-center text-center gap-6 mb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Por que ensinar aqui</p>
            <h2 className="headline-font text-4xl md:text-5xl section-title">
              A MAEXTRIA valoriza especialistas
            </h2>
            <p className="text-base text-[hsl(var(--muted-foreground))] max-w-2xl">
              Curadoria editorial, infraestrutura completa e posicao premium. Você entra para uma
              rede que prioriza profundidade e credibilidade, sem marketing vazio.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <FaShieldAlt />,
                title: 'Publicacao com criterio',
                description: 'Seus cursos passam por avaliacao tecnica antes de ir ao ar.',
              },
              {
                icon: <FaHandshake />,
                title: 'Relacao justa',
                description: 'Transparencia na divisao de receitas e acompanhamento dedicado.',
              },
              {
                icon: <FaChartLine />,
                title: 'Crescimento real',
                description: 'Performance acompanhada para escalar reputacao e ganhos.',
              },
            ].map((item) => (
              <div key={item.title} className="card space-y-4">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white gradient-bg">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-[hsl(var(--muted-foreground))]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[clamp(80px,10vh,160px)] bg-[hsl(var(--graphite))]">
        <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--accent))]">Processo</p>
              <h2 className="headline-font text-4xl md:text-5xl">
                Selecao com foco em qualidade
              </h2>
              <p className="text-base text-[hsl(var(--muted-foreground))]">
                Avaliamos formacao, experiência e alinhamento ao posicionamento MAEXTRIA. A
                prioridade e garantir excelencia para alunos e instrutores.
              </p>
              <div className="space-y-4 text-sm text-[hsl(var(--muted-foreground))]">
                <p>1. Cadastro do interesse com detalhes do seu conhecimento.</p>
                <p>2. Curadoria entra em contato para alinhamento editorial.</p>
                <p>3. Aprovacao e suporte para estruturar o curso.</p>
                <p>4. Publicacao com acompanhamento profissional.</p>
              </div>
            </div>
            <div className="hero-frame rounded-[32px] p-6">
              <img src="/hero-10.png" alt="Processo de avaliacao" className="rounded-[24px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-[clamp(80px,10vh,160px)]">
        <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)]">
          <div className="flex flex-col items-center text-center gap-6 mb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Prova social</p>
            <h2 className="headline-font text-4xl md:text-5xl section-title">
              Especialistas satisfeitos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Camila F.',
                role: 'Liderança e gestao',
                quote: 'A curadoria da MAEXTRIA elevou minha reputacao e organizou minha oferta.',
              },
              {
                name: 'Ricardo S.',
                role: 'Produto digital',
                quote: 'Recebi acompanhamento real e hoje ensino para alunos que valorizam profundidade.',
              },
              {
                name: 'Marina T.',
                role: 'Dados aplicados',
                quote: 'A plataforma entrega estrutura e transparencia para quem leva ensino a serio.',
              },
            ].map((item) => (
              <div key={item.name} className="card space-y-4">
                <div className="flex items-center gap-2 text-[hsl(var(--secondary))]">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
                <p className="text-[hsl(var(--muted-foreground))]">“{item.quote}”</p>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="formulario" className="py-[clamp(80px,10vh,160px)] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="max-w-5xl mx-auto px-[clamp(24px,5vw,80px)]">
          <div className="flex flex-col items-center text-center gap-6 mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Formulario</p>
            <h2 className="headline-font text-4xl md:text-5xl">
              Conte-nos sobre seu conhecimento
            </h2>
            <p className="text-white/70 max-w-2xl">
              Descreva sua area de atuacao e objetivos. Nossa equipe entra em contato para orientar
              os proximos passos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome completo"
                className="input-field"
                required
              />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email de contato"
                className="input-field"
                required
              />
            </div>
            <input
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="Area de conhecimento"
              className="input-field"
              required
            />
            <textarea
              name="background"
              value={formData.background}
              onChange={handleChange}
              placeholder="Formacao, experiência ou resultados relevantes"
              className="input-field min-h-[120px]"
              required
            />
            <textarea
              name="intent"
              value={formData.intent}
              onChange={handleChange}
              placeholder="O que você quer construir com a MAEXTRIA"
              className="input-field min-h-[120px]"
              required
            />
            <button type="submit" className="btn-accent">
              Enviar candidatura
            </button>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Ao enviar, você aceita que a equipe MAEXTRIA entre em contato para avaliacao.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
