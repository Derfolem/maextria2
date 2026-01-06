import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Module, Lesson } from '../../types';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaSave } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [slug, setSlug] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [moduleQuizzes, setModuleQuizzes] = useState<Record<string, any>>({});
  const [finalQuiz, setFinalQuiz] = useState<any | null>(null);
  const [questionDrafts, setQuestionDrafts] = useState<Record<string, any>>({});
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isEditing) {
      loadCourse();
    }
  }, [id]);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const loadCourse = async () => {
    try {
      const { data: courseData, error } = await supabase
        .from('cursos')
        .select('*, modulos(*, aulas(*))')
        .eq('id', id)
        .maybeSingle();
      if (error || !courseData) throw error;

      setTitle(courseData.titulo || '');
      setDescription(courseData.descricao || '');
      setPrice(courseData.preco_certificado ? String(courseData.preco_certificado) : '');
      setCategory(courseData.categoria || '');
      setLevel(courseData.nivel || '');
      setThumbnail(courseData.imagem_capa_url || '');
      setSlug(courseData.slug || '');
      setTeacherName(courseData.professor_nome || '');
      const mappedModules = (courseData.modulos || [])
        .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((module: any) => ({
          id: module.id,
          course_id: module.curso_id,
          title: module.titulo_modulo,
          description: module.conteudo_texto_html,
          order_index: module.ordem ?? 0,
          lessons: (module.aulas || [])
            .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
            .map((lesson: any) => ({
              id: lesson.id,
              module_id: lesson.modulo_id,
              title: lesson.titulo,
              content: lesson.conteudo_html,
              video_url: lesson.video_url,
              order_index: lesson.ordem ?? 0,
            })),
        }));

      setModules(mappedModules);

      const { data: quizzesData } = await supabase
        .from('questionarios')
        .select('*, questoes(*)')
        .eq('curso_id', id);

      const moduleMap: Record<string, any> = {};
      let final: any | null = null;
      (quizzesData || []).forEach((quiz: any) => {
        if (quiz.tipo === 'final') {
          final = quiz;
          return;
        }
        if (quiz.modulo_id) {
          moduleMap[String(quiz.modulo_id)] = quiz;
        }
      });
      setModuleQuizzes(moduleMap);
      setFinalQuiz(final);
    } catch (error) {
      toast.error('Erro ao carregar curso');
      navigate('/teacher/my-courses');
    }
  };

  const handleSave = async () => {
    if (!title || !description || !price) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!user?.id) {
      toast.error('Usuário não autenticado.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        titulo: title,
        descricao: description,
        preco_certificado: parseFloat(price),
        categoria: category.trim() || null,
        nivel: level || null,
        imagem_capa_url: thumbnail.trim() || null,
        slug: slug || slugify(title),
        professor_nome: teacherName.trim() || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('cursos')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
        toast.success('Curso atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('cursos')
          .insert({
            ...payload,
            ativo: false,
            professor_id: user.id,
            professor_nome: teacherName.trim() || user.name || null,
          })
          .select('id')
          .single();
        if (error) throw error;
        toast.success('Curso criado com sucesso!');
        navigate(`/teacher/course/${data.id}/edit`);
        return;
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar curso');
    } finally {
      setLoading(false);
    }
  };

  const addModule = async () => {
    if (!isEditing) {
      toast.error('Salve o curso antes de adicionar módulos');
      return;
    }
    if (!id) {
      toast.error('Curso inválido.');
      return;
    }

    try {
      const { data: newModule, error } = await supabase
        .from('modulos')
        .insert({
          curso_id: id,
          titulo_modulo: 'Novo Módulo',
          conteudo_texto_html: '',
          ordem: modules.length + 1,
        })
        .select('id')
        .single();
      if (error) throw error;
      setModules([
        ...modules,
        {
          id: newModule.id,
          course_id: id,
          title: 'Novo Módulo',
          description: '',
          order_index: modules.length + 1,
          lessons: [],
        },
      ]);
      toast.success('Módulo adicionado!');
      if (modules.length === 0) {
        navigate('/teacher/my-courses');
      }
    } catch (error) {
      toast.error('Erro ao adicionar módulo');
    }
  };

  const updateModuleState = (moduleId: string | number, data: Partial<Module>) => {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, ...data } : m)));
  };

  const updateModule = async (moduleId: string | number, data: Partial<Module>) => {
    try {
      const payload: Record<string, any> = {};
      if (data.title !== undefined) payload.titulo_modulo = data.title;
      if (data.description !== undefined) payload.conteudo_texto_html = data.description;
      if (data.order_index !== undefined) payload.ordem = data.order_index;
      const { error } = await supabase
        .from('modulos')
        .update(payload)
        .eq('id', moduleId);
      if (error) throw error;
    } catch (error) {
      toast.error('Erro ao atualizar módulo');
    }
  };

  const deleteModule = async (moduleId: string | number) => {
    if (!confirm('Excluir este módulo e todas as suas aulas?')) return;

    try {
      const { error } = await supabase
        .from('modulos')
        .delete()
        .eq('id', moduleId);
      if (error) throw error;
      setModules(modules.filter((m) => m.id !== moduleId));
      toast.success('Módulo excluído!');
    } catch (error) {
      toast.error('Erro ao excluir módulo');
    }
  };

  const addLesson = async (moduleId: string | number) => {
    try {
      const module = modules.find((m) => m.id === moduleId);
      const { data: newLesson, error } = await supabase
        .from('aulas')
        .insert({
          modulo_id: moduleId,
          titulo: 'Nova Aula',
          conteudo_html: '',
          video_url: '',
          ordem: (module?.lessons?.length || 0) + 1,
        })
        .select('id')
        .single();
      if (error) throw error;
      setModules(
        modules.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: [
                  ...(m.lessons || []),
                  {
                    id: newLesson.id,
                    module_id: moduleId,
                    title: 'Nova Aula',
                    content: '',
                    video_url: '',
                    order_index: (module?.lessons?.length || 0) + 1,
                  },
                ],
              }
            : m
        )
      );
      toast.success('Aula adicionada!');
    } catch (error) {
      toast.error('Erro ao adicionar aula');
    }
  };

  const updateLessonState = (lessonId: string | number, data: Partial<Lesson>) => {
    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        lessons: m.lessons?.map((l) => (l.id === lessonId ? { ...l, ...data } : l)),
      }))
    );
  };

  const updateLesson = async (lessonId: string | number, data: Partial<Lesson>) => {
    try {
      const payload: Record<string, any> = {};
      if (data.title !== undefined) payload.titulo = data.title;
      if (data.content !== undefined) payload.conteudo_html = data.content;
      if (data.video_url !== undefined) payload.video_url = data.video_url;
      if (data.order_index !== undefined) payload.ordem = data.order_index;
      const { error } = await supabase
        .from('aulas')
        .update(payload)
        .eq('id', lessonId);
      if (error) throw error;
    } catch (error) {
      toast.error('Erro ao atualizar aula');
    }
  };

  const deleteLesson = async (moduleId: string | number, lessonId: string | number) => {
    if (!confirm('Excluir esta aula?')) return;

    try {
      const { error } = await supabase
        .from('aulas')
        .delete()
        .eq('id', lessonId);
      if (error) throw error;
      setModules(
        modules.map((m) =>
          m.id === moduleId
            ? { ...m, lessons: m.lessons?.filter((l) => l.id !== lessonId) }
            : m
        )
      );
      toast.success('Aula excluída!');
    } catch (error) {
      toast.error('Erro ao excluir aula');
    }
  };

  const addMaterial = async (lessonId: string | number) => {
    void lessonId;
    toast.error('Materiais de apoio ainda nao estao configurados.');
  };

  const ensureModuleQuiz = async (moduleId: string, moduleTitle: string) => {
    if (!id) return;
    if (moduleQuizzes[moduleId]) return;
    try {
      const { data, error } = await supabase
        .from('questionarios')
        .insert({
          curso_id: id,
          modulo_id: moduleId,
          titulo: `Questionário do módulo: ${moduleTitle}`,
          tipo: 'modulo',
        })
        .select('*, questoes(*)')
        .single();
      if (error) throw error;
      setModuleQuizzes((prev) => ({ ...prev, [moduleId]: data }));
      toast.success('Questionário criado.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar questionário.');
    }
  };

  const ensureFinalQuiz = async () => {
    if (!id) return;
    if (finalQuiz) return;
    try {
      const { data, error } = await supabase
        .from('questionarios')
        .insert({
          curso_id: id,
          titulo: 'Prova final',
          tipo: 'final',
        })
        .select('*, questoes(*)')
        .single();
      if (error) throw error;
      setFinalQuiz(data);
      toast.success('Prova final criada.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar prova final.');
    }
  };

  const addQuestion = async (quizId: string, draft: any) => {
    const { enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, correta } = draft;
    if (!enunciado || !alternativa_a || !alternativa_b || !alternativa_c || !alternativa_d) {
      toast.error('Preencha todas as alternativas.');
      return;
    }
    if (!['a', 'b', 'c', 'd'].includes(String(correta).toLowerCase())) {
      toast.error('Informe a alternativa correta como a, b, c ou d.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('questoes')
        .insert({
          questionario_id: quizId,
          enunciado,
          alternativa_a,
          alternativa_b,
          alternativa_c,
          alternativa_d,
          correta: String(correta).toLowerCase(),
        })
        .select('*')
        .single();
      if (error) throw error;

      setModuleQuizzes((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key]?.id === quizId) {
            next[key] = {
              ...next[key],
              questoes: [...(next[key].questoes || []), data],
            };
          }
        });
        return next;
      });

      if (finalQuiz?.id === quizId) {
        setFinalQuiz({
          ...finalQuiz,
          questoes: [...(finalQuiz.questoes || []), data],
        });
      }

      setQuestionDrafts((prev) => {
        const next = { ...prev };
        delete next[quizId];
        return next;
      });
      toast.success('Questão adicionada.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao adicionar questão.');
    }
  };

  const updateQuestionDraft = (quizId: string, field: string, value: string) => {
    setQuestionDrafts((prev) => ({
      ...prev,
      [quizId]: {
        enunciado: '',
        alternativa_a: '',
        alternativa_b: '',
        alternativa_c: '',
        alternativa_d: '',
        correta: 'a',
        ...(prev[quizId] || {}),
        [field]: value,
      },
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">
          {isEditing ? 'Editar Curso' : 'Criar Novo Curso'}
        </h1>
        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center space-x-2">
          <FaSave />
          <span>{loading ? 'Salvando...' : 'Salvar Curso'}</span>
        </button>
      </div>

      <div className="space-y-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Curso *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Ex: Desenvolvimento Web Completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-field"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
                placeholder="Ex: Programação"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível
              </label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-field">
                <option value="">Selecione</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem
              </label>
              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                className="input-field"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Descreva seu curso..."
              />
            </div>

            {user?.role === 'admin' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do professor exibido
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Equipe MAEXTRIA"
                />
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <>
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Módulos e Aulas</h2>
                <button onClick={addModule} className="btn-primary flex items-center space-x-2">
                  <FaPlus />
                  <span>Adicionar Módulo</span>
                </button>
              </div>

              {modules.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum módulo criado. Clique em "Adicionar Módulo" para começar.
                </p>
              ) : (
                <div className="space-y-6">
                  {modules.map((module) => (
                    <div key={module.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-grow mr-4">
                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) => updateModuleState(module.id, { title: e.target.value })}
                            onBlur={(e) => updateModule(module.id, { title: e.target.value })}
                            className="input-field font-semibold mb-2"
                            placeholder="Título do módulo"
                          />
                          <textarea
                            value={module.description || ''}
                            onChange={(e) => updateModuleState(module.id, { description: e.target.value })}
                            onBlur={(e) => updateModule(module.id, { description: e.target.value })}
                            className="input-field"
                            rows={2}
                            placeholder="Descrição do módulo"
                          />
                        </div>
                        <button
                          onClick={() => deleteModule(module.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div className="ml-4">
                        <button
                          onClick={() => addLesson(module.id)}
                          className="btn-secondary mb-3 flex items-center space-x-1 text-sm"
                        >
                          <FaPlus />
                          <span>Adicionar Aula</span>
                        </button>

                        <div className="mb-4">
                          {moduleQuizzes[String(module.id)] ? (
                            <div className="flex flex-wrap items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                              <span>Questionário do módulo configurado.</span>
                              <button
                                type="button"
                                onClick={() => updateQuestionDraft(moduleQuizzes[String(module.id)].id, 'enunciado', '')}
                                className="btn-outline text-xs"
                              >
                                Adicionar questão
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => ensureModuleQuiz(String(module.id), module.title)}
                              className="btn-outline text-xs"
                            >
                              Criar questionário do módulo
                            </button>
                          )}
                        </div>

                        {moduleQuizzes[String(module.id)] &&
                          questionDrafts[moduleQuizzes[String(module.id)].id] && (
                            <div className="border border-[hsl(var(--border))] rounded-[12px] p-4 mb-4 bg-white">
                              <h4 className="font-semibold mb-3">Nova questão</h4>
                              <textarea
                                value={questionDrafts[moduleQuizzes[String(module.id)].id].enunciado || ''}
                                onChange={(event) =>
                                  updateQuestionDraft(moduleQuizzes[String(module.id)].id, 'enunciado', event.target.value)
                                }
                                className="input-field mb-3"
                                rows={2}
                                placeholder="Enunciado"
                              />
                              {(['a', 'b', 'c', 'd'] as const).map((key) => (
                                <input
                                  key={key}
                                  type="text"
                                  value={questionDrafts[moduleQuizzes[String(module.id)].id][`alternativa_${key}`] || ''}
                                  onChange={(event) =>
                                    updateQuestionDraft(
                                      moduleQuizzes[String(module.id)].id,
                                      `alternativa_${key}`,
                                      event.target.value
                                    )
                                  }
                                  className="input-field mb-2"
                                  placeholder={`Alternativa ${key.toUpperCase()}`}
                                />
                              ))}
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <select
                                  value={questionDrafts[moduleQuizzes[String(module.id)].id].correta || 'a'}
                                  onChange={(event) =>
                                    updateQuestionDraft(moduleQuizzes[String(module.id)].id, 'correta', event.target.value)
                                  }
                                  className="input-field text-sm max-w-[160px]"
                                >
                                  <option value="a">Correta: A</option>
                                  <option value="b">Correta: B</option>
                                  <option value="c">Correta: C</option>
                                  <option value="d">Correta: D</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    addQuestion(
                                      moduleQuizzes[String(module.id)].id,
                                      questionDrafts[moduleQuizzes[String(module.id)].id]
                                    )
                                  }
                                  className="btn-accent text-xs"
                                >
                                  Salvar questão
                                </button>
                              </div>
                            </div>
                          )}

                        {module.lessons?.map((lesson) => (
                          <div key={lesson.id} className="bg-white border rounded-lg p-4 mb-3">
                            <div className="flex justify-between items-start mb-3">
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => updateLessonState(lesson.id, { title: e.target.value })}
                                onBlur={(e) => updateLesson(lesson.id, { title: e.target.value })}
                                className="input-field flex-grow mr-2"
                                placeholder="Título da aula"
                              />
                              <button
                                onClick={() => deleteLesson(module.id, lesson.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <FaTrash />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={lesson.video_url || ''}
                              onChange={(e) => updateLessonState(lesson.id, { video_url: e.target.value })}
                              onBlur={(e) => updateLesson(lesson.id, { video_url: e.target.value })}
                              className="input-field mb-2"
                              placeholder="URL do vídeo (YouTube, Vimeo, etc.)"
                            />

                            <textarea
                              value={lesson.content || ''}
                              onChange={(e) => updateLessonState(lesson.id, { content: e.target.value })}
                              onBlur={(e) => updateLesson(lesson.id, { content: e.target.value })}
                              className="input-field mb-2"
                              rows={3}
                              placeholder="Conteúdo da aula (texto, HTML)"
                            />

                            <div className="mt-3">
                              <button
                                onClick={() => addMaterial(lesson.id)}
                                className="text-[hsl(var(--muted-foreground))] text-sm flex items-center space-x-1 cursor-not-allowed"
                                disabled
                              >
                                <FaPlus />
                                <span>Materiais de apoio (em breve)</span>
                              </button>

                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Prova final</h2>
                {finalQuiz ? (
                  <button
                    type="button"
                    onClick={() => updateQuestionDraft(finalQuiz.id, 'enunciado', '')}
                    className="btn-outline text-xs"
                  >
                    Adicionar questão
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={ensureFinalQuiz}
                    className="btn-outline text-xs"
                  >
                    Criar prova final
                  </button>
                )}
              </div>
              {finalQuiz && questionDrafts[finalQuiz.id] && (
                <div className="border border-[hsl(var(--border))] rounded-[12px] p-4 mb-4 bg-white">
                  <h4 className="font-semibold mb-3">Nova questão</h4>
                  <textarea
                    value={questionDrafts[finalQuiz.id].enunciado || ''}
                    onChange={(event) => updateQuestionDraft(finalQuiz.id, 'enunciado', event.target.value)}
                    className="input-field mb-3"
                    rows={2}
                    placeholder="Enunciado"
                  />
                  {(['a', 'b', 'c', 'd'] as const).map((key) => (
                    <input
                      key={key}
                      type="text"
                      value={questionDrafts[finalQuiz.id][`alternativa_${key}`] || ''}
                      onChange={(event) =>
                        updateQuestionDraft(finalQuiz.id, `alternativa_${key}`, event.target.value)
                      }
                      className="input-field mb-2"
                      placeholder={`Alternativa ${key.toUpperCase()}`}
                    />
                  ))}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <select
                      value={questionDrafts[finalQuiz.id].correta || 'a'}
                      onChange={(event) => updateQuestionDraft(finalQuiz.id, 'correta', event.target.value)}
                      className="input-field text-sm max-w-[160px]"
                    >
                      <option value="a">Correta: A</option>
                      <option value="b">Correta: B</option>
                      <option value="c">Correta: C</option>
                      <option value="d">Correta: D</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => addQuestion(finalQuiz.id, questionDrafts[finalQuiz.id])}
                      className="btn-accent text-xs"
                    >
                      Salvar questão
                    </button>
                  </div>
                </div>
              )}
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                A prova final só fica disponível para o aluno após concluir todas as aulas.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
