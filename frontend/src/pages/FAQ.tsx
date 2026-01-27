import { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp, FaQuestionCircle, FaGraduationCap, FaUsers, FaBriefcase } from 'react-icons/fa';
import Layout from '../components/Layout';
import { SEO } from '../components/SEO';

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
    icon: <FaUsers className="w-6 h-6" />,
    items: [
      {
        question: "O que e a MAEXTRIA?",
        answer: "A MAEXTRIA e uma plataforma de educacao online que conecta professores especialistas a alunos interessados em aprender. Oferecemos cursos em diversas areas do conhecimento, com conteudo de qualidade e certificado de conclusao."
      },
      {
        question: "Preciso pagar para me cadastrar?",
        answer: "Nao! O cadastro na plataforma e totalmente gratuito. Voce so paga pelos cursos que decidir adquirir."
      },
      {
        question: "Como funciona o acesso aos cursos?",
        answer: "Apos a compra, voce tem acesso vitalicio ao curso. Pode assistir as aulas quantas vezes quiser, no seu proprio ritmo, de qualquer dispositivo com acesso a internet."
      },
      {
        question: "Os cursos tem certificado?",
        answer: "Sim! Ao concluir um curso com aproveitamento minimo de 70%, voce recebe um certificado digital que pode ser verificado em nossa plataforma e compartilhado no LinkedIn."
      },
      {
        question: "Como posso entrar em contato com o suporte?",
        answer: "Voce pode nos contatar atraves do email suporte@maextria.com.br ou pelo chat disponivel na plataforma. Nosso tempo medio de resposta e de 24 horas uteis."
      }
    ]
  },
  {
    title: "Alunos",
    icon: <FaGraduationCap className="w-6 h-6" />,
    items: [
      {
        question: "Como faco para comprar um curso?",
        answer: "Basta criar uma conta gratuita, escolher o curso desejado e realizar o pagamento via cartao de credito, boleto ou PIX. Apos a confirmacao, voce tera acesso imediato ao conteudo."
      },
      {
        question: "Posso baixar as aulas para assistir offline?",
        answer: "Atualmente as aulas sao disponibilizadas apenas via streaming. Estamos trabalhando para disponibilizar o download em breve."
      },
      {
        question: "E se eu nao gostar do curso?",
        answer: "Oferecemos garantia de 7 dias. Se voce nao ficar satisfeito, pode solicitar o reembolso integral dentro desse prazo, sem burocracia."
      },
      {
        question: "Como funciona o sistema de avaliacoes?",
        answer: "Cada modulo pode conter quizzes e atividades praticas. Sua nota final e calculada com base no desempenho nessas avaliacoes. Voce precisa de 70% de aproveitamento para receber o certificado."
      },
      {
        question: "Posso tirar duvidas com o professor?",
        answer: "Sim! Cada curso possui uma area de comentarios onde voce pode interagir com o professor e outros alunos. Os professores respondem as duvidas regularmente."
      },
      {
        question: "Por quanto tempo tenho acesso ao curso?",
        answer: "O acesso e vitalicio! Uma vez adquirido, o curso fica disponivel para voce para sempre, incluindo futuras atualizacoes de conteudo."
      }
    ]
  },
  {
    title: "Professores",
    icon: <FaBriefcase className="w-6 h-6" />,
    items: [
      {
        question: "Como me tornar professor na MAEXTRIA?",
        answer: "Acesse a pagina 'Seja um Professor', preencha o formulario com suas informacoes e area de expertise. Nossa equipe analisara seu perfil e entrara em contato em ate 5 dias uteis."
      },
      {
        question: "Quanto posso ganhar como professor?",
        answer: "Voce recebe 70% do valor de cada venda do seu curso. Os pagamentos sao realizados mensalmente, sempre no dia 15, para vendas do mes anterior."
      },
      {
        question: "Preciso ter experiencia com gravacao de videos?",
        answer: "Nao necessariamente! Oferecemos materiais de apoio e dicas para criar conteudo de qualidade. O mais importante e seu conhecimento e didatica. Tambem temos parceiros que podem ajudar na producao."
      },
      {
        question: "Quem define o preco do curso?",
        answer: "Voce define! Recomendamos analisar cursos similares na plataforma para definir um preco competitivo. Nossa equipe tambem pode orientar sobre precificacao."
      },
      {
        question: "O que e a curadoria de cursos?",
        answer: "Todo curso passa por uma analise de qualidade antes de ser publicado. Verificamos a qualidade tecnica do conteudo, clareza das explicacoes e adequacao as nossas diretrizes. O processo leva em media 5 dias uteis."
      },
      {
        question: "Posso atualizar meu curso depois de publicado?",
        answer: "Sim! Voce pode adicionar novas aulas, atualizar conteudos existentes e melhorar seu curso a qualquer momento. Atualizacoes significativas passam por nova curadoria."
      },
      {
        question: "Como funciona o Maextria Ads?",
        answer: "O Maextria Ads e nossa rede de publicidade interna que permite promover seu curso para mais alunos dentro da plataforma. Voce pode investir uma parte dos seus ganhos para aumentar a visibilidade do seu curso. Em breve disponivel!"
      }
    ]
  }
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0" data-testid="faq-item">
      <button
        onClick={onToggle}
        className="w-full py-4 px-4 flex justify-between items-center text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        data-testid="button-faq-toggle"
      >
        <span className="font-medium text-gray-900 dark:text-white">{item.question}</span>
        {isOpen ? (
          <FaChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <FaChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-gray-600 dark:text-gray-300 leading-relaxed" data-testid="faq-answer">
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
    <Layout>
      <SEO 
        title="Perguntas Frequentes | MAEXTRIA"
        description="Encontre respostas para as duvidas mais comuns sobre a MAEXTRIA. Informacoes para visitantes, alunos e professores."
      />
      
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FaQuestionCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl font-bold mb-4" data-testid="text-faq-title">Perguntas Frequentes</h1>
          <p className="text-xl opacity-90">
            Encontre respostas para as duvidas mais comuns sobre a MAEXTRIA
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {faqData.map((section, sectionIndex) => (
          <div key={section.title} className="mb-8" data-testid={`faq-section-${sectionIndex}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                {section.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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

        <div className="mt-12 text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ainda tem duvidas?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Nossa equipe esta pronta para ajudar voce!
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
    </Layout>
  );
}
