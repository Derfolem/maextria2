import { useState } from 'react';
import { FaChevronDown, FaQuestionCircle, FaGraduationCap, FaUsers, FaBriefcase, FaPaperPlane } from 'react-icons/fa';
import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    id: "visitantes",
    title: "Visitantes",
    icon: <FaUsers className="w-5 h-5" />,
    color: "from-emerald-500 to-teal-600",
    items: [
      {
        question: "O que e a MAEXTRIA?",
        answer: "A MAEXTRIA e uma plataforma de educacao online que conecta professores especialistas a alunos interessados em aprender para evoluir profissionalmente. Oferecemos cursos em diversas areas do conhecimento, com conteudo de qualidade e certificado de conclusao."
      },
      {
        question: "Preciso pagar para me cadastrar?",
        answer: "Nao! O cadastro na plataforma e totalmente gratuito."
      },
      {
        question: "Como funciona o acesso aos cursos?",
        answer: "Apos o cadastro, voce tem acesso vitalicio aos cursos. Pode assistir todas as aulas quantas vezes quiser, no seu proprio ritmo, de qualquer dispositivo com acesso a internet."
      },
      {
        question: "Os cursos tem certificado?",
        answer: "Sim! Ao concluir um curso com aproveitamento minimo de 70%, voce recebe um certificado digital que pode ser verificado em nossa plataforma e compartilhado no LinkedIn, curriculo e faculdade."
      },
      {
        question: "Como posso entrar em contato com o suporte?",
        answer: "Voce pode nos contatar atraves do formulario do fale conosco no final desta pagina. Nosso tempo medio de resposta e de 24 horas uteis."
      }
    ]
  },
  {
    id: "alunos",
    title: "Alunos",
    icon: <FaGraduationCap className="w-5 h-5" />,
    color: "from-blue-500 to-indigo-600",
    items: [
      {
        question: "Como faco para comprar um curso?",
        answer: "Basta criar uma conta gratuita, escolher o curso desejado e assistir quantas vezes quiser e realizar a prova final. Com 70% de aproveitamento voce podera baixar o certificado. Nossa plataforma e democratizadora de conhecimento, acessivel a todos e gratuitamente."
      },
      {
        question: "Posso baixar as aulas para assistir offline?",
        answer: "Atualmente as aulas sao disponibilizadas apenas via streaming. Estamos trabalhando para disponibilizar o download em breve."
      },
      {
        question: "E se eu nao gostar do curso?",
        answer: "Para assistir as aulas, nao e necessario realizar nenhum pagamento. Pode assistir quantas vezes quiser."
      },
      {
        question: "Como funciona o sistema de avaliacoes?",
        answer: "Cada modulo pode conter quizzes e atividades praticas. Sua nota final e calculada com base no desempenho nessas avaliacoes. Voce precisa de 70% de aproveitamento para receber o certificado."
      },
      {
        question: "Posso tirar duvidas com o professor?",
        answer: "Aqui na area de FAQ possui um formulario onde pode enviar suas duvidas. Procure ser o mais detalhista possivel."
      },
      {
        question: "Por quanto tempo tenho acesso ao curso?",
        answer: "O acesso e vitalicio! Uma vez cadastrado, o curso fica disponivel para voce para sempre, incluindo futuras atualizacoes de conteudo."
      }
    ]
  },
  {
    id: "professores",
    title: "Professores",
    icon: <FaBriefcase className="w-5 h-5" />,
    color: "from-purple-500 to-pink-600",
    items: [
      {
        question: "Como me tornar professor na MAEXTRIA?",
        answer: "Acesse a pagina 'Seja um Professor', preencha o formulario com suas informacoes e area de expertise. Nossa equipe analisara seu perfil e entrara em contato em ate 5 dias uteis."
      },
      {
        question: "Quanto posso ganhar como professor?",
        answer: "Voce recebe conforme regra de comissao, que e informada ao ingressar no time de professores."
      },
      {
        question: "Preciso ter experiencia com gravacao de videos?",
        answer: "Nao necessariamente! Nao precisa gravar videos se achar que nao e necessario. Mas a recomendacao e que tenha formas didaticas e de facil entendimento para que os alunos tenham o maximo de aproveitamento."
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
        answer: "Sim! Voce pode adicionar novas aulas, atualizar conteudos existentes e melhorar seu curso a qualquer momento. Todas as atualizacoes passam por nova curadoria."
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
    <div className="group" data-testid="faq-item">
      <button
        onClick={onToggle}
        className={`w-full py-4 px-5 flex justify-between items-center text-left transition-all duration-300 ${isOpen ? 'bg-white/10' : 'hover:bg-white/5'}`}
        data-testid="button-faq-toggle"
      >
        <span className="font-medium text-white/90 group-hover:text-white transition-colors">{item.question}</span>
        <div className={`p-1 rounded-full transition-all duration-300 ${isOpen ? 'bg-white/20 rotate-180' : 'bg-white/10'}`}>
          <FaChevronDown className="w-3 h-3 text-white/70" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-4 text-white/70 leading-relaxed text-sm" data-testid="faq-answer">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    
    try {
      const { error: insertError } = await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        created_at: new Date().toISOString()
      });
      
      if (insertError) throw insertError;
      
      setSent(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError('Erro ao enviar mensagem. Tente novamente.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaPaperPlane className="w-6 h-6 text-green-400" />
        </div>
        <h4 className="text-xl font-bold text-white mb-2">Mensagem enviada!</h4>
        <p className="text-white/70">Responderemos em ate 24 horas uteis.</p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Seu nome"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
          data-testid="input-contact-name"
        />
        <input
          type="email"
          placeholder="Seu email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
          data-testid="input-contact-email"
        />
      </div>
      <input
        type="text"
        placeholder="Assunto"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        required
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
        data-testid="input-contact-subject"
      />
      <textarea
        placeholder="Sua mensagem..."
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        required
        rows={4}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all resize-none"
        data-testid="input-contact-message"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        data-testid="button-contact-submit"
      >
        {sending ? 'Enviando...' : (
          <>
            <FaPaperPlane className="w-4 h-4" />
            Enviar Mensagem
          </>
        )}
      </button>
    </form>
  );
}

export default function FAQ() {
  const [activeSection, setActiveSection] = useState<string>("visitantes");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const { isAuthenticated, user } = useAuthStore();
  

  const toggleItem = (sectionId: string, itemIndex: number) => {
    const key = `${sectionId}-${itemIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentSection = faqData.find(s => s.id === activeSection) || faqData[0];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SEO 
        title="Perguntas Frequentes | MAEXTRIA"
        description="Encontre respostas para as duvidas mais comuns sobre a MAEXTRIA. Informacoes para visitantes, alunos e professores."
      />

      {/* Header minimalista */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/maextria-logo.png" alt="MAEXTRIA" className="h-8 w-8" />
            <span className="text-white font-semibold tracking-wide group-hover:text-blue-400 transition-colors">MAEXTRIA</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/courses" className="text-white/70 hover:text-white text-sm transition-colors">Cursos</Link>
            <Link to="/sou-professor" className="text-white/70 hover:text-white text-sm transition-colors">Seja Professor</Link>
            {isAuthenticated ? (
              <Link to={user?.role === 'teacher' ? '/teacher/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors">
                Minha Area
              </Link>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="pt-24 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center pt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
            <FaQuestionCircle className="w-4 h-4 text-blue-400" />
            <span className="text-white/70 text-sm">Central de Ajuda</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-faq-title">
            Como podemos <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ajudar?</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Encontre respostas rapidas para as duvidas mais comuns
          </p>
        </div>
      </div>

      {/* Tabs de navegacao */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap justify-center gap-3">
          {faqData.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeSection === section.id
                  ? `bg-gradient-to-r ${section.color} text-white shadow-lg shadow-blue-500/25`
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
              data-testid={`tab-${section.id}`}
            >
              {section.icon}
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className={`bg-gradient-to-br ${currentSection.color} p-[1px] rounded-2xl shadow-2xl shadow-blue-500/10`}>
          <div className="bg-[#0a0a0f]/95 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${currentSection.color}`}>
                {currentSection.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentSection.title}</h2>
                <p className="text-white/50 text-sm">{currentSection.items.length} perguntas</p>
              </div>
            </div>
            
            <div className="divide-y divide-white/5">
              {currentSection.items.map((item, index) => (
                <FAQAccordion
                  key={index}
                  item={item}
                  isOpen={openItems[`${currentSection.id}-${index}`] || false}
                  onToggle={() => toggleItem(currentSection.id, index)}
                  
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <div className="bg-gradient-to-br from-white/10 to-white/5 p-[1px] rounded-2xl">
          <div className="bg-[#0a0a0f]/95 backdrop-blur-xl rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Ainda tem duvidas?</h3>
              <p className="text-white/60">Envie sua mensagem e responderemos o mais rapido possivel</p>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/maextria-logo.png" alt="MAEXTRIA" className="h-6 w-6 opacity-50" />
            <span className="text-white/40 text-sm">&copy; 2024 MAEXTRIA</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link to="/courses" className="hover:text-white/70 transition-colors">Cursos</Link>
            <Link to="/privacidade" className="hover:text-white/70 transition-colors">Privacidade</Link>
            <Link to="/termos" className="hover:text-white/70 transition-colors">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
