import { useState } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { ChatMessage } from '../types';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: input });
      const aiMessage: ChatMessage = { role: 'assistant', content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Erro ao se comunicar com a IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-4 rounded-full shadow-lg hover:shadow-xl transition z-50"
        >
          <FaRobot className="text-2xl" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-[hsl(var(--card))] rounded-lg shadow-2xl flex flex-col z-50">
          <div className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FaRobot className="text-xl" />
              <span className="font-semibold">X • Assistente MAEXTRIA</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-[hsl(var(--secondary))]">
              <FaTimes />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-[hsl(var(--muted-foreground))] text-center mt-8 space-y-2">
                <FaRobot className="text-4xl mx-auto mb-2 text-[hsl(var(--primary))]" />
                <p>Oi, eu sou o X. Como posso ajudar agora?</p>
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
          </div>

          <div className="p-4 border-t border-[hsl(var(--border))]">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escreva sua pergunta..."
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
