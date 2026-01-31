import { SEO } from '../components/SEO';

export default function About() {
  return (
    <>
      <SEO
        title="Sobre a MAEXTRIA | Educação Premium e Aplicação Prática"
        description="Conheça a história, missão e valores da MAEXTRIA. Uma plataforma de educação premium com foco em aprendizado profundo e aplicação prática."
        url="https://www.maextria.com.br/sobre"
      />

      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--background))]">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--foreground))] mb-6">
              Sobre a{' '}
              <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                MAEXTRIA
              </span>
            </h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
              A gente acredita que o conhecimento de verdade muda o rumo da sua carreira
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-12">
            {/* Visão Geral */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">
                Nossa História
              </h2>
              <div className="space-y-6 text-[hsl(var(--muted-foreground))] leading-relaxed">
                <p>
                  Quando imaginamos a MAEXTRIA, nosso ponto de partida foi a certeza de que você merece algo além da avalanche de cursos superficiais: criamos uma plataforma premium, com curadoria cuidadosa e foco em aplicação prática. Aqui, cada curso, cada trilha e cada instrutor foi escolhido a dedo pela experiência que traz do mercado, não por tendências passageiras.
                </p>
                <p>
                  Nosso compromisso é com a sua evolução real. Por isso pensamos na jornada como uma tríade: aprender com profundidade, aplicar com método e expandir com estratégia. Você terá acesso a conteúdos densos e organizados, exercícios e estudos de caso que aproximam teoria e prática, e planos de ação que ajudam a transformar conhecimento em resultados concretos. Tudo isso sem barulho ou promessas vazias: menos quantidade, mais impacto.
                </p>
              </div>
            </div>

            {/* Diferencial */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">
                Por Que Escolher a MAEXTRIA
              </h2>
              <div className="space-y-6 text-[hsl(var(--muted-foreground))] leading-relaxed">
                <p>
                  Sabemos que quem procura crescimento busca mais do que um certificado bonito. Por isso, oferecemos acompanhamento e uma experiência fluida, sempre com foco em resultados mensuráveis. Nossa curadoria rigorosa, material complementar com frameworks e templates e certificados com autenticidade verificável são o alicerce que sustenta seu desenvolvimento.
                </p>
                <p>
                  O resultado? Decisões mais estratégicas, habilidades valiosas e um ritmo de estudo claro, sem excesso de conteúdo. Você aprende o que realmente importa, quando realmente importa, no seu próprio ritmo.
                </p>
              </div>
            </div>

            {/* Missão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">
                  Nossa Missão
                </h3>
                <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Nossa missão é levar até você uma formação profissional de alto nível, com curadoria rigorosa e foco absoluto na aplicação prática. Cada curso é pensado para gerar resultados mensuráveis e preparar você para os desafios reais do mercado.
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">
                  Nossa Visão
                </h3>
                <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Desejamos ser referência em educação premium para profissionais, com a coragem de oferecer menos cursos e mais impacto. Sonhamos com um cenário em que o aprendizado seja profundo, aplicável e estratégico, ajudando pessoas a evoluir com clareza e propósito.
                </p>
              </div>
            </div>

            {/* Valores */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-8">
                Nossos Valores
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                        Profundidade e Curadoria
                      </h4>
                      <p className="text-[hsl(var(--muted-foreground))]">
                        Escolhemos instrutores com experiência comprovada de mercado, garantindo que cada conteúdo agregue valor real.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                        Autenticidade
                      </h4>
                      <p className="text-[hsl(var(--muted-foreground))]">
                        Nossos certificados têm verificação pública. Transparência em tudo o que fazemos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                        Ética
                      </h4>
                      <p className="text-[hsl(var(--muted-foreground))]">
                        Agimos com integridade em cada decisão, colocando sempre o seu desenvolvimento em primeiro lugar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                        Aprendizagem Contínua
                      </h4>
                      <p className="text-[hsl(var(--muted-foreground))]">
                        Acreditamos no crescimento constante e oferecemos conteúdo sempre atualizado com as tendências do mercado.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                        Respeito ao Seu Tempo
                      </h4>
                      <p className="text-[hsl(var(--muted-foreground))]">
                        Sem excesso de conteúdo. Apenas o essencial, bem estruturado e pronto para aplicação.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                        Compromisso com Resultados
                      </h4>
                      <p className="text-[hsl(var(--muted-foreground))]">
                        Medimos sucesso pelos impactos concretos que geramos na vida profissional de cada aluno.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Pronto para Evoluir Com Clareza e Propósito?
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Entre na MAEXTRIA e descubra como estar pronto para o mercado de trabalho de amanhã, com uma comunidade que te apoia e questiona, celebrando tuas vitórias e te provocando a ir além.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/courses"
                  className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Explore Nossos Cursos
                </a>
                <a
                  href="/register"
                  className="px-8 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  Comece Agora
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
