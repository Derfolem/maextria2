import { useEffect, useState } from 'react';
import { Trilha, Course } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { FaPlus, FaEdit, FaTrash, FaRoute } from 'react-icons/fa';
import { normalizeCourse } from '../../lib/normalizeCourse';
import TrilhaModal from '../../components/TrilhaModal';
import toast from 'react-hot-toast';

export default function AdminTrilhas() {
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [trilhaModal, setTrilhaModal] = useState(false);
  const [editingTrilha, setEditingTrilha] = useState<Trilha | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar todas as trilhas
      const { data: trilhasData, error: trilhasError } = await supabase
        .from('trilhas')
        .select(`
          *,
          trilha_cursos(
            *,
            cursos(*)
          )
        `)
        .order('criado_em', { ascending: false });

      if (trilhasError) throw trilhasError;

      const trilhasNormalizadas = (trilhasData || []).map(t => ({
        ...t,
        cursos: t.trilha_cursos?.map((tc: any) => ({
          ...tc,
          curso: tc.cursos ? normalizeCourse(tc.cursos) : null,
        })) || [],
      }));

      setTrilhas(trilhasNormalizadas);

      // Carregar todos os cursos publicados
      const { data: coursesData, error: coursesError } = await supabase
        .from('cursos')
        .select('*')
        .eq('ativo', true)
        .order('titulo');

      if (coursesError) throw coursesError;

      setCourses((coursesData || []).map(normalizeCourse));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar trilhas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (trilhaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta trilha?')) return;

    try {
      const { error } = await supabase
        .from('trilhas')
        .delete()
        .eq('id', trilhaId);

      if (error) throw error;

      toast.success('Trilha excluida com sucesso!');
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir trilha');
    }
  };

  const toggleAtiva = async (trilha: Trilha) => {
    try {
      const { error } = await supabase
        .from('trilhas')
        .update({ ativa: !trilha.ativa })
        .eq('id', trilha.id);

      if (error) throw error;

      toast.success(trilha.ativa ? 'Trilha desativada' : 'Trilha ativada');
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar trilha');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Admin</p>
          <h1 className="headline-font text-4xl md:text-5xl">Gerenciar Trilhas</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            Crie trilhas com qualquer curso da plataforma, sem limite
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTrilha(null);
            setTrilhaModal(true);
          }}
          className="btn-accent flex items-center gap-2"
        >
          <FaPlus />
          <span>Nova Trilha</span>
        </button>
      </div>

      {trilhas.length === 0 ? (
        <div className="card text-center py-12">
          <FaRoute className="text-4xl text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            Nenhuma trilha criada ainda
          </p>
          <button
            onClick={() => {
              setEditingTrilha(null);
              setTrilhaModal(true);
            }}
            className="btn-accent"
          >
            Criar primeira trilha
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {trilhas.map((trilha) => (
            <div key={trilha.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FaRoute className="text-orange-500" />
                    <h3 className="text-xl font-semibold">{trilha.nome}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      trilha.ativa
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {trilha.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
                    {trilha.cursos?.length || 0} curso(s) • Criada em {new Date(trilha.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {trilha.cursos?.slice(0, 5).map((tc: any) => (
                      <span
                        key={tc.id}
                        className="px-2 py-1 text-xs bg-[hsl(var(--muted))] rounded truncate max-w-[150px]"
                        title={tc.curso?.title}
                      >
                        {tc.curso?.title || 'Curso'}
                      </span>
                    ))}
                    {(trilha.cursos?.length || 0) > 5 && (
                      <span className="px-2 py-1 text-xs bg-[hsl(var(--muted))] rounded">
                        +{(trilha.cursos?.length || 0) - 5} mais
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleAtiva(trilha)}
                    className="btn-outline text-sm"
                  >
                    {trilha.ativa ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingTrilha(trilha);
                      setTrilhaModal(true);
                    }}
                    className="btn-outline flex items-center gap-1"
                  >
                    <FaEdit />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(trilha.id)}
                    className="btn-outline border-red-400 text-red-500 hover:bg-red-500 hover:text-white flex items-center gap-1"
                  >
                    <FaTrash />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TrilhaModal
        isOpen={trilhaModal}
        onClose={() => {
          setTrilhaModal(false);
          setEditingTrilha(null);
        }}
        onSave={loadData}
        courses={courses}
        trilha={editingTrilha}
        professorId={String(user?.id || '')}
        isAdmin={true}
      />
    </div>
  );
}
