import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaBookmark, FaPlayCircle, FaBalanceScale, FaBolt, FaChalkboardTeacher } from 'react-icons/fa';
import { Course } from '../../types';

type HomeBelowFoldProps = {
  loadingTopCourses: boolean;
  topCourses: Course[];
  fallbackImages: string[];
};

export default function HomeBelowFold({
  loadingTopCourses,
  topCourses,
  fallbackImages,
}: HomeBelowFoldProps) {
  return (
    <>
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
              <picture>
                <source srcSet="/hero-09.avif" type="image/avif" />
                <source srcSet="/hero-09.webp" type="image/webp" />
                <img
                  src="/hero-09.png"
                  alt="Horas complementares"
                  loading="lazy"
                  decoding="async"
                  width={1280}
                  height={800}
                  className="rounded-[24px]"
                />
              </picture>
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
                <picture>
                  <source srcSet="/hero-11.avif" type="image/avif" />
                  <source srcSet="/hero-11.webp" type="image/webp" />
                  <img
                    src="/hero-11.png"
                    alt="Métodologia MAEXTRIA"
                    loading="lazy"
                    decoding="async"
                    width={1280}
                    height={900}
                    className="rounded-[28px]"
                  />
                </picture>
              </div>
              <div className="absolute -bottom-10 -left-8 hidden md:block">
                <picture>
                  <source srcSet="/hero-02.avif" type="image/avif" />
                  <source srcSet="/hero-02.webp" type="image/webp" />
                  <img
                    src="/hero-02.png"
                    alt="Detalhe editorial"
                    loading="lazy"
                    decoding="async"
                    width={192}
                    height={192}
                    className="w-48 rounded-[22px] shadow-xl"
                  />
                </picture>
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
              <picture>
                <source srcSet="/hero-04.avif" type="image/avif" />
                <source srcSet="/hero-04.webp" type="image/webp" />
                <img
                  src="/hero-04.png"
                  alt="Curadoria MAEXTRIA"
                  loading="lazy"
                  decoding="async"
                  width={1280}
                  height={900}
                  className="rounded-[28px]"
                />
              </picture>
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
                        loading="lazy"
                        decoding="async"
                        width={640}
                        height={400}
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
    </>
  );
}
