import { useEffect, useMemo, useRef, useState } from 'react';
import { FaTimes, FaPaperPlane, FaStar } from 'react-icons/fa';
import { ChatMessage } from '../types';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Link, useLocation } from 'react-router-dom';

export default function AIChat() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(user?.id ? String(user.id) : null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const audience = useMemo(() => {
    if (user?.role === 'admin') return 'admin';
    if (user?.role === 'teacher') return 'teacher';
    if (user?.role === 'student') return 'student';
    if (location.pathname.startsWith('/sou-professor')) return 'prospect_teacher';
    return 'prospect_student';
  }, [user?.role, location.pathname]);

  useEffect(() => {
    const currentUserId = user?.id ? String(user.id) : null;
    if (lastUserId !== currentUserId) {
      setMessages([]);
      setInput('');
      setLastUserId(currentUserId);
    }
    if (!currentUserId) {
      setMessages([]);
      setInput('');
      setIsOpen(false);
    }
  }, [user?.id, lastUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const legacyKey = `maextria_ai_cache_${audience}`;
    window.localStorage.removeItem(legacyKey);
  }, [audience]);

  const AIIcon = ({ className = '' }: { className?: string }) => (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <FaTimes />
      <FaStar className="absolute -top-1 -right-1 text-[10px] text-[hsl(var(--accent))]" />
    </span>
  );

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMessage].slice(-8);
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage.content,
          history,
          audience,
        },
      });

      if (error) {
        throw error;
      }

      const reply = data?.content || 'Nao consegui responder agora.';
      const responseCourses = Array.isArray(data?.courses)
        ? data.courses
            .filter((course: { id?: string; titulo?: string }) => course?.id && course?.titulo)
            .map((course: { id: string; titulo: string }) => ({ id: String(course.id), title: String(course.titulo) }))
        : null;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, courses: responseCourses || undefined },
      ]);
    } catch (error: any) {
      toast.error(error?.message || 'Nao foi possivel responder agora.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Houve um problema ao responder. Tente novamente.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isHome || user?.role) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          title="Falar com a IA"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-3 rounded-full shadow-lg z-50 flex items-center gap-2"
        >
          <AIIcon className="text-2xl" />
          <span className="text-sm font-semibold">Fale com a IA</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-[hsl(var(--card))] rounded-lg shadow-2xl flex flex-col z-50">
          <div className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <AIIcon className="text-xl" />
              <span className="font-semibold">Assistente MAEXTRIA</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-[hsl(var(--secondary))]">
              <FaTimes />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-[hsl(var(--muted-foreground))] text-center mt-8 space-y-2">
                <AIIcon className="text-4xl mx-auto mb-2 text-[hsl(var(--primary))]" />
                <p>Oi! Me conte seu objetivo e eu indico cursos e certificados.</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                }`}>
                  {msg.content}
                  {msg.role === 'assistant' && msg.courses && msg.courses.length > 0 && (
                    <div className="mt-3 space-y-2 text-sm">
                      {msg.courses.map((course) => (
                        <div key={course.id} className="flex items-center justify-between gap-2">
                          <span className="font-medium">{course.title}</span>
                          <Link
                            to={`/courses/${course.id}`}
                            className="text-[hsl(var(--primary))] underline"
                          >
                            Clique aqui
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[hsl(var(--muted))] p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-[hsl(var(--border))]">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Qual seu objetivo profissional?"
                className="input-field flex-grow"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn-accent px-4"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
