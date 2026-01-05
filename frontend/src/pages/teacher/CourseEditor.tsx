import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Module, Lesson } from '../../types';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaSave } from 'react-icons/fa';
import { normalizeCourse } from '../../lib/normalizeCourse';

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
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadCourse();
    }
  }, [id]);

  const resolveCategoryId = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return undefined;

    const response = await api.get('/categories');
    const existing = response.data.find(
      (category: any) => category.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      return existing.id;
    }

    const created = await api.post('/categories', { name: trimmed });
    return created.data.id;
  };

  const loadCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      const course = normalizeCourse(response.data);
      setTitle(course.title);
      setDescription(course.description);
      setPrice(course.price.toString());
      setCategory(course.category || '');
      const levelMap: Record<string, string> = {
        beginner: 'Iniciante',
        intermediate: 'Intermediário',
        advanced: 'Avançado',
      };
      setLevel(levelMap[course.level || ''] || course.level || '');
      setThumbnail(course.thumbnail || '');
      const mappedModules = (response.data.modules || []).map((module: any) => ({
        ...module,
        lessons: (module.lessons || []).map((lesson: any) => ({
          ...lesson,
          materials: (lesson.materials || []).map((material: any) => ({
            ...material,
            url: material.file_url ?? material.url,
            type: material.file_type ?? material.type ?? 'link',
          })),
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

    setLoading(true);
    try {
      let categoryId: string | undefined;
      if (category.trim()) {
        categoryId = await resolveCategoryId(category);
      }

      const difficultyMap: Record<string, string> = {
        Iniciante: 'beginner',
        Intermediário: 'intermediate',
        Avançado: 'advanced',
      };
      const difficulty = level ? difficultyMap[level] || level : undefined;

      const courseData = {
        title,
        description,
        certificate_price: parseFloat(price),
        category_id: categoryId,
        difficulty,
        cover_image: thumbnail,
      };

      if (isEditing) {
        await api.put(`/courses/${id}`, courseData);
        toast.success('Curso atualizado com sucesso!');
      } else {
        const response = await api.post('/courses', courseData);
        toast.success('Curso criado com sucesso!');
        navigate(`/teacher/course/${response.data.id}/edit`);
        return;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar curso');
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
      const response = await api.post('/modules', {
        course_id: id,
        title: 'Novo Módulo',
        description: '',
        order_index: modules.length,
      });
      setModules([
        ...modules,
        {
          id: response.data.id,
          course_id: id,
          title: 'Novo Módulo',
          description: '',
          order_index: modules.length,
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
      await api.put(`/modules/${moduleId}`, data);
      setModules(modules.map((m) => (m.id === moduleId ? { ...m, ...data } : m)));
    } catch (error) {
      toast.error('Erro ao atualizar módulo');
    }
  };

  const deleteModule = async (moduleId: string | number) => {
    if (!confirm('Excluir este módulo e todas as suas aulas?')) return;

    try {
      await api.delete(`/modules/${moduleId}`);
      setModules(modules.filter((m) => m.id !== moduleId));
      toast.success('Módulo excluído!');
    } catch (error) {
      toast.error('Erro ao excluir módulo');
    }
  };

  const addLesson = async (moduleId: string | number) => {
    try {
      const module = modules.find((m) => m.id === moduleId);
      const response = await api.post(`/modules/${moduleId}/lessons`, {
        title: 'Nova Aula',
        content: '',
        video_url: '',
        order_index: module?.lessons?.length || 0,
      });
      setModules(
        modules.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: [
                  ...(m.lessons || []),
                  {
                    id: response.data.id,
                    module_id: moduleId,
                    title: 'Nova Aula',
                    content: '',
                    video_url: '',
                    order_index: module?.lessons?.length || 0,
                    materials: [],
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
      await api.put(`/modules/lessons/${lessonId}`, data);
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
      await api.delete(`/modules/lessons/${lessonId}`);
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
    const title = prompt('Título do material:');
    const url = prompt('URL do material:');
    if (!title || !url) return;

    try {
      const response = await api.post(`/modules/lessons/${lessonId}/materials`, {
        title,
        file_url: url,
        file_type: 'link',
      });
      setModules(
        modules.map((m) => ({
          ...m,
          lessons: m.lessons?.map((l) =>
            l.id === lessonId
              ? {
                  ...l,
                  materials: [
                    ...(l.materials || []),
                    {
                      id: response.data.id,
                      lesson_id: lessonId,
                      title,
                      type: 'link',
                      url,
                    },
                  ],
                }
              : l
          ),
        }))
      );
      toast.success('Material adicionado!');
    } catch (error) {
      toast.error('Erro ao adicionar material');
    }
  };

  const deleteMaterial = async (lessonId: string | number, materialId: string | number) => {
    try {
      await api.delete(`/modules/materials/${materialId}`);
      setModules(
        modules.map((m) => ({
          ...m,
          lessons: m.lessons?.map((l) =>
            l.id === lessonId
              ? { ...l, materials: l.materials?.filter((mat) => mat.id !== materialId) }
              : l
          ),
        }))
      );
      toast.success('Material excluído!');
    } catch (error) {
      toast.error('Erro ao excluir material');
    }
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
