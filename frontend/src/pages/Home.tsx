import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCompass, FaLayerGroup, FaShieldAlt, FaChevronLeft, FaChevronRight, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Course } from '../types';
import { normalizeCourse } from '../lib/normalizeCourse';
import { SEO, createOrganizationSchema, createWebSiteSchema } from '../components/SEO';
import { createFAQSchema, createHowToSchema } from '../components/AdvancedSchemas';
import StarRating from '../components/StarRating';

const HomeBelowFold = lazy(() => import('./home/HomeBelowFold'));

export default function Home() {
  const [topCourses, setTopCourses] = useState<Course[]>([]);
  const [loadingTopCourses, setLoadingTopCourses] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(0);

  const nextSlide = () => {
    setSlideDirection(1);
    setCarouselIndex((prev) => (prev === topCourses.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setSlideDirection(-1);
    setCarouselIndex((prev) => (prev === 0 ? topCourses.length - 1 : prev - 1));
  };

  
  // JSON-LD para SEO
  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "MAEXTRIA",
      "url": "https://www.maextria.com.br",
      "logo": "https://www.maextria.com.br/maextria-logo.png",
      "description": "Plataforma de cursos online com certificados reconhecidos. Aprenda tecnologia, negocios e desenvolvimento pessoal.",
      "sameAs": [
        "https://www.instagram.com/maextria",
        "https://www.facebook.com/maextria"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": "Portuguese"
      },
      "offers": {
        "@type": "Offer",
        "category": "Cursos Online",
        "priceCurrency": "BRL"
      }
    };
    
    let script = document.getElementById('jsonld-org');
    if (!script) {
      script = document.createElement('script');
      script.id = 'jsonld-org';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
    
    return () => {
      const el = document.getElementById('jsonld-org');
      if (el) el.remove();
    };
  }, []);



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
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-white/80 max-[400px]:tracking-[0.22em] sm:text-xs sm:tracking-[0.35em]">
                  Aprender. Aplicar. Expandir
                </span>
                <div className="space-y-6">
                  <h1 className="headline-font text-[clamp(2.4rem,7vw,3.75rem)] leading-[1.05]">
                    Mentes Audazes Exponencializam
                  </h1>
                  <p className="text-[clamp(1rem,3.8vw,1.25rem)] text-white/80 max-w-xl">
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
                    <p className="text-[clamp(1.25rem,5.5vw,1.5rem)] font-semibold text-white">+240</p>
                    <p>Horas de conteúdo curado</p>
                  </div>
                  <div>
                    <p className="text-[clamp(1.25rem,5.5vw,1.5rem)] font-semibold text-white">4.9/5</p>
                    <p>Experiência dos alunos</p>
                  </div>
                  <div>
                    <p className="text-[clamp(1.25rem,5.5vw,1.5rem)] font-semibold text-white">24/7</p>
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

      <section className="relative py-[clamp(80px,10vh,120px)] overflow-hidden">
        {/* Fundo dinâmico com imagem do curso */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            {topCourses.length > 0 && topCourses[carouselIndex]?.thumbnail && (
              <motion.div
                key={carouselIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0"
              >
                <img
                  src={topCourses[carouselIndex].thumbnail}
                  alt=""
                  className="w-full h-full object-cover scale-110"
                />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-[hsl(var(--background))]/85" />
          {/* Gradientes decorativos */}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-[hsl(var(--background))]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--background))_70%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-[clamp(24px,5vw,80px)]">
          {/* Título estilizado */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.5em' }}
              whileInView={{ opacity: 1, letterSpacing: '0.35em' }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))] mb-4"
            >
              Sua jornada começa aqui
            </motion.p>
            <h2 className="headline-font text-4xl md:text-6xl lg:text-7xl">
              <span className="block text-white/90">Vamos</span>
              <span className="relative inline-block">
                <span className="relative z-10 gradient-text">começar</span>
                <motion.span
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-full"
                />
              </span>
              <span className="text-white/90">?</span>
            </h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-4 text-[hsl(var(--muted-foreground))] text-lg max-w-md mx-auto"
            >
              Os cursos mais procurados para impulsionar sua carreira
            </motion.p>
          </motion.div>

          {loadingTopCourses ? (
            <div className="flex justify-center gap-4 md:gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex-shrink-0 ${i === 2 ? 'w-[200px] md:w-[280px]' : 'w-[140px] md:w-[200px]'}`}>
                  <div className="aspect-[2/3] rounded-xl bg-[hsl(var(--muted))] shimmer" />
                </div>
              ))}
            </div>
          ) : topCourses.length > 0 ? (
            <div className="relative group/carousel">
              {/* Seta esquerda */}
              <button
                onClick={prevSlide}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-14 h-14 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white/50 opacity-0 group-hover/carousel:opacity-100 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300 -translate-x-4 group-hover/carousel:translate-x-0"
                aria-label="Anterior"
              >
                <FaChevronLeft className="text-lg" />
              </button>

              {/* Carrossel */}
              <div
                className="flex justify-center items-center gap-4 md:gap-8 touch-pan-x overflow-hidden py-8"
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  (e.currentTarget as HTMLElement).dataset.touchStartX = String(touch.clientX);
                }}
                onTouchEnd={(e) => {
                  const startX = Number((e.currentTarget as HTMLElement).dataset.touchStartX || 0);
                  const endX = e.changedTouches[0].clientX;
                  const diff = startX - endX;
                  if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                      nextSlide();
                    } else {
                      prevSlide();
                    }
                  }
                }}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  {[-1, 0, 1].map((offset) => {
                    const index = (carouselIndex + offset + topCourses.length) % topCourses.length;
                    const course = topCourses[index];
                    const isCenter = offset === 0;

                    return (
                      <motion.div
                        key={`${carouselIndex}-${offset}`}
                        initial={{
                          x: slideDirection * 120,
                          opacity: 0,
                          scale: 0.7,
                          rotateY: slideDirection * 15
                        }}
                        animate={{
                          x: 0,
                          opacity: isCenter ? 1 : 0.5,
                          scale: isCenter ? 1 : 0.85,
                          rotateY: 0
                        }}
                        exit={{
                          x: slideDirection * -120,
                          opacity: 0,
                          scale: 0.7,
                          rotateY: slideDirection * -15
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 25
                        }}
                        className={`flex-shrink-0 ${
                          isCenter
                            ? 'w-[220px] md:w-[300px] z-10'
                            : 'w-[140px] md:w-[200px]'
                        }`}
                        style={{ perspective: 1000 }}
                      >
                        <Link to={`/courses/${course.id}`}>
                          <div
                            className={`relative aspect-[2/3] rounded-2xl overflow-hidden transition-all duration-500 ${
                              isCenter
                                ? 'shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(40,210,255,0.15)] ring-2 ring-white/20'
                                : 'grayscale brightness-50'
                            }`}
                          >
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
                                <span className="text-5xl font-bold text-white">{course.title.charAt(0)}</span>
                              </div>
                            )}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300 ${isCenter ? 'opacity-100' : 'opacity-0'}`} />
                            <div className={`absolute bottom-0 left-0 right-0 p-5 transition-all duration-500 ${isCenter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                              <p className="text-white font-bold text-base md:text-lg line-clamp-2 mb-1">{course.title}</p>
                              <div className="flex items-center gap-2 mb-1">
                                <StarRating value={course.rating || 4.3} readonly size="sm" />
                                <span className="text-white/60 text-xs">{(course.rating || 4.3).toFixed(1)}</span>
                              </div>
                              <p className="text-white/60 text-sm">{course.teacher_name || 'MAEXTRIA'}</p>
                              {course.duration_hours && (
                                <p className="text-white/60 text-xs flex items-center gap-1 mt-1">
                                  <FaClock className="text-xs" />
                                  {course.duration_hours}h
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Seta direita */}
              <button
                onClick={nextSlide}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-14 h-14 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white/50 opacity-0 group-hover/carousel:opacity-100 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300 translate-x-4 group-hover/carousel:translate-x-0"
                aria-label="Próximo"
              >
                <FaChevronRight className="text-lg" />
              </button>

              {/* Indicadores */}
              <div className="flex justify-center gap-2 mt-6">
                {topCourses.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === carouselIndex
                        ? 'bg-[hsl(var(--primary))] w-6'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Ir para curso ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Ver todos */}
          {!loadingTopCourses && topCourses.length > 0 && (
            <div className="flex justify-center mt-8">
              <Link
                to="/courses"
                className="text-[hsl(var(--primary))] font-semibold flex items-center gap-2 hover:gap-3 transition-all"
              >
                Ver todos os cursos
                <FaArrowRight />
              </Link>
            </div>
          )}
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
