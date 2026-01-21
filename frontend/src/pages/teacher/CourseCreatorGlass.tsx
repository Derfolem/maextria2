// frontend/src/pages/teacher/CourseCreatorGlass.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaMagic, FaImage, FaVideo } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { parseCourseText } from '../../lib/courseTextParser'; // Import the parser
import api from '../../lib/api'; // Import the custom API client
import { Course as CourseType } from '../../types'; // Alias to avoid confusion with parsedCourse

// Determine if local auth should be used (copied from store.ts for consistency)
const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

export default function CourseCreatorGlass() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [thumbnail, setThumbnail] = useState(''); // Only editable by admin
  const [teacherName, setTeacherName] = useState(user?.name || '');

  // State for the raw text input for the extractor
  const [rawCourseText, setRawCourseText] = useState('');
  // State for parsed course structure (to be populated by the extractor)
  const [parsedCourse, setParsedCourse] = useState<CourseType | null>(null);

  useEffect(() => {
    if (user?.name && !teacherName) {
      setTeacherName(user.name);
    }
  }, [user?.name, teacherName]);

  const handleSaveCourse = async () => {
    if (!parsedCourse) {
      toast.error('Nenhum curso extraído para salvar. Por favor, cole e extraia o texto primeiro.');
      return;
    }
    if (!user?.id) {
      toast.error('Usuário não autenticado.');
      return;
    }
    if (!parsedCourse.title || !parsedCourse.description || !parsedCourse.price) {
      toast.error('Informações básicas do curso (Título, Descrição, Preço) são obrigatórias.');
      return;
    }

    try {
      let finalCategoryId = null;
      if (parsedCourse.category) {
        // Fetch categories to get the ID from the name
        let categoryData: { id: string, name: string }[] = [];
        if (USE_LOCAL_AUTH) {
          const { data } = await api.get('/categories'); // Assuming GET /api/categories exists
          categoryData = data;
        } else {
          const { data } = await supabase.from('categories').select('id, name');
          categoryData = data || [];
        }
        const existingCategory = categoryData.find((cat: any) => cat.name.toLowerCase() === parsedCourse.category?.toLowerCase());
        if (existingCategory) {
          finalCategoryId = existingCategory.id;
        } else {
          toast.error(`Categoria '${parsedCourse.category}' não encontrada. Crie-a ou use uma existente.`);
          return;
        }
      }

      // 1. Insert Course
      let newCourseId: string | number;
      if (USE_LOCAL_AUTH) {
        const coursePayload = {
          title: parsedCourse.title,
          description: parsedCourse.description,
          category_id: finalCategoryId,
          cover_image: parsedCourse.thumbnail || null, // If thumbnail is ever extracted
          duration_hours: parsedCourse.duration_hours || null,
          difficulty: parsedCourse.level || 'beginner',
          certificate_price: parsedCourse.price,
          // teacher_id is taken from req.user!.userId in backend
        };
        const response = await api.post('/courses', coursePayload);
        newCourseId = response.data.id;
      } else {
        const { data, error } = await supabase
          .from('cursos').upsert({
            titulo: parsedCourse.title,
            slug: parsedCourse.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now(),
            descricao: parsedCourse.description,
            preco_certificado: parsedCourse.price,
            categoria_id: finalCategoryId,
            nivel: parsedCourse.level || 'beginner',
            professor_id: user.id,
            professor_nome: user.name,
            imagem_capa_url: parsedCourse.thumbnail || null,
            is_published: false,
          })
          .select('id')
          .single();
        if (error) throw error;
        newCourseId = data.id;
      }

      toast.success(`Curso "${parsedCourse.title}" criado!`);

      // 2. Insert Modules and Lessons
      if (parsedCourse.modules && parsedCourse.modules.length > 0) {
        for (const module of parsedCourse.modules) {
          let newModuleId: string | number;
          if (USE_LOCAL_AUTH) {
            const modulePayload = {
              course_id: newCourseId,
              title: module.title,
              description: module.description || null,
              order_index: module.order_index,
            };
            const response = await api.post('/modules', modulePayload); // Assuming POST /api/modules
            newModuleId = response.data.id;
          } else {
            const { data, error } = await supabase
              .from('modulos')
              .insert({
                curso_id: newCourseId,
                titulo_modulo: module.title,
                conteudo_texto_html: module.description,
                ordem: module.order_index,
              })
              .select('id')
              .single();
            if (error) throw error;
            newModuleId = data.id;
          }

          if (module.lessons && module.lessons.length > 0) {
            for (const lesson of module.lessons) {
              const lessonPayload = {
                title: lesson.title,
                content: lesson.content || null,
                video_url: lesson.video_url || null,
                duration_minutes: lesson.duration || null,
                order_index: lesson.order_index,
              };
              if (USE_LOCAL_AUTH) {
                await api.post(`/modules/${newModuleId}/lessons`, lessonPayload); // Note the URL change
              } else {
                const { error } = await supabase
                  .from('aulas')
                  .insert({
                    modulo_id: newModuleId,
                    titulo: lesson.title,
                    conteudo_html: lesson.content,
                    video_url: lesson.video_url,
                    ordem: lesson.order_index,
                  });
                if (error) throw error;
              }
            }
          }
        }
      }

      toast.success('Módulos e aulas criados com sucesso!');
      navigate(`/teacher/course/${newCourseId}/edit`); // Navigate to editor for further details
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao salvar o curso.');
    }
  };


  const handleParseText = () => {
    if (!rawCourseText.trim()) {
      toast.error('O campo de texto do curso está vazio.');
      setParsedCourse(null);
      return;
    }
    try {
      // Pass currentUserId and currentUserName to the parser
      const parsed = parseCourseText(rawCourseText, user?.id || '', user?.name || '');
      if (parsed) {
        setParsedCourse(parsed);
        // Also populate basic fields from parsed data
        setTitle(parsed.title || '');
        setDescription(parsed.description || '');
        setCategory(parsed.category || '');
        setLevel(parsed.level || '');
        setPrice(String(parsed.price) || ''); // Convert number to string for input
        // Thumbnail and teacherName are not extracted from text directly, so leave them
        toast.success('Texto do curso extraído com sucesso!');
      } else {
        toast.error('Não foi possível extrair informações do texto. Verifique o formato.');
        setParsedCourse(null);
      }
    } catch (error) {
      console.error('Error parsing text:', error);
      toast.error('Erro ao processar o texto. Verifique o console.');
      setParsedCourse(null);
    }
  };
  // Inserir imagem no conteúdo da aula
  const handleInsertImage = (moduleIndex: number, lessonIndex: number) => {
    const url = prompt('Cole a URL da imagem (PNG, JPG, GIF, WebP):');
    if (!url) return;
    
    if (!/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url) && !url.includes('imgur') && !url.includes('cloudinary')) {
      toast.error('URL inválida. Use uma URL de imagem válida.');
      return;
    }
    
    const imgHtml = `<img src="${url}" alt="Imagem" style="max-width:100%; border-radius:8px; margin:10px 0;">`;
    
    setCourse(prev => {
      const newModules = [...prev.modules];
      const lesson = newModules[moduleIndex].lessons[lessonIndex];
      lesson.content = (lesson.content || '') + '\n' + imgHtml;
      return { ...prev, modules: newModules };
    });
    
    toast.success('Imagem inserida!');
  };

  // Inserir vídeo no conteúdo da aula
  const handleInsertVideo = (moduleIndex: number, lessonIndex: number) => {
    const url = prompt('Cole a URL do vídeo (YouTube ou Vimeo):');
    if (!url) return;
    
    let embedUrl = '';
    
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    if (youtubeMatch) {
      embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    if (!embedUrl) {
      toast.error('URL inválida. Use YouTube ou Vimeo.');
      return;
    }
    
    const videoHtml = `<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; margin:10px 0; border-radius:8px;"><iframe src="${embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe></div>`;
    
    setCourse(prev => {
      const newModules = [...prev.modules];
      const lesson = newModules[moduleIndex].lessons[lessonIndex];
      lesson.content = (lesson.content || '') + '\n' + videoHtml;
      return { ...prev, modules: newModules };
    });
    
    toast.success('Vídeo inserido!');
  };




  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-white">Criar Novo Curso (Glass)</h1>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleParseText}
            className="btn-glass flex items-center space-x-2" // New class for glass button
          >
            <FaMagic />
            <span>Extrair Texto</span>
          </button>
          <button
            onClick={handleSaveCourse}
            className="btn-glass-primary flex items-center space-x-2" // New class for primary glass button
          >
            <FaSave />
            <span>Salvar Curso</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left side: Basic Course Info & Text Extractor */}
        <div className="glass-panel p-6 rounded-lg shadow-lg backdrop-blur-md"> {/* New class for glass panel */}
          <h2 className="text-xl font-semibold text-white mb-4">Informações Básicas</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Título do Curso *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                     className="input-glass" placeholder="Ex: Desenvolvimento Web Completo" />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Descrição do Curso *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        className="input-glass w-full h-24 resize-y" placeholder="Descreva seu curso em detalhes..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Preço (R$) *</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                     className="input-glass" placeholder="0.00" />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Categoria</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                     className="input-glass" placeholder="Ex: Programação" />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Nível</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-glass">
                <option value="">Selecione</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">URL da Imagem</label>
              <input type="text" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)}
                     className="input-glass" placeholder="https://..." disabled={!isAdmin} />
              {!isAdmin && (
                <p className="text-xs text-white/50 mt-1">
                  Apenas o admin pode editar a URL da imagem.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Nome exibido do professor</label>
              <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)}
                     className="input-glass" placeholder="Ex: Equipe MAEXTRIA" />
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Cole o Texto do Curso Aqui</h3>
              <p className="text-sm text-white/70 mb-3">
                Use o formato: `Título do Curso:`, `## Módulo:`, `### Aula:`, `URL do Vídeo:`, etc.
              </p>
              <textarea
                value={rawCourseText}
                onChange={(e) => setRawCourseText(e.target.value)}
                className="input-glass w-full h-64 resize-y"
                placeholder="Ex: Título do Curso: Meu Curso&#10;Descrição do Curso: ...&#10;## Módulo: Introdução&#10;### Aula: Boas Vindas&#10;URL do Vídeo: ..."
              />
            </div>
          </div>
        </div>

        {/* Right side: Preview of parsed course structure */}
        <div className="glass-panel p-6 rounded-lg shadow-lg backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white mb-4">Pré-visualização do Curso</h2>
          {parsedCourse ? (
            <div className="text-white/80 space-y-4">
              <p><span className="font-semibold">Título:</span> {parsedCourse.title}</p>
              <p><span className="font-semibold">Descrição:</span> {parsedCourse.description}</p>
              <p><span className="font-semibold">Categoria:</span> {parsedCourse.category}</p>
              <p><span className="font-semibold">Nível:</span> {parsedCourse.level}</p>
              <p><span className="font-semibold">Preço:</span> R$ {parsedCourse.price?.toFixed(2)}</p>

              {parsedCourse.modules && parsedCourse.modules.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h3 className="text-lg font-semibold text-white">Módulos:</h3>
                  {parsedCourse.modules.map((module: any, modIndex: number) => (
                    <div key={module.id} className="glass-card p-4 rounded-lg"> {/* New class for nested glass */}
                      <p><span className="font-semibold">Módulo {modIndex + 1}:</span> {module.title}</p>
                      {module.description && <p className="text-sm text-white/70">{module.description}</p>}

                      {module.lessons && module.lessons.length > 0 && (
                        <div className="space-y-2 mt-3 pl-4 border-l border-white/20">
                          <h4 className="text-md font-semibold text-white">Aulas:</h4>
                          {module.lessons.map((lesson: any, lessonIndex: number) => (
                            <div key={lesson.id} className="glass-card p-3 rounded-md text-sm">
                              <p><span className="font-semibold">Aula {modIndex + 1}.{lessonIndex + 1}:</span> {lesson.title}</p>
                              {lesson.video_url && <p className="text-xs text-white/60">Vídeo: <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--primary))] hover:underline">{lesson.video_url}</a></p>}
                              <div className="flex gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleInsertImage(moduleIndex, lessonIndex)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30"
                                  >
                                    <FaImage /> Imagem
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInsertVideo(moduleIndex, lessonIndex)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30"
                                  >
                                    <FaVideo /> Vídeo
                                  </button>
                                </div>
                                {lesson.content && <p className="text-xs text-white/60 mt-1">{lesson.content.substring(0, 100)}...</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/70">Cole e extraia o texto para ver a pré-visualização.</p>
          )}
        </div>
      </div>
    </div>
  );
}
