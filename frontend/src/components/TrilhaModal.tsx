import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaTrash, FaSearch } from 'react-icons/fa';
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
  isAdmin?: boolean;
}

export default function TrilhaModal({
  isOpen,
  onClose,
  onSave,
  courses,
  trilha,
  professorId,
  isAdmin = false,
}: TrilhaModalProps) {
  const [nome, setNome] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const isEditing = !!trilha;
  const MAX_CURSOS = isAdmin ? 999 : 5;

  // Extrair categorias unicas dos cursos
  const categories = useMemo(() => {
    const cats = new Set<string>();
    courses.forEach(c => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats).sort();
  }, [courses]);

  // Filtrar cursos publicados com base nos filtros
  const filteredCourses = useMemo(() => {
    let result = courses.filter(c => c.is_published);

    // Filtrar por palavra-chave
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      result = result.filter(c => {
        const title = (c.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const desc = (c.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return title.includes(term) || desc.includes(term) || cat.includes(term);
      });
    }

    // Filtrar por categoria
    if (selectedCategory) {
      result = result.filter(c => c.category === selectedCategory);
    }

    return result;
  }, [courses, searchTerm, selectedCategory]);

  useEffect(() => {
    if (trilha) {
      setNome(trilha.nome);
      setSelectedCourses(trilha.cursos?.map(tc => tc.curso_id) || []);
    } else {
      setNome('');
      setSelectedCourses([]);
    }
    // Limpar filtros ao abrir
    setSearchTerm('');
    setSelectedCategory('');
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
        const { error: updateError } = await supabase
          .from('trilhas')
          .update({ nome: nome.trim(), atualizado_em: new Date().toISOString() })
          .eq('id', trilha.id);

        if (updateError) throw updateError;

        await supabase
          .from('trilha_cursos')
          .delete()
          .eq('trilha_id', trilha.id);

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

      toast.success('Trilha excluida com sucesso!');
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir trilha');
    } finally {
      setSaving(false);
    }
  };

  // Cursos selecionados (para mostrar no topo)
  const selectedCoursesData = courses.filter(c => selectedCourses.includes(String(c.id)));

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
            className="bg-[hsl(var(--card))] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
              <h2 className="text-xl font-semibold text-[hsl(var(--member-strong))]">
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
                <label className="block text-sm font-medium mb-2 text-[hsl(var(--member-strong))]">
                  Nome da Trilha
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Desenvolvimento Web Completo"
                  className="input-field w-full text-[hsl(var(--member-strong))]"
                  maxLength={100}
                />
              </div>

              {/* Cursos selecionados */}
              {selectedCoursesData.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-[hsl(var(--member-strong))]">
                    Cursos selecionados ({selectedCourses.length}{isAdmin ? '' : `/${MAX_CURSOS}`})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCoursesData.map(course => (
                      <span
                        key={course.id}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm"
                      >
                        <span className="truncate max-w-[150px]">{course.title}</span>
                        <button
                          type="button"
                          onClick={() => toggleCourse(String(course.id))}
                          className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtros de cursos */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[hsl(var(--member-strong))]">
                  Adicionar cursos
                </label>
                <p className="text-xs text-[hsl(var(--member-strong))] mb-3">
                  {isAdmin
                    ? 'Busque e selecione cursos de qualquer professor'
                    : 'Busque e selecione seus cursos publicados'
                  }
                </p>

                {/* Busca por palavra-chave */}
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--member-strong))]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou descricao..."
                    className="input-field w-full pl-10 text-[hsl(var(--member-strong))]"
                  />
                </div>

                {/* Filtro por categoria (tags) */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('')}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        selectedCategory === ''
                          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                          : 'bg-[hsl(var(--muted))] text-[hsl(var(--member-strong))] hover:bg-[hsl(var(--border))]'
                      }`}
                    >
                      Todas
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          selectedCategory === cat
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                            : 'bg-[hsl(var(--muted))] text-[hsl(var(--member-strong))] hover:bg-[hsl(var(--border))]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Lista de cursos filtrados */}
                {filteredCourses.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--member-strong))] p-4 bg-[hsl(var(--muted))] rounded-lg text-center">
                    {searchTerm || selectedCategory
                      ? 'Nenhum curso encontrado com os filtros aplicados'
                      : 'Nenhum curso publicado disponivel'
                    }
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {filteredCourses.map(course => {
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
                            className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]'
                                : 'border-[hsl(var(--muted-foreground))]'
                            }`}
                          >
                            {isSelected && <FaCheck className="text-white text-xs" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-[hsl(var(--member-strong))]">
                              {course.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                              {course.category && (
                                <span className="px-1.5 py-0.5 bg-[hsl(var(--muted))] text-[hsl(var(--member-strong))] rounded">
                                  {course.category}
                                </span>
                              )}
                              {course.duration_hours && (
                                <span>{course.duration_hours}h</span>
                              )}
                              {isAdmin && course.teacher_name && (
                                <span>• {course.teacher_name}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <p className="text-xs text-[hsl(var(--member-strong))] mt-2">
                  {filteredCourses.length} curso(s) encontrado(s)
                </p>
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
