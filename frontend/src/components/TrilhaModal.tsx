import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaTrash } from 'react-icons/fa';
import { Course, Trilha } from '../types';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface TrilhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  courses: Course[];
  trilha?: Trilha | null;
  professorId: string;
}

export default function TrilhaModal({
  isOpen,
  onClose,
  onSave,
  courses,
  trilha,
  professorId,
}: TrilhaModalProps) {
  const [nome, setNome] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isEditing = !!trilha;
  const MAX_CURSOS = 5;

  useEffect(() => {
    if (trilha) {
      setNome(trilha.nome);
      setSelectedCourses(trilha.cursos?.map(tc => tc.curso_id) || []);
    } else {
      setNome('');
      setSelectedCourses([]);
    }
  }, [trilha, isOpen]);

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      }
      if (prev.length >= MAX_CURSOS) {
        toast.error(`Limite de ${MAX_CURSOS} cursos por trilha`);
        return prev;
      }
      return [...prev, courseId];
    });
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error('Digite um nome para a trilha');
      return;
    }
    if (selectedCourses.length === 0) {
      toast.error('Selecione pelo menos um curso');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && trilha) {
        // Atualizar trilha existente
        const { error: updateError } = await supabase
          .from('trilhas')
          .update({ nome: nome.trim(), atualizado_em: new Date().toISOString() })
          .eq('id', trilha.id);

        if (updateError) throw updateError;

        // Remover cursos antigos
        await supabase
          .from('trilha_cursos')
          .delete()
          .eq('trilha_id', trilha.id);

        // Inserir novos cursos
        const cursosToInsert = selectedCourses.map((cursoId, index) => ({
          trilha_id: trilha.id,
          curso_id: cursoId,
          ordem: index,
        }));

        const { error: insertError } = await supabase
          .from('trilha_cursos')
          .insert(cursosToInsert);

        if (insertError) throw insertError;

        toast.success('Trilha atualizada com sucesso!');
      } else {
        // Criar nova trilha
        const { data: newTrilha, error: trilhaError } = await supabase
          .from('trilhas')
          .insert({
            nome: nome.trim(),
            professor_id: professorId,
            ativa: true,
          })
          .select()
          .single();

        if (trilhaError) throw trilhaError;

        // Inserir cursos na trilha
        const cursosToInsert = selectedCourses.map((cursoId, index) => ({
          trilha_id: newTrilha.id,
          curso_id: cursoId,
          ordem: index,
        }));

        const { error: insertError } = await supabase
          .from('trilha_cursos')
          .insert(cursosToInsert);

        if (insertError) throw insertError;

        toast.success('Trilha criada com sucesso!');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar trilha:', error);
      if (error?.message?.includes('Limite de 3 trilhas')) {
        toast.error('Limite de 3 trilhas ativas atingido');
      } else {
        toast.error(error?.message || 'Erro ao salvar trilha');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!trilha || !confirm('Tem certeza que deseja excluir esta trilha?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('trilhas')
        .delete()
        .eq('id', trilha.id);

      if (error) throw error;

      toast.success('Trilha excluída com sucesso!');
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir trilha');
    } finally {
      setSaving(false);
    }
  };

  // Filtrar apenas cursos publicados
  const publishedCourses = courses.filter(c => c.is_published);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[hsl(var(--card))] rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Editar Trilha' : 'Criar Trilha'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Nome da trilha */}
              <div>
                <label className="block text-sm font-medium mb-2">Nome da Trilha</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Desenvolvimento Web Completo"
                  className="input-field w-full"
                  maxLength={100}
                />
              </div>

              {/* Seletor de cursos */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cursos ({selectedCourses.length}/{MAX_CURSOS})
                </label>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                  Selecione os cursos que compoem esta trilha (apenas publicados)
                </p>

                {publishedCourses.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] p-4 bg-[hsl(var(--muted))] rounded-lg">
                    Voce ainda nao tem cursos publicados para adicionar a uma trilha
                  </p>
                ) : (
                  <div className="space-y-2">
                    {publishedCourses.map(course => {
                      const isSelected = selectedCourses.includes(String(course.id));
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => toggleCourse(String(course.id))}
                          className={`w-full text-left p-3 rounded-lg border transition flex items-center gap-3 ${
                            isSelected
                              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
                              : 'border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground))]'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]'
                                : 'border-[hsl(var(--muted-foreground))]'
                            }`}
                          >
                            {isSelected && <FaCheck className="text-white text-xs" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{course.title}</p>
                            {course.duration_hours && (
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                {course.duration_hours}h de duracao
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-[hsl(var(--border))]">
              <div>
                {isEditing && (
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="btn-outline border-red-400 text-red-500 hover:bg-red-500 hover:text-white flex items-center gap-2"
                  >
                    <FaTrash />
                    <span>Excluir</span>
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || selectedCourses.length === 0 || !nome.trim()}
                  className="btn-accent"
                >
                  {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Trilha'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
