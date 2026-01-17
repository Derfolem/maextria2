import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBolt, FaCompass, FaLayerGroup, FaShieldAlt, FaBalanceScale, FaBookmark, FaPlayCircle, FaChalkboardTeacher } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Course } from '../types';
import { normalizeCourse } from '../lib/normalizeCourse';

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

  return (
    <div className="overflow-x-hidden">
      <section className="hero-gradient text-white">
        <div className="hero-grid">
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
                  <Link to="/courses" className="btn-accent text-base md:text-lg flex items-center gap-2">
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
                    <img src="/hero-01.png" alt="Imagem editorial MAEXTRIA" className="w-full rounded-[24px]" />
                    <div className="grid grid-cols-2 gap-4">
                      <img src="/hero-02.png" alt="Processo de aprendizagem" className="rounded-[20px]" />
                      <img src="/hero-03.png" alt="Certificação premium" className="rounded-[20px]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
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

      <section className="py-[clamp(80px,10vh,160px)] bg-[hsl(var(--graphite))]">
        <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)]">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 items-center">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Universitarios</p>
              <h2 className="headline-font text-4xl md:text-5xl">
                Horas complementares com criterio
              </h2>
              <p className="text-base text-[hsl(var(--muted-foreground))]">
                Alunos de faculdade podem utilizar os cursos MAEXTRIA como horas complementares.
                A curadoria garante relevancia academica e aplicação pratica.
              </p>
              <div className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
                <p>Receba certificados validos e organizados para apresentar a sua instituicao.</p>
                <p>Indique temas que você precisa e ajude a criar novas jornadas.</p>
              </div>
              <Link to="/register" className="btn-accent inline-flex items-center gap-2">
                Iniciar
                <FaArrowRight />
              </Link>
            </div>
            <div className="hero-frame rounded-[32px] p-6">
              <img src="/hero-09.png" alt="Horas complementares" className="rounded-[24px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-[clamp(80px,10vh,160px)] bg-[hsl(var(--graphite))]">
        <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)]">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--accent))]">Métodologia</p>
              <h2 className="headline-font text-4xl md:text-5xl">
                Aprender, Aplicar,
                <span className="block text-[hsl(var(--primary))]"> Expandir</span>
              </h2>
              <p className="text-base text-[hsl(var(--muted-foreground))]">
                A métodologia MAEXTRIA organiza o conteúdo para gerar clareza,
                acao e evolucao continua. Cada curso entrega avancos observaveis.
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: <FaBookmark />,
                    title: 'Aprender com profundidade',
                    text: 'Conteúdo denso e organizado para construir base solida.',
                  },
                  {
                    icon: <FaPlayCircle />,
                    title: 'Aplicar com método',
                    text: 'Exercicios, estudos de caso e desafios reais.',
                  },
                  {
                    icon: <FaArrowRight />,
                    title: 'Expandir com estratégia',
                    text: 'Planos de acao para carreira, negocio e posicionamento.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-white gradient-bg">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="hero-frame rounded-[36px] p-6">
                <img src="/hero-11.png" alt="Métodologia MAEXTRIA" className="rounded-[28px]" />
              </div>
              <div className="absolute -bottom-10 -left-8 hidden md:block">
                <img src="/hero-02.png" alt="Detalhe editorial" className="w-48 rounded-[22px] shadow-xl" />
              </div>
            </motion.div>
          </div>
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
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Beneficios</p>
              <h2 className="headline-font text-4xl md:text-5xl section-title">
                Transformacoes praticas
                <span className="block gradient-text"> no dia a dia</span>
              </h2>
            </div>
            <p className="max-w-xl text-base text-[hsl(var(--muted-foreground))]">
              Cada trilha entrega clareza, repertorio e ferramentas para você
              gerar impacto mensuravel em sua carreira.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <FaBalanceScale />,
                title: 'Decisoes mais estrategicas',
                description: 'Modelos mentais aplicaveis a projetos e negócios.',
              },
              {
                icon: <FaBolt />,
                title: 'Habilidades valiosas',
                description: 'Dominio de temas atuais com profundidade real.',
              },
              {
                icon: <FaBolt />,
                title: 'Ritmo e foco',
                description: 'Rotina de estudos clara, sem excesso de conteúdo.',
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

      <section className="py-[clamp(80px,10vh,160px)] bg-[hsl(var(--graphite))]">
        <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)]">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Autoridade</p>
              <h2 className="headline-font text-4xl md:text-5xl">
                Curadoria que eleva
                <span className="block text-[hsl(var(--accent))]"> seu posicionamento</span>
              </h2>
              <p className="text-base text-[hsl(var(--muted-foreground))]">
                A MAEXTRIA nasce com uma visao editorial: menos cursos, mais impacto.
                Selecionamos especialistas, formatos e conteúdos com foco em aplicação.
              </p>
              <div className="space-y-4">
                {[
                  'Instrutores selecionados por experiência real de mercado.',
                  'Material complementar com frameworks e templates.',
                  'Certificados com autenticidade verificavel.',
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))]" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hero-frame rounded-[36px] p-6"
            >
              <img src="/hero-04.png" alt="Curadoria MAEXTRIA" className="rounded-[28px]" />
            </motion.div>
          </div>
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
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--accent))]">Mais procurados</p>
              <h2 className="headline-font text-4xl md:text-5xl section-title">
                As 6 jornadas mais
                <span className="block gradient-text"> buscadas na MAEXTRIA</span>
              </h2>
            </div>
          </motion.div>

          {loadingTopCourses ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="card p-6">
                  <div className="w-full aspect-[16/10] rounded-[18px] mb-6 bg-white/10 shimmer" />
                  <div className="h-4 w-1/2 bg-white/10 rounded mb-3 shimmer" />
                  <div className="h-6 w-3/4 bg-white/10 rounded mb-4 shimmer" />
                  <div className="h-4 w-full bg-white/10 rounded shimmer" />
                </div>
              ))}
            </div>
          ) : topCourses.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-[hsl(var(--muted-foreground))]">
                Em breve, as jornadas mais buscadas da MAEXTRIA aparecem aqui.
              </p>
              <Link to="/courses" className="btn-outline mt-6 inline-flex">
                Ver catálogo completo
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {topCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden"
              >
                <Link to={`/courses/${course.id}`} className="card block h-full cursor-pointer">
                  <div className="mb-6">
                    <img
                      src={course.thumbnail || fallbackImages[index % fallbackImages.length]}
                      alt={course.title}
                      className="w-full rounded-[18px]"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                      <span>{course.category || 'Trilha'}</span>
                      <span>{course.duration_hours ? `${course.duration_hours}h` : '—'}</span>
                    </div>
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {course.description || 'Conteúdo orientado a pratica com desafios e acompanhamento.'}
                    </p>
                  </div>
                </Link>
              </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-[clamp(80px,10vh,160px)] bg-[hsl(var(--graphite))] text-[hsl(var(--foreground))]">
        <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="headline-font text-4xl md:text-5xl">
              Entre na MAEXTRIA e avance com clareza
            </h2>
            <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
              Plataforma premium, métodologia clara e curadoria profunda. Tudo o que você
              precisa para aprender com inteligencia e expandir com estratégia.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/courses" className="btn-accent text-base md:text-lg">
                Explorar Cursos
              </Link>
            </div>
            <div className="flex justify-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-2">
                <FaBolt />
                <span>Onboarding em minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <FaChalkboardTeacher />
                <span>Instrutores selecionados</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
