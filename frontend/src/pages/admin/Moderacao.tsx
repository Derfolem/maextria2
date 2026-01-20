import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import toast from 'react-hot-toast';
import { FaCheck, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

type ModeracaoItem = {
  id: string;
  aula_id: string;
  curso_id: string;
  professor_id: string;
  professor_nome: string;
  curso_titulo: string;
  aula_titulo: string;
  conteudo_texto: string;
  palavras_detectadas: string[];
  status: string;
  created_at: string;
};

export default function Moderacao() {
  const [items, setItems] = useState<ModeracaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('conteudo_moderacao')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast.error('Erro ao carregar itens de moderação');
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async (item: ModeracaoItem) => {
    try {
      const { error } = await supabase
        .from('conteudo_moderacao')
        .update({
          status: 'aprovado',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', item.id);

      if (error) throw error;
      setItems(items.filter((i) => i.id !== item.id));
      toast.success('Conteúdo aprovado');
    } catch (error) {
      toast.error('Erro ao aprovar conteúdo');
    }
  };

  const handleRemover = async (item: ModeracaoItem) => {
    if (!confirm('Remover este conteúdo da aula?')) return;

    try {
      const { error: modError } = await supabase
        .from('conteudo_moderacao')
        .update({
          status: 'removido',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', item.id);

      if (modError) throw modError;

      const { error: aulaError } = await supabase
        .from('aulas')
        .update({ conteudo_html: '[Conteúdo removido pela moderação]' })
        .eq('id', item.aula_id);

      if (aulaError) throw aulaError;

      setItems(items.filter((i) => i.id !== item.id));
      toast.success('Conteúdo removido');
    } catch (error) {
      toast.error('Erro ao remover conteúdo');
    }
  };

  const highlightWords = (text: string, words: string[]) => {
    let result = text;
    words.forEach((word) => {
      const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, '<mark class="bg-yellow-300 px-1 rounded">$1</mark>');
    });
    return result;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
          <FaExclamationTriangle className="text-yellow-500" />
          Moderação de Conteúdo
        </h1>
        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
          {items.length} pendente(s)
        </span>
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-12">
          <FaCheck className="text-green-500 text-5xl mx-auto mb-4" />
          <p className="text-lg text-gray-600">Nenhum conteúdo pendente de moderação</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="card border-l-4 border-l-yellow-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{item.aula_titulo || 'Aula sem título'}</h3>
                  <p className="text-sm text-gray-500">
                    Curso: {item.curso_titulo || 'N/A'} | Professor: {item.professor_nome || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAprovar(item)}
                    className="btn-primary text-sm py-1 px-3 flex items-center gap-1"
                  >
                    <FaCheck /> Aprovar
                  </button>
                  <button
                    onClick={() => handleRemover(item)}
                    className="btn-outline text-red-600 border-red-300 hover:bg-red-50 text-sm py-1 px-3 flex items-center gap-1"
                  >
                    <FaTrash /> Remover
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Palavras detectadas:</p>
                <div className="flex flex-wrap gap-1">
                  {item.palavras_detectadas.map((word, i) => (
                    <span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                      {word}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded p-3 max-h-48 overflow-auto">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightWords(
                        item.conteudo_texto.substring(0, 1000) + (item.conteudo_texto.length > 1000 ? '...' : ''),
                        item.palavras_detectadas
                      ),
                    }}
                  />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
