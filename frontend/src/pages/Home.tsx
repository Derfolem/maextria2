import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCompass, FaLayerGroup, FaShieldAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Course } from '../types';
import { normalizeCourse } from '../lib/normalizeCourse';
import { SEO, createOrganizationSchema, createWebSiteSchema } from '../components/SEO';
import { createFAQSchema, createHowToSchema } from '../components/AdvancedSchemas';

const HomeBelowFold = lazy(() => import('./home/HomeBelowFold'));

export default function Home() {
  const [topCourses, setTopCourses] = useState<Course[]>([]);
  const [loadingTopCourses, setLoadingTopCourses] = useState(true);

  useEffect(() => {
    const loadTopCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('cursos')
          .select('*')
          .eq('ativo', true);
        if (error) {
          throw error;
        }
        const courses: Course[] = (data || []).map(normalizeCourse);
        const maxEnrollments = Math.max(...courses.map((course) => course.enrollment_count ?? 0), 0);

        if (maxEnrollments > 0) {
          const sorted = [...courses].sort((a, b) => {
            const diff = (b.enrollment_count ?? 0) - (a.enrollment_count ?? 0);
            if (diff !== 0) {
              return diff;
            }
            return Number(b.created_at ?? 0) - Number(a.created_at ?? 0);
          });
          setTopCourses(sorted.slice(0, 6));
        } else {
          const shuffled = [...courses].sort(() => Math.random() - 0.5);
          setTopCourses(shuffled.slice(0, 6));
        }
      } catch (error) {
        console.error('Error loading top courses:', error);
      } finally {
        setLoadingTopCourses(false);
      }
    };

    loadTopCourses();
  }, []);

  const fallbackImages = ['/hero-01.png', '/hero-02.png', '/hero-03.png', '/hero-04.png'];

  // Schema.org para SEO - Múltiplos schemas para rich snippets
  const organizationSchema = createOrganizationSchema();
  const websiteSchema = createWebSiteSchema();
  const faqSchema = createFAQSchema();
  const howToSchema = createHowToSchema();

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [organizationSchema, websiteSchema, faqSchema, howToSchema],
  };

  return (
    <>
      <SEO
        title="MAEXTRIA - Plataforma de Cursos Online | Aprenda com Certificado Reconhecido"
        description="Aprenda com os melhores cursos online do Brasil. Certificados reconhecidos, conteúdo atualizado, suporte com IA e acesso vitalício. Comece grátis hoje!"
        url="https://www.maextria.com.br/"
        image="https://www.maextria.com.br/maextria-logo.png"
        schema={schema}
        keywords={[
          'cursos online',
          'educação a distância',
          'certificados reconhecidos',
          'plataforma de ensino',
          'cursos de tecnologia',
          'programação',
          'inteligência artificial',
          'desenvolvimento pessoal',
          'cursos profissionalizantes'
        ]}
      />
      <div>
      <section className="hero-gradient text-white">
        <div className="hero-grid min-h-[100svh]">
          <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(80px,10vh,160px)] lg:py-[clamp(120px,14vh,200px)]">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="space-y-8"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/80">
                  Aprender. Aplicar. Expandir
                </span>
                <div className="space-y-6">
                  <h1 className="headline-font text-5xl md:text-6xl leading-tight">
                    Mentes Audazes Exponencializam
                  </h1>
                  <p className="text-lg md:text-xl text-white/80 max-w-xl">
                    Curadoria intelectual, método e aplicação pratica para quem busca crescimento
                    com criterio e consistencia.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Link to="/courses" className="btn-accent text-base md:text-lg flex items-center gap-2 w-full sm:w-auto justify-center">
                    Explorar Cursos
                    <FaArrowRight />
                  </Link>
                </div>
                <div className="grid gap-3 text-sm text-white/85 max-w-xl">
                  {[
                    'Cursos gratuitos, curadoria de alto nível e acesso 100% online.',
                    'Aprenda de onde estiver, com conteúdo que fortalece seu currículo.',
                    'Sem mensalidade. Você investe no que importa: evolução real.',
                  ].map((text) => (
                    <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent))]" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-6 text-sm text-white/70">
                  <div>
                    <p className="text-2xl font-semibold text-white">+240</p>
                    <p>Horas de conteúdo curado</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">4.9/5</p>
                    <p>Experiência dos alunos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">24/7</p>
                    <p>Suporte inteligente</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="relative"
              >
                <div className="absolute -top-12 -left-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="hero-frame rounded-[32px] p-6">
                    <div className="grid gap-6">
                      <picture>
                        <source srcSet="/hero-01.avif" type="image/avif" />
                        <source srcSet="/hero-01.webp" type="image/webp" />
                        <img
                          src="/hero-01.png"
                          alt="Imagem editorial MAEXTRIA"
                          fetchPriority="high"
                          decoding="async"
                          width={1280}
                          height={800}
                          className="w-full rounded-[24px]"
                        />
                      </picture>
                      <div className="grid grid-cols-2 gap-4" aria-hidden="true">
                        <picture>
                          <source srcSet="/hero-02.avif" type="image/avif" />
                          <source srcSet="/hero-02.webp" type="image/webp" />
                          <img
                            src="/hero-02.png"
                            alt="Detalhe editorial 1"
                            loading="lazy"
                            decoding="async"
                            width={640}
                            height={400}
                            className="w-full rounded-[20px]"
                          />
                        </picture>
                        <picture>
                          <source srcSet="/hero-03.avif" type="image/avif" />
                          <source srcSet="/hero-03.webp" type="image/webp" />
                          <img
                            src="/hero-03.png"
                            alt="Detalhe editorial 2"
                            loading="lazy"
                            decoding="async"
                            width={640}
                            height={400}
                            className="w-full rounded-[20px]"
                          />
                        </picture>
                      </div>
                    </div>
                  </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-[clamp(60px,8vh,100px)] bg-[hsl(var(--background))]">
        <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="headline-font text-3xl md:text-4xl">Vamos começar?</h2>
          </motion.div>

          {loadingTopCourses ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-shrink-0 w-[180px] md:w-[220px]">
                  <div className="aspect-[2/3] rounded-xl bg-[hsl(var(--muted))] shimmer" />
                </div>
              ))}
            </div>
          ) : topCourses.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {topCourses.map((course, index) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="flex-shrink-0 w-[180px] md:w-[220px] group snap-start"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[hsl(var(--foreground))] shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--foreground))] to-[hsl(var(--accent))]">
                        <span className="text-4xl font-bold text-white">{course.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <p className="text-white text-sm font-semibold line-clamp-2">{course.title}</p>
                      <p className="text-white/70 text-xs mt-1">{course.teacher_name || 'MAEXTRIA'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-[clamp(80px,10vh,160px)]">
        <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center gap-6 mb-12"
          >
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Proposta de valor</p>
              <h2 className="headline-font text-4xl md:text-5xl section-title">
                O que e a MAEXTRIA
                <span className="block gradient-text"> e por que importa</span>
              </h2>
            </div>
            <p className="max-w-xl text-base text-[hsl(var(--muted-foreground))]">
              Uma plataforma educacional premium, feita para profissionais que valorizam
              curadoria, profundidade e aplicação pratica. Sem ruido. Sem promessas vazias.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <FaCompass />,
                title: 'Para quem e',
                description: 'Profissionais em transicao, lideres e especialistas em busca de crescimento real.',
              },
              {
                icon: <FaLayerGroup />,
                title: 'O que entrega',
                description: 'Conteúdos aplicaveis, acompanhamento e certificação com credibilidade.',
              },
              {
                icon: <FaShieldAlt />,
                title: 'Por que e diferente',
                description: 'Curadoria rigorosa, experiência fluida e foco em resultados mensuraveis.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="card space-y-4"
              >
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white gradient-bg">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-[hsl(var(--muted-foreground))]">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <Suspense fallback={null}>
        <HomeBelowFold
          loadingTopCourses={loadingTopCourses}
          topCourses={topCourses}
          fallbackImages={fallbackImages}
        />
      </Suspense>
    </div>
    </>
  );
}
