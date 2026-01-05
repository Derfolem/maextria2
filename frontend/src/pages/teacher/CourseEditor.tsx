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
          .insert({ ...payload, ativo: false, professor_id: user.id })
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
    } catch (error) {
      toast.error('Erro ao adicionar módulo');
    }
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
      setModules(modules.map((m) => (m.id === moduleId ? { ...m, ...data } : m)));
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
      setModules(
        modules.map((m) => ({
          ...m,
          lessons: m.lessons?.map((l) => (l.id === lessonId ? { ...l, ...data } : l)),
        }))
      );
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
    toast.error('Materiais ainda nao estao disponiveis no Supabase.');
  };

  const deleteMaterial = async (lessonId: string | number, materialId: string | number) => {
    void lessonId;
    void materialId;
    toast.error('Materiais ainda nao estao disponiveis no Supabase.');
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
                            onChange={(e) => updateModule(module.id, { title: e.target.value })}
                            className="input-field font-semibold mb-2"
                            placeholder="Título do módulo"
                          />
                          <textarea
                            value={module.description || ''}
                            onChange={(e) => updateModule(module.id, { description: e.target.value })}
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

                        {module.lessons?.map((lesson) => (
                          <div key={lesson.id} className="bg-white border rounded-lg p-4 mb-3">
                            <div className="flex justify-between items-start mb-3">
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
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
                              onChange={(e) => updateLesson(lesson.id, { video_url: e.target.value })}
                              className="input-field mb-2"
                              placeholder="URL do vídeo (YouTube, Vimeo, etc.)"
                            />

                            <textarea
                              value={lesson.content || ''}
                              onChange={(e) => updateLesson(lesson.id, { content: e.target.value })}
                              className="input-field mb-2"
                              rows={3}
                              placeholder="Conteúdo da aula (texto, HTML)"
                            />

                            <div className="mt-3">
                              <button
                                onClick={() => addMaterial(lesson.id)}
                                className="text-purple-600 hover:text-purple-700 text-sm flex items-center space-x-1"
                              >
                                <FaPlus />
                                <span>Adicionar Material</span>
                              </button>

                              {lesson.materials && lesson.materials.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {lesson.materials.map((material) => (
                                    <div
                                      key={material.id}
                                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                    >
                                      <span className="text-sm">{material.title}</span>
                                      <button
                                        onClick={() => deleteMaterial(lesson.id, material.id)}
                                        className="text-red-600 hover:text-red-700 text-sm"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
