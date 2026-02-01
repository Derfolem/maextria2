import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaBook, FaMoneyBillWave, FaChevronDown, FaChevronUp, FaLightbulb, FaCheckCircle } from 'react-icons/fa';

interface TutorialSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
}

const tutorialSections: TutorialSection[] = [
  {
    id: 'criar-curso',
    title: 'Como Criar um Curso',
    icon: <FaBook className="text-[hsl(var(--primary))]" />,
    steps: [
      {
        title: '1. Acesse "Meus Cursos"',
        description: 'No menu lateral ou no painel principal, clique em "Meus Cursos" para ver seus cursos existentes e criar novos.',
        tip: 'Você pode acessar rapidamente pelo botão "+ Novo Curso" no painel principal.'
      },
      {
        title: '2. Clique em "Criar Novo Curso"',
        description: 'Na página de Meus Cursos, clique no botão "Criar Novo Curso" ou "+ Novo Curso" para iniciar a criação.',
      },
      {
        title: '3. Preencha as Informações Básicas',
        description: 'Defina o título do curso, uma descrição atraente, a categoria, nível de dificuldade, carga horária e preço. Adicione também uma imagem de capa chamativa.',
        tip: 'Use uma imagem de alta qualidade (1280x720px) para a capa. Títulos claros e descrições detalhadas ajudam nas vendas.'
      },
      {
        title: '4. Crie os Módulos',
        description: 'Organize seu curso em módulos temáticos. Cada módulo agrupa aulas relacionadas. Clique em "Adicionar Módulo" e dê um nome descritivo.',
        tip: 'Recomendamos entre 3 a 8 módulos por curso para manter a organização.'
      },
      {
        title: '5. Adicione as Aulas',
        description: 'Dentro de cada módulo, adicione aulas com vídeos, textos ou materiais complementares. Clique em "Adicionar Aula" dentro do módulo desejado.',
        tip: 'Vídeos curtos (5-15 minutos) têm melhor engajamento. Inclua materiais de apoio quando possível.'
      },
      {
        title: '6. Revise e Publique',
        description: 'Após adicionar todo o conteúdo, revise seu curso. Quando estiver pronto, clique em "Enviar para Aprovação". A equipe MAEXTRIA irá revisar e aprovar.',
        tip: 'Cursos completos e bem estruturados são aprovados mais rapidamente.'
      }
    ]
  },
  {
    id: 'comissoes',
    title: 'Como Funciona a Comissão',
    icon: <FaMoneyBillWave className="text-green-500" />,
    steps: [
      {
        title: 'Modelo de Comissão',
        description: 'Você recebe uma porcentagem de cada venda do seu curso. A comissão padrão é definida pela plataforma e pode variar de acordo com promoções ou acordos especiais.',
        tip: 'Quanto mais alunos você atrair, maior sua receita total!'
      },
      {
        title: 'Quando Recebo?',
        description: 'As comissões são calculadas automaticamente a cada venda confirmada. Os pagamentos são processados mensalmente, geralmente até o dia 15 do mês seguinte.',
      },
      {
        title: 'Acompanhe suas Comissões',
        description: 'No seu Painel, você pode ver o resumo de comissões pendentes e o histórico de pagamentos. Todas as vendas ficam registradas com detalhes.',
        tip: 'Mantenha seus dados bancários sempre atualizados para evitar atrasos no pagamento.'
      },
      {
        title: 'Dados Bancários',
        description: 'Para receber seus pagamentos, cadastre seus dados bancários no Painel do Professor. Você pode usar conta corrente, poupança ou chave PIX.',
      },
      {
        title: 'Status das Comissões',
        description: 'Suas comissões podem ter diferentes status: "Pendente" (aguardando processamento), "Aprovada" (confirmada para pagamento) ou "Paga" (já transferida).',
        tip: 'Comissões de vendas com garantia podem ficar pendentes até o fim do período de garantia.'
      }
    ]
  }
];

export default function TeacherTutorial() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['criar-curso', 'comissoes']);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[hsl(var(--background))] py-8 px-[clamp(16px,4vw,48px)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/teacher/dashboard" 
            className="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-4 transition"
          >
            <FaArrowLeft />
            <span>Voltar ao Painel</span>
          </Link>
          <h1 className="headline-font text-3xl md:text-4xl mb-2 text-[hsl(var(--member-strong))]">
            Tutorial do Professor
          </h1>
          <p className="text-[hsl(var(--member-strong))]">
            Aprenda a usar a plataforma MAEXTRIA para criar cursos e gerenciar suas comissões.
          </p>
        </div>

        {/* Tutorial Sections */}
        <div className="space-y-6">
          {tutorialSections.map((section) => (
            <div key={section.id} className="card overflow-hidden">
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-[hsl(var(--muted))/0.3] transition"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{section.icon}</div>
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                {expandedSections.includes(section.id) ? (
                  <FaChevronUp className="text-[hsl(var(--muted-foreground))]" />
                ) : (
                  <FaChevronDown className="text-[hsl(var(--muted-foreground))]" />
                )}
              </button>

              {/* Section Content */}
              {expandedSections.includes(section.id) && (
                <div className="px-6 pb-6 space-y-4">
                  {section.steps.map((step, index) => (
                    <div 
                      key={index}
                      className="flex gap-4 p-4 rounded-lg bg-[hsl(var(--muted))/0.2] border border-[hsl(var(--border))]"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <FaCheckCircle className="text-[hsl(var(--primary))] text-lg" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{step.title}</h3>
                        <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed">
                          {step.description}
                        </p>
                        {step.tip && (
                          <div className="mt-3 flex items-start gap-2 p-3 rounded-md bg-[hsl(var(--primary))/0.1] border border-[hsl(var(--primary))/0.2]">
                            <FaLightbulb className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-[hsl(var(--primary))]">
                              <strong>Dica:</strong> {step.tip}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-6 card bg-gradient-to-r from-[hsl(var(--primary))/0.1] to-[hsl(var(--accent))/0.1]">
          <h3 className="font-semibold mb-4">Comece Agora!</h3>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/teacher/my-courses" 
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <FaBook />
              <span>Criar Meu Primeiro Curso</span>
            </Link>
            <Link 
              to="/teacher/dashboard" 
              className="btn-outline px-6 py-3 flex items-center gap-2"
            >
              <FaMoneyBillWave />
              <span>Ver Minhas Comissões</span>
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center text-[hsl(var(--muted-foreground))] text-sm">
          <p>Ainda tem dúvidas? Entre em contato com nosso suporte.</p>
        </div>
      </div>
    </div>
  );
}
