import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, GraduationCap, Users, Briefcase } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    title: "Visitantes",
    icon: <Users className="w-6 h-6" />,
    items: [
      {
        question: "O que é a MAEXTRIA?",
        answer: "A MAEXTRIA é uma plataforma de educação online que conecta professores especialistas a alunos interessados em aprender. Oferecemos cursos em diversas áreas do conhecimento, com conteúdo de qualidade e certificado de conclusão."
      },
      {
        question: "Preciso pagar para me cadastrar?",
        answer: "Não! O cadastro na plataforma é totalmente gratuito. Você só paga pelos cursos que decidir adquirir."
      },
      {
        question: "Como funciona o acesso aos cursos?",
        answer: "Após a compra, você tem acesso vitalício ao curso. Pode assistir às aulas quantas vezes quiser, no seu próprio ritmo, de qualquer dispositivo com acesso à internet."
      },
      {
        question: "Os cursos têm certificado?",
        answer: "Sim! Ao concluir um curso com aproveitamento mínimo de 70%, você recebe um certificado digital que pode ser verificado em nossa plataforma e compartilhado no LinkedIn."
      },
      {
        question: "Como posso entrar em contato com o suporte?",
        answer: "Você pode nos contatar através do email suporte@maextria.com.br ou pelo chat disponível na plataforma. Nosso tempo médio de resposta é de 24 horas úteis."
      }
    ]
  },
  {
    title: "Alunos",
    icon: <GraduationCap className="w-6 h-6" />,
    items: [
      {
        question: "Como faço para comprar um curso?",
        answer: "Basta criar uma conta gratuita, escolher o curso desejado e realizar o pagamento via cartão de crédito, boleto ou PIX. Após a confirmação, você terá acesso imediato ao conteúdo."
      },
      {
        question: "Posso baixar as aulas para assistir offline?",
        answer: "Atualmente as aulas são disponibilizadas apenas via streaming. Estamos trabalhando para disponibilizar o download em breve."
      },
      {
        question: "E se eu não gostar do curso?",
        answer: "Oferecemos garantia de 7 dias. Se você não ficar satisfeito, pode solicitar o reembolso integral dentro desse prazo, sem burocracia."
      },
      {
        question: "Como funciona o sistema de avaliações?",
        answer: "Cada módulo pode conter quizzes e atividades práticas. Sua nota final é calculada com base no desempenho nessas avaliações. Você precisa de 70% de aproveitamento para receber o certificado."
      },
      {
        question: "Posso tirar dúvidas com o professor?",
        answer: "Sim! Cada curso possui uma área de comentários onde você pode interagir com o professor e outros alunos. Os professores respondem às dúvidas regularmente."
      },
      {
        question: "Por quanto tempo tenho acesso ao curso?",
        answer: "O acesso é vitalício! Uma vez adquirido, o curso fica disponível para você para sempre, incluindo futuras atualizações de conteúdo."
      }
    ]
  },
  {
    title: "Professores",
    icon: <Briefcase className="w-6 h-6" />,
    items: [
      {
        question: "Como me tornar professor na MAEXTRIA?",
        answer: "Acesse a página 'Seja um Professor', preencha o formulário com suas informações e área de expertise. Nossa equipe analisará seu perfil e entrará em contato em até 5 dias úteis."
      },
      {
        question: "Quanto posso ganhar como professor?",
        answer: "Você recebe 70% do valor de cada venda do seu curso. Os pagamentos são realizados mensalmente, sempre no dia 15, para vendas do mês anterior."
      },
      {
        question: "Preciso ter experiência com gravação de vídeos?",
        answer: "Não necessariamente! Oferecemos materiais de apoio e dicas para criar conteúdo de qualidade. O mais importante é seu conhecimento e didática. Também temos parceiros que podem ajudar na produção."
      },
      {
        question: "Quem define o preço do curso?",
        answer: "Você define! Recomendamos analisar cursos similares na plataforma para definir um preço competitivo. Nossa equipe também pode orientar sobre precificação."
      },
      {
        question: "O que é a curadoria de cursos?",
        answer: "Todo curso passa por uma análise de qualidade antes de ser publicado. Verificamos a qualidade técnica do conteúdo, clareza das explicações e adequação às nossas diretrizes. O processo leva em média 5 dias úteis."
      },
      {
        question: "Posso atualizar meu curso depois de publicado?",
        answer: "Sim! Você pode adicionar novas aulas, atualizar conteúdos existentes e melhorar seu curso a qualquer momento. Atualizações significativas passam por nova curadoria."
      },
      {
        question: "Como funciona o Maextria Ads?",
        answer: "O Maextria Ads é nossa rede de publicidade interna que permite promover seu curso para mais alunos dentro da plataforma. Você pode investir uma parte dos seus ganhos para aumentar a visibilidade do seu curso. Em breve disponível!"
      }
    ]
  }
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200 last:border-b-0" data-testid="faq-item">
      <button
        onClick={onToggle}
        className="w-full py-4 px-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
        data-testid="button-faq-toggle"
      >
        <span className="font-medium text-gray-900">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-gray-600 leading-relaxed" data-testid="faq-answer">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (sectionIndex: number, itemIndex: number) => {
    const key = `${sectionIndex}-${itemIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-4xl font-bold mb-4" data-testid="text-faq-title">Perguntas Frequentes</h1>
            <p className="text-xl opacity-90">
              Encontre respostas para as dúvidas mais comuns sobre a MAEXTRIA
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {faqData.map((section, sectionIndex) => (
            <div key={section.title} className="mb-8" data-testid={`faq-section-${sectionIndex}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <FAQAccordion
                    key={itemIndex}
                    item={item}
                    isOpen={openItems[`${sectionIndex}-${itemIndex}`] || false}
                    onToggle={() => toggleItem(sectionIndex, itemIndex)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="mt-12 text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ainda tem dúvidas?</h3>
            <p className="text-gray-600 mb-4">
              Nossa equipe está pronta para ajudar você!
            </p>
            <a
              href="mailto:suporte@maextria.com.br"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="link-contact-support"
            >
              Fale Conosco
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
