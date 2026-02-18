import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Module, Lesson } from '../../types';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaSave, FaRobot, FaEdit, FaTimes } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import RichTextEditor from '../../components/RichTextEditor';

export default function CourseEditor() {
  type DiscountColumn = 'discount_percent' | 'desconto_percentual' | null;
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [cargaHoraria, setCargaHoraria] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [slug, setSlug] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [moduleQuizzes, setModuleQuizzes] = useState<Record<string, any>>({});
  const [finalQuiz, setFinalQuiz] = useState<any | null>(null);
  const [surpriseQuizzes, setSurpriseQuizzes] = useState<any[]>([]);
  const [surpriseDraft, setSurpriseDraft] = useState<{
    targetType: 'aula' | 'modulo';
    moduleId: string;
    lessonId: string;
  }>({
    targetType: 'aula',
    moduleId: '',
    lessonId: '',
  });
  const [questionDrafts, setQuestionDrafts] = useState<Record<string, any>>({});
  const [extractorDrafts, setExtractorDrafts] = useState<Record<string, { raw: string; questions: any[] }>>({});
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [discountColumn, setDiscountColumn] = useState<DiscountColumn>(null);
  const [aiAccess, setAiAccess] = useState<{ expires_at: string | null } | null>(null);
  const [aiAccessLoading, setAiAccessLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isEditing) {
      loadCourse();
    }
  }, [id]);

  useEffect(() => {
    if (!isEditing && user?.name && !teacherName) {
      setTeacherName(user.name);
    }
  }, [isEditing, user?.name, teacherName]);

  useEffect(() => {
    if (!user?.id) return;
    if (isAdmin) {
      setAiAccess({ expires_at: null });
      return;
    }
    loadAiAccess();
  }, [user?.id, isAdmin]);

  useEffect(() => {
    if (isEditing) return;
    detectDiscountColumn();
  }, [isEditing]);

  const loadAiAccess = async () => {
    if (!user?.id) return;
    setAiAccessLoading(true);
    try {
      const { data } = await supabase
        .from('ai_plan_access')
        .select('expires_at')
        .eq('usuario_id', String(user.id))
        .maybeSingle();
      if (data?.expires_at) {
        setAiAccess(data);
        return;
      }

      const { data: legacyAccess } = await supabase
        .from('ai_course_access')
        .select('granted_until')
        .eq('usuario_id', String(user.id))
        .maybeSingle();
      if (legacyAccess?.granted_until) {
        setAiAccess({ expires_at: legacyAccess.granted_until });
        return;
      }

      setAiAccess(null);
    } catch (error) {
      setAiAccess(null);
    } finally {
      setAiAccessLoading(false);
    }
  };

  const hasAiAccess = () => {
    if (isAdmin) return true;
    if (!aiAccess) return false;
    if (!aiAccess.expires_at) return false;
    return new Date(aiAccess.expires_at) > new Date();
  };

  const emptyLessonImages = () => ['', '', ''];
  const sortQuestions = (questions: any[] = []) =>
    [...questions].sort((a: any, b: any) => {
      const aOrder = a?.ordem ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b?.ordem ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a?.id || '').localeCompare(String(b?.id || ''));
    });

  const detectDiscountColumn = async () => {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .limit(1);
      if (error) return;

      const sample = Array.isArray(data) ? data[0] : null;
      if (!sample) return;

      if (Object.prototype.hasOwnProperty.call(sample, 'discount_percent')) {
        setDiscountColumn('discount_percent');
        return;
      }
      if (Object.prototype.hasOwnProperty.call(sample, 'desconto_percentual')) {
        setDiscountColumn('desconto_percentual');
      }
    } catch (error) {
      // keep null and proceed without discount column to avoid 400 errors
    }
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
      // Lista de domínios/padrões bloqueados
  const BLOCKED_PATTERNS = [
    /whatsapp\.com/i,
    /wa\.me/i,
    /t\.me/i,
    /telegram\.org/i,
    /telegram\.me/i,
    /facebook\.com/i,
    /fb\.com/i,
    /instagram\.com/i,
    /twitter\.com/i,
    /x\.com/i,
    /tiktok\.com/i,
    /linkedin\.com/i,
    /discord\.gg/i,
    /discord\.com/i,
    /bit\.ly/i,
    /goo\.gl/i,
    /tinyurl\.com/i,
    /encurtador/i,
  ];

  // Domínios permitidos (YouTube, Vimeo para vídeos)
  const ALLOWED_DOMAINS = [
    /youtube\.com/i,
    /youtu\.be/i,
    /vimeo\.com/i,
    /player\.vimeo\.com/i,
  ];

  // Função para verificar se uma URL é permitida
  const isUrlAllowed = (url: string): boolean => {
    // Permitir URLs de imagem (terminam com extensões de imagem)
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url)) {
      return true;
    }
    // Permitir domínios de vídeo
    if (ALLOWED_DOMAINS.some(pattern => pattern.test(url))) {
      return true;
    }
    // Bloquear padrões proibidos
    if (BLOCKED_PATTERNS.some(pattern => pattern.test(url))) {
      return false;
    }
    // Bloquear outros links externos (http/https que não são imagens ou vídeos permitidos)
    if (/^https?:\/\//i.test(url)) {
      return false;
    }
    return true;
  };

    // Padrões de dados sensíveis para bloquear
  const SENSITIVE_PATTERNS = [
    // Telefones brasileiros (com ou sem formatação)
    /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-.\s]?\d{4}/g,
    // CPF (com ou sem formatação)
    /\d{3}[.\s-]?\d{3}[.\s-]?\d{3}[.\s-]?\d{2}/g,
    // CNPJ
    /\d{2}[.\s]?\d{3}[.\s]?\d{3}[\/.\s]?\d{4}[.\s-]?\d{2}/g,
    // Contas bancárias (agência e conta)
    /(?:ag[eê]ncia|ag)[:\s]*\d{4,5}[-.\s]?\d?/gi,
    /(?:conta|c\/c|cc)[:\s]*\d{5,12}[-.\s]?\d?/gi,
    // Chaves PIX (email, telefone, CPF/CNPJ, aleatória)
    /(?:pix|chave\s*pix)[:\s]*[\w.@+-]+/gi,
    // Emails (podem ser usados como PIX)
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // Chave PIX aleatória (UUID)
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
  ];

  // Função para sanitizar conteúdo HTML removendo links bloqueados e dados sensíveis
  const sanitizeContent = (html: string): string => {
    let sanitized = html;
    
    // Remove tags <a> com href bloqueado
    sanitized = sanitized.replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>.*?<\/a>/gi, (match, href) => {
      if (!isUrlAllowed(href)) {
        return '[link removido]';
      }
      return match;
    });
    
    // Verifica URLs soltas no texto
    sanitized = sanitized.replace(/(https?:\/\/[^\s<>"]+)/gi, (url) => {
      if (!isUrlAllowed(url)) {
        return '[link removido]';
      }
      return url;
    });
    
    // Remove dados sensíveis
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[dado protegido]');
    });
    
    // Remove menções explícitas de transferência/pagamento
    sanitized = sanitized.replace(/(?:me\s*(?:pague|transfira|deposite|envie)|(?:faz|fazer)\s*(?:pix|transfer[eê]ncia)|minha?\s*(?:conta|pix|chave))[^.!?\n]*/gi, '[conteúdo removido]');
    
    return sanitized;
  };
    

  

  // Função para inserir imagem no conteúdo
  const handleInsertImage = (lessonId: string | number) => {
    const url = prompt('Cole a URL da imagem (PNG, JPG, GIF, WebP):');
    if (!url) return;
    
    if (!/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url) && !url.includes('imgur') && !url.includes('cloudinary')) {
      toast.error('URL inválida. Use uma URL de imagem válida (PNG, JPG, GIF, WebP).');
      return;
    }
    
    const imgHtml = `<img src="${url}" alt="Imagem" style="max-width:100%; border-radius:8px; margin:10px 0;">`;
    
    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        lessons: m.lessons?.map((l) => {
          if (l.id !== lessonId) return l;
          const newContent = (l.content || '') + '\n' + imgHtml;
          return { ...l, content: newContent };
        }),
      }))
    );
    
    // Salvar no banco
    const lesson = modules.flatMap(m => m.lessons || []).find(l => l.id === lessonId);
    if (lesson) {
      const newContent = (lesson.content || '') + '\n' + imgHtml;
      updateLesson(lessonId, { content: sanitizeContent(newContent) });
    }
    
    toast.success('Imagem inserida!');
  };

  // Função para inserir vídeo no conteúdo
  const handleInsertVideo = (lessonId: string | number) => {
    const url = prompt('Cole a URL do vídeo (YouTube ou Vimeo):');
    if (!url) return;
    
    let embedUrl = '';
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    if (youtubeMatch) {
      embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    if (!embedUrl) {
      toast.error('URL inválida. Use uma URL do YouTube ou Vimeo.');
      return;
    }
    
    const videoHtml = `<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; margin:10px 0; border-radius:8px;"><iframe src="${embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe></div>`;
    
    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        lessons: m.lessons?.map((l) => {
          if (l.id !== lessonId) return l;
          const newContent = (l.content || '') + '\n' + videoHtml;
          return { ...l, content: newContent };
        }),
      }))
    );
    
    // Salvar no banco
    const lesson = modules.flatMap(m => m.lessons || []).find(l => l.id === lessonId);
    if (lesson) {
      const newContent = (lesson.content || '') + '\n' + videoHtml;
      updateLesson(lessonId, { content: sanitizeContent(newContent) });
    }
    
    toast.success('Vídeo inserido!');
  };





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
      setDiscountPercent(
        courseData.discount_percent !== undefined && courseData.discount_percent !== null
          ? String(courseData.discount_percent)
          : courseData.desconto_percentual !== undefined && courseData.desconto_percentual !== null
            ? String(courseData.desconto_percentual)
          : '0'
      );
      if (Object.prototype.hasOwnProperty.call(courseData, 'discount_percent')) {
        setDiscountColumn('discount_percent');
      } else if (Object.prototype.hasOwnProperty.call(courseData, 'desconto_percentual')) {
        setDiscountColumn('desconto_percentual');
      } else {
        setDiscountColumn(null);
      }
      setCategory(courseData.categoria || '');
      setLevel(courseData.nivel || '');
      setCargaHoraria(courseData.carga_horaria_horas ? String(courseData.carga_horaria_horas) : '');
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

      const lessonIds = mappedModules.flatMap((module: Module) =>
        module.lessons?.map((lesson: Lesson) => lesson.id) || []
      );
      const imagesByLesson: Record<string, string[]> = {};

      if (lessonIds.length > 0) {
        const { data: imagesData } = await supabase
          .from('aula_imagens')
          .select('aula_id, url, ordem')
          .in('aula_id', lessonIds);

        (imagesData || []).forEach((row: any) => {
          const key = String(row.aula_id);
          if (!imagesByLesson[key]) imagesByLesson[key] = emptyLessonImages();
          const index = Number(row.ordem) - 1;
          if (index >= 0 && index < 3) {
            imagesByLesson[key][index] = row.url;
          }
        });
      }

      setModules(
        mappedModules.map((module: Module) => ({
          ...module,
          lessons: module.lessons?.map((lesson: Lesson) => ({
            ...lesson,
            image_urls: imagesByLesson[String(lesson.id)] || emptyLessonImages(),
          })),
        }))
      );

      const { data: quizzesData } = await supabase
        .from('questionarios')
        .select('*, questoes(*)')
        .eq('curso_id', id);

      const moduleMap: Record<string, any> = {};
      let final: any | null = null;
      const surprises: any[] = [];
      (quizzesData || []).forEach((quiz: any) => {
        const normalizedQuiz = {
          ...quiz,
          questoes: sortQuestions(quiz.questoes || []),
        };
        if (quiz.tipo === 'final') {
          final = normalizedQuiz;
          return;
        }
        if (quiz.tipo === 'surpresa') {
          surprises.push(normalizedQuiz);
          return;
        }
        if (quiz.modulo_id) {
          moduleMap[String(quiz.modulo_id)] = normalizedQuiz;
        }
      });
      setModuleQuizzes(moduleMap);
      setFinalQuiz(final);
      setSurpriseQuizzes(
        surprises.sort((a: any, b: any) => Number(a?.surpresa_slot || 0) - Number(b?.surpresa_slot || 0))
      );
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
    const descontoValor = discountPercent === '' ? 0 : Number(discountPercent);
    if (Number.isNaN(descontoValor) || descontoValor < 0 || descontoValor > 100) {
      toast.error('O desconto deve estar entre 0 e 100');
      return;
    }
    if (!user?.id) {
      toast.error('Usuário não autenticado.');
      return;
    }

    setLoading(true);
    try {
      const payloadBase: Record<string, any> = {
        titulo: title,
        descricao: description,
        preco_certificado: parseFloat(price),
        categoria: category.trim() || null,
        nivel: level || null,
        carga_horaria_horas: cargaHoraria ? parseInt(cargaHoraria) : null,
        slug: slug || slugify(title),
        professor_nome: teacherName.trim() || user.name || null,
      };
      if (isAdmin) {
        payloadBase.imagem_capa_url = thumbnail.trim() || null;
      }

      if (isEditing) {
        const updatePayload = { ...payloadBase };
        if (discountColumn === 'discount_percent') {
          updatePayload.discount_percent = descontoValor;
        } else if (discountColumn === 'desconto_percentual') {
          updatePayload.desconto_percentual = descontoValor;
        }

        const { error } = await supabase
          .from('cursos')
          .update(updatePayload)
          .eq('id', id);

        if (error) throw error;
        toast.success('Curso atualizado com sucesso!');
        // Redirecionar baseado no role do usuário
        if (isAdmin) {
          navigate('/admin/courses');
        } else {
          navigate('/teacher/my-courses');
        }
        return;
      } else {
        const insertBase: Record<string, any> = {
          ...payloadBase,
          ativo: false,
          professor_id: user.id,
        };
        const insertPayload: Record<string, any> = { ...insertBase };
        if (discountColumn === 'discount_percent') {
          insertPayload.discount_percent = descontoValor;
        } else if (discountColumn === 'desconto_percentual') {
          insertPayload.desconto_percentual = descontoValor;
        }

        const { data, error } = await supabase
          .from('cursos')
          .insert(insertPayload)
          .select('id')
          .single();

        if (error) throw error;
        if (!data?.id) throw new Error('Curso criado, mas sem ID retornado');
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
                    image_urls: emptyLessonImages(),
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

  const updateLessonImageState = (lessonId: string | number, index: number, value: string) => {
    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        lessons: m.lessons?.map((l) => {
          if (l.id !== lessonId) return l;
          const nextImages = [...(l.image_urls || emptyLessonImages())];
          nextImages[index] = value;
          return { ...l, image_urls: nextImages };
        }),
      }))
    );
  };

    const updateLesson = async (lessonId: string | number, data: Partial<Lesson>) => {
    try {
      const payload: Record<string, any> = {};
      if (data.title !== undefined) payload.titulo = data.title;
      if (data.content !== undefined) payload.conteudo_html = sanitizeContent(data.content);

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

  const updateLessonImage = async (lessonId: string | number, index: number, value: string) => {
    const ordem = index + 1;
    try {
      if (!value.trim()) {
        const { error } = await supabase
          .from('aula_imagens')
          .delete()
          .eq('aula_id', lessonId)
          .eq('ordem', ordem);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from('aula_imagens')
        .upsert(
          { aula_id: lessonId, ordem, url: value.trim() },
          { onConflict: 'aula_id,ordem' }
        );
      if (error) throw error;
    } catch (error) {
      toast.error('Erro ao atualizar imagens da aula');
    }
  };

  const handleAiArea = () => {
    if (aiAccessLoading) return;
    if (hasAiAccess()) {
      navigate('/teacher/ai-creator');
      return;
    }
    navigate('/teacher/ai-access');
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
      setModuleQuizzes((prev) => ({ ...prev, [moduleId]: { ...data, questoes: sortQuestions(data.questoes || []) } }));
      toast.success('Questionário criado.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar questionário.');
    }
  };

  const deleteModuleQuiz = async (moduleId: string, quizId: string) => {
    if (!confirm('Cancelar este questionario do modulo?')) return;
    try {
      const { error } = await supabase
        .from('questionarios')
        .delete()
        .eq('id', quizId);
      if (error) throw error;
      setModuleQuizzes((prev) => {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      });
      cancelQuestionDraft(quizId);
      closeExtractorDraft(quizId);
      toast.success('Questionario do modulo cancelado.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao cancelar questionario do modulo.');
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
      setFinalQuiz({ ...data, questoes: sortQuestions(data.questoes || []) });
      toast.success('Prova final criada.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar prova final.');
    }
  };

  const getAllLessons = () =>
    modules.flatMap((module: Module) =>
      (module.lessons || []).map((lesson: Lesson) => ({
        id: String(lesson.id),
        title: lesson.title || 'Aula sem titulo',
        moduleId: String(module.id),
        moduleTitle: module.title || 'Modulo sem titulo',
      }))
    );

  const getAvailableSurpriseSlot = () => {
    const used = new Set((surpriseQuizzes || []).map((quiz: any) => Number(quiz?.surpresa_slot || 0)));
    if (!used.has(1)) return 1;
    if (!used.has(2)) return 2;
    return null;
  };

  const getSurpriseQuizById = (quizId: string) =>
    (surpriseQuizzes || []).find((quiz: any) => String(quiz.id) === String(quizId)) || null;

  const createSurpriseQuiz = async () => {
    if (!id) return;
    if (surpriseQuizzes.length >= 2) {
      toast.error('Limite atingido: voce pode criar ate 2 questionarios surpresa por curso.');
      return;
    }

    const slot = getAvailableSurpriseSlot();
    if (!slot) {
      toast.error('Nao ha vaga para novo questionario surpresa.');
      return;
    }

    let targetModuleId = '';
    let targetLessonId: string | null = null;
    let targetLabel = '';

    if (surpriseDraft.targetType === 'modulo') {
      if (!surpriseDraft.moduleId) {
        toast.error('Selecione o modulo onde o questionario surpresa vai aparecer.');
        return;
      }
      targetModuleId = surpriseDraft.moduleId;
      const module = modules.find((item) => String(item.id) === String(surpriseDraft.moduleId));
      targetLabel = ('apos o modulo ' + (module?.title || '')).trim();
    } else {
      if (!surpriseDraft.lessonId) {
        toast.error('Selecione a aula onde o questionario surpresa vai aparecer.');
        return;
      }
      const lesson = getAllLessons().find((item) => item.id === surpriseDraft.lessonId);
      if (!lesson) {
        toast.error('Aula selecionada nao encontrada.');
        return;
      }
      targetModuleId = lesson.moduleId;
      targetLessonId = lesson.id;
      targetLabel = 'apos a aula ' + lesson.title;
    }

    try {
      const { data, error } = await supabase
        .from('questionarios')
        .insert({
          curso_id: id,
          modulo_id: targetModuleId,
          titulo: 'Questionario surpresa ' + slot + ' (' + targetLabel + ')',
          tipo: 'surpresa',
          surpresa_slot: slot,
          surpresa_alvo_tipo: surpriseDraft.targetType,
          surpresa_aula_id: targetLessonId,
        })
        .select('*, questoes(*)')
        .single();
      if (error) throw error;
      const normalizedQuiz = { ...data, questoes: sortQuestions(data.questoes || []) };
      setSurpriseQuizzes((prev) =>
        [...prev, normalizedQuiz].sort((a: any, b: any) => Number(a?.surpresa_slot || 0) - Number(b?.surpresa_slot || 0))
      );
      setSurpriseDraft({ targetType: 'aula', moduleId: '', lessonId: '' });
      toast.success('Questionario surpresa criado.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar questionario surpresa.');
    }
  };

  const deleteSurpriseQuiz = async (quizId: string) => {
    if (!confirm('Excluir este questionario surpresa e as questoes dele?')) return;
    try {
      const { error } = await supabase.from('questionarios').delete().eq('id', quizId);
      if (error) throw error;
      setSurpriseQuizzes((prev) => prev.filter((quiz: any) => String(quiz.id) !== String(quizId)));
      toast.success('Questionario surpresa excluido.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir questionario surpresa.');
    }
  };

  const openQuestionDraft = (quizId: string) => {
    setQuestionDrafts((prev) => ({
      ...prev,
      [quizId]: {
        enunciado: '',
        alternativa_a: '',
        alternativa_b: '',
        alternativa_c: '',
        alternativa_d: '',
        correta: 'a',
      },
    }));
  };

  const startEditQuestion = (quizId: string, question: any) => {
    setQuestionDrafts((prev) => ({
      ...prev,
      [quizId]: {
        id: question.id,
        enunciado: question.enunciado || '',
        alternativa_a: question.alternativa_a || '',
        alternativa_b: question.alternativa_b || '',
        alternativa_c: question.alternativa_c || '',
        alternativa_d: question.alternativa_d || '',
        correta: question.correta || 'a',
        ordem: question.ordem || undefined,
      },
    }));
  };

  const cancelQuestionDraft = (quizId: string) => {
    setQuestionDrafts((prev) => {
      const next = { ...prev };
      delete next[quizId];
      return next;
    });
  };

  const openExtractorDraft = (quizId: string) => {
    setExtractorDrafts((prev) => ({
      ...prev,
      [quizId]: prev[quizId] || { raw: '', questions: [] },
    }));
  };

  const closeExtractorDraft = (quizId: string) => {
    setExtractorDrafts((prev) => {
      const next = { ...prev };
      delete next[quizId];
      return next;
    });
  };

  const updateExtractorRaw = (quizId: string, raw: string) => {
    setExtractorDrafts((prev) => ({
      ...prev,
      [quizId]: {
        ...(prev[quizId] || { raw: '', questions: [] }),
        raw,
      },
    }));
  };

  const downloadQuestionTemplate = () => {
    const template = [
      '1. (enunciado da questao 1)',
      'a. (resposta a)',
      'b. (resposta b)',
      'c. (resposta c)',
      'd. (resposta d)',
      'Resposta certa: (a)',
      '',
      '2. (enunciado da questao 2)',
      'a. (resposta a)',
      'b. (resposta b)',
      'c. (resposta c)',
      'd. (resposta d)',
      'Resposta certa: (b)',
    ].join('\n');

    const blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-questionario.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const unwrapWrappedText = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return trimmed.slice(1, -1).trim();
    }
    return trimmed;
  };

  const parseQuestionsFromRaw = (raw: string, maxQuestions: number) => {
    const normalized = raw.replace(/\r/g, '').trim();
    if (!normalized) {
      throw new Error('Cole o texto do questionario para extrair as questoes.');
    }

    const chunks = normalized
      .split(/\n\s*\n+/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);

    const parsed = chunks.map((chunk, chunkIndex) => {
      const linesLocal = chunk
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (linesLocal.length < 6) {
        throw new Error('Questao ' + (chunkIndex + 1) + ': formato incompleto.');
      }

      const qMatch = linesLocal[0].match(/^\d+\.\s*(.+)$/i);
      if (!qMatch) {
        throw new Error('Questao ' + (chunkIndex + 1) + ': enunciado invalido.');
      }

      const alternatives: Record<string, string> = {};
      for (let i = 1; i <= 4; i += 1) {
        const altLine = linesLocal[i];
        const altMatch = altLine.match(/^([a-d])\.\s*(.+)$/i);
        if (!altMatch) {
          throw new Error('Questao ' + (chunkIndex + 1) + ': alternativa ' + i + ' invalida.');
        }
        alternatives[altMatch[1].toLowerCase()] = unwrapWrappedText(altMatch[2]);
      }

      const answerLine = linesLocal.find((line) => /^resposta\s*certa\s*:/i.test(line));
      if (!answerLine) {
        throw new Error('Questao ' + (chunkIndex + 1) + ': resposta certa nao informada.');
      }
      const answerMatch = answerLine.match(/^resposta\s*certa\s*:\s*\(?\s*([a-d])\s*\)?$/i);
      if (!answerMatch) {
        throw new Error('Questao ' + (chunkIndex + 1) + ': resposta certa invalida.');
      }

      return {
        enunciado: unwrapWrappedText(qMatch[1]),
        alternativa_a: alternatives.a || '',
        alternativa_b: alternatives.b || '',
        alternativa_c: alternatives.c || '',
        alternativa_d: alternatives.d || '',
        correta: answerMatch[1].toLowerCase(),
      };
    });

    if (parsed.length > maxQuestions) {
      throw new Error('Limite de ' + maxQuestions + ' questoes por extracao.');
    }

    return parsed;
  };

  const extractQuestionsFromRaw = (quizId: string, maxQuestions: number) => {
    try {
      const raw = extractorDrafts[quizId]?.raw || '';
      const questions = parseQuestionsFromRaw(raw, maxQuestions);
      setExtractorDrafts((prev) => ({
        ...prev,
        [quizId]: {
          ...(prev[quizId] || { raw: '', questions: [] }),
          questions,
        },
      }));
      toast.success(questions.length + ' questoes extraidas.');
    } catch (error: any) {
      toast.error(error?.message || 'Nao foi possivel extrair as questoes.');
    }
  };

  const updateExtractedQuestion = (quizId: string, index: number, field: string, value: string) => {
    setExtractorDrafts((prev) => {
      const current = prev[quizId] || { raw: '', questions: [] };
      const nextQuestions = [...current.questions];
      nextQuestions[index] = { ...nextQuestions[index], [field]: value };
      return {
        ...prev,
        [quizId]: { ...current, questions: nextQuestions },
      };
    });
  };

  const removeExtractedQuestion = (quizId: string, index: number) => {
    setExtractorDrafts((prev) => {
      const current = prev[quizId] || { raw: '', questions: [] };
      const nextQuestions = current.questions.filter((_: any, itemIndex: number) => itemIndex !== index);
      return {
        ...prev,
        [quizId]: { ...current, questions: nextQuestions },
      };
    });
  };

  const saveExtractedQuestions = async (quizId: string) => {
    const batch = extractorDrafts[quizId]?.questions || [];
    if (!batch.length) {
      toast.error('Extraia pelo menos uma questao antes de salvar.');
      return;
    }

    const hasInvalid = batch.some(
      (item: any) =>
        !item.enunciado || !item.alternativa_a || !item.alternativa_b || !item.alternativa_c || !item.alternativa_d
    );
    if (hasInvalid) {
      toast.error('Todas as questoes precisam de enunciado e alternativas.');
      return;
    }

    try {
      const surpriseQuiz = getSurpriseQuizById(quizId);
      const currentQuestions = getQuizQuestions(quizId);
      if (surpriseQuiz) {
        if (batch.length !== 4) {
          toast.error('Questionario surpresa exige exatamente 4 questoes por extracao.');
          return;
        }
        if (currentQuestions.length > 0) {
          toast.error('Apague as questoes atuais do questionario surpresa antes de usar o extrator.');
          return;
        }
      }
      let nextOrder = Math.max(0, ...currentQuestions.map((item: any) => Number(item.ordem || 0))) + 1;
      const payload = batch.map((item: any) => ({
        questionario_id: quizId,
        enunciado: item.enunciado,
        alternativa_a: item.alternativa_a,
        alternativa_b: item.alternativa_b,
        alternativa_c: item.alternativa_c,
        alternativa_d: item.alternativa_d,
        correta: String(item.correta || 'a').toLowerCase(),
        ordem: nextOrder++,
      }));

      const { data, error } = await supabase
        .from('questoes')
        .insert(payload)
        .select('*');
      if (error) throw error;

      const createdQuestions = data || [];

      setModuleQuizzes((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key]?.id === quizId) {
            const merged = [...(next[key].questoes || []), ...createdQuestions];
            next[key] = { ...next[key], questoes: sortQuestions(merged) };
          }
        });
        return next;
      });
      if (finalQuiz?.id === quizId) {
        const merged = [...(finalQuiz.questoes || []), ...createdQuestions];
        setFinalQuiz({ ...finalQuiz, questoes: sortQuestions(merged) });
      }
      if (surpriseQuiz) {
        setSurpriseQuizzes((prev) =>
          prev.map((quiz: any) =>
            String(quiz.id) === String(quizId)
              ? { ...quiz, questoes: sortQuestions([...(quiz.questoes || []), ...createdQuestions]) }
              : quiz
          )
        );
      }

      closeExtractorDraft(quizId);
      toast.success(createdQuestions.length + ' questoes salvas.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar questoes extraidas.');
    }
  };
  const getQuizQuestions = (quizId: string) => {
    if (finalQuiz?.id === quizId) return sortQuestions(finalQuiz.questoes || []);
    const surpriseQuiz = getSurpriseQuizById(quizId);
    if (surpriseQuiz) return sortQuestions(surpriseQuiz.questoes || []);
    const moduleQuiz = Object.values(moduleQuizzes).find((quiz: any) => quiz?.id === quizId) as any;
    return sortQuestions(moduleQuiz?.questoes || []);
  };

  const saveQuestion = async (quizId: string, draft: any) => {
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
      const isEditingQuestion = Boolean(draft?.id);
      const surpriseQuiz = getSurpriseQuizById(quizId);
      const currentQuestions = getQuizQuestions(quizId);
      if (surpriseQuiz && !isEditingQuestion && currentQuestions.length >= 4) {
        toast.error('Questionario surpresa permite apenas 4 questoes.');
        return;
      }
      const nextOrder = Math.max(0, ...currentQuestions.map((item: any) => Number(item.ordem || 0))) + 1;
      let data: any = null;
      if (isEditingQuestion) {
        const response = await supabase
          .from('questoes')
          .update({
            enunciado,
            alternativa_a,
            alternativa_b,
            alternativa_c,
            alternativa_d,
            correta: String(correta).toLowerCase(),
            ordem: draft?.ordem || nextOrder,
          })
          .eq('id', draft.id)
          .select('*')
          .single();
        if (response.error) throw response.error;
        data = response.data;
      } else {
        const response = await supabase
          .from('questoes')
          .insert({
            questionario_id: quizId,
            enunciado,
            alternativa_a,
            alternativa_b,
            alternativa_c,
            alternativa_d,
            correta: String(correta).toLowerCase(),
            ordem: nextOrder,
          })
          .select('*')
          .single();
        if (response.error) throw response.error;
        data = response.data;
      }

      setModuleQuizzes((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key]?.id === quizId) {
            const existingQuestions = next[key].questoes || [];
            const updatedQuestions = existingQuestions.some((item: any) => item.id === data.id)
              ? existingQuestions.map((item: any) => (item.id === data.id ? data : item))
              : [...existingQuestions, data];
            next[key] = {
              ...next[key],
              questoes: sortQuestions(updatedQuestions),
            };
          }
        });
        return next;
      });

      if (finalQuiz?.id === quizId) {
        const existingQuestions = finalQuiz.questoes || [];
        const updatedQuestions = existingQuestions.some((item: any) => item.id === data.id)
          ? existingQuestions.map((item: any) => (item.id === data.id ? data : item))
          : [...existingQuestions, data];
        setFinalQuiz({
          ...finalQuiz,
          questoes: sortQuestions(updatedQuestions),
        });
      }
      if (surpriseQuiz) {
        setSurpriseQuizzes((prev) =>
          prev.map((quiz: any) => {
            if (String(quiz.id) !== String(quizId)) return quiz;
            const existingQuestions = quiz.questoes || [];
            const updatedQuestions = existingQuestions.some((item: any) => item.id === data.id)
              ? existingQuestions.map((item: any) => (item.id === data.id ? data : item))
              : [...existingQuestions, data];
            return { ...quiz, questoes: sortQuestions(updatedQuestions) };
          })
        );
      }

      cancelQuestionDraft(quizId);
      toast.success(isEditingQuestion ? 'Questão atualizada.' : 'Questão adicionada.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar questão.');
    }
  };

  const reorderQuestions = async (quizId: string, questionId: string, direction: 'up' | 'down') => {
    const questions = getQuizQuestions(quizId);
    const currentIndex = questions.findIndex((item: any) => item.id === questionId);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const nextQuestions = [...questions];
    const [moved] = nextQuestions.splice(currentIndex, 1);
    nextQuestions.splice(targetIndex, 0, moved);
    const ordered = nextQuestions.map((item: any, index: number) => ({ ...item, ordem: index + 1 }));

    try {
      const updates = ordered.map((item: any) =>
        supabase.from('questoes').update({ ordem: item.ordem }).eq('id', item.id)
      );
      const results = await Promise.all(updates);
      const errorResult = results.find((result: any) => result.error);
      if (errorResult?.error) throw errorResult.error;

      setModuleQuizzes((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key]?.id === quizId) {
            next[key] = { ...next[key], questoes: ordered };
          }
        });
        return next;
      });
      if (finalQuiz?.id === quizId) {
        setFinalQuiz({ ...finalQuiz, questoes: ordered });
      }
      if (getSurpriseQuizById(quizId)) {
        setSurpriseQuizzes((prev) =>
          prev.map((quiz: any) => (String(quiz.id) === String(quizId) ? { ...quiz, questoes: ordered } : quiz))
        );
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao reordenar questões.');
    }
  };

  const deleteQuestion = async (quizId: string, questionId: string) => {
    if (!confirm('Cancelar e excluir esta questão?')) return;
    try {
      const { error } = await supabase
        .from('questoes')
        .delete()
        .eq('id', questionId);
      if (error) throw error;

      setModuleQuizzes((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key]?.id === quizId) {
            next[key] = {
              ...next[key],
              questoes: (next[key].questoes || []).filter((item: any) => item.id !== questionId),
            };
          }
        });
        return next;
      });

      if (finalQuiz?.id === quizId) {
        setFinalQuiz({
          ...finalQuiz,
          questoes: (finalQuiz.questoes || []).filter((item: any) => item.id !== questionId),
        });
      }
      if (getSurpriseQuizById(quizId)) {
        setSurpriseQuizzes((prev) =>
          prev.map((quiz: any) =>
            String(quiz.id) === String(quizId)
              ? { ...quiz, questoes: (quiz.questoes || []).filter((item: any) => item.id !== questionId) }
              : quiz
          )
        );
      }

      toast.success('Questão excluída.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir questão.');
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

  const surpriseLessonOptions = getAllLessons();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold gradient-text">
          {isEditing ? 'Editar Curso' : 'Criar Novo Curso'}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/course/new-glass')}
            className="btn-outline"
          >
            Usar extrator
          </button>
          <button
            type="button"
            onClick={handleAiArea}
            className="btn-outline flex items-center space-x-2"
            disabled={aiAccessLoading}
          >
            <FaRobot />
            <span>Area de criação com ia</span>
          </button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center space-x-2">
            <FaSave />
            <span>{loading ? 'Salvando...' : 'Salvar Curso'}</span>
          </button>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-40">
        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center space-x-2 shadow-lg">
          <FaSave />
          <span>{loading ? 'Salvando...' : 'Salvar Curso'}</span>
        </button>
      </div>

      <div className="space-y-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
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
              <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
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
              <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                Desconto (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
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
              <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                Nível
              </label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-field">
                <option value="">Selecione</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                Carga Horária
              </label>
              <select value={cargaHoraria} onChange={(e) => setCargaHoraria(e.target.value)} className="input-field">
                <option value="">Selecionar carga horária</option>
                <option value="2">2 horas</option>
                <option value="4">4 horas</option>
                <option value="8">8 horas</option>
                <option value="10">10 horas</option>
                <option value="20">20 horas</option>
                <option value="40">40 horas</option>
                <option value="50">50 horas</option>
                <option value="100">100 horas</option>
                <option value="200">200 horas</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                URL da Imagem
              </label>
              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                className="input-field"
                placeholder="https://..."
                disabled={!isAdmin}
              />
              {!isAdmin && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                  Apenas o admin pode editar a URL da imagem.
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                Descrição *
              </label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                minHeight={160}
                placeholder="Descreva seu curso..."
              />
            </div>

            {(user?.role === 'admin' || user?.role === 'teacher') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                  Nome exibido do professor
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
                <p className="text-[hsl(var(--muted-foreground))] text-center py-8">
                  Nenhum módulo criado. Clique em "Adicionar Módulo" para começar.
                </p>
              ) : (
                <div className="space-y-6">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="border border-[hsl(var(--border))] rounded-lg p-4 bg-[hsl(var(--muted))]"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-grow mr-4 min-w-0">
                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) => updateModuleState(module.id, { title: e.target.value })}
                            onBlur={(e) => updateModule(module.id, { title: e.target.value })}
                            className="input-field font-semibold mb-2 w-full"
                            placeholder="Título do módulo"
                          />
                          <RichTextEditor
                            value={module.description || ''}
                            onChange={(value) => updateModuleState(module.id, { description: value })}
                            onBlur={(value) => updateModule(module.id, { description: value })}
                            minHeight={120}
                            className="w-full"
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
                                onClick={() => openQuestionDraft(moduleQuizzes[String(module.id)].id)}
                                className="btn-outline text-xs"
                              >
                                Adicionar questão
                              </button>
                              <button
                                type="button"
                                onClick={() => openExtractorDraft(moduleQuizzes[String(module.id)].id)}
                                className="btn-outline text-xs"
                              >
                                Gerar questionario com extrator de texto
                              </button>
                              {(moduleQuizzes[String(module.id)]?.questoes || []).length === 0 && (
                                <button
                                  type="button"
                                  onClick={() => deleteModuleQuiz(String(module.id), moduleQuizzes[String(module.id)].id)}
                                  className="btn-outline text-xs text-red-600"
                                >
                                  Cancelar questionario do modulo
                                </button>
                              )}
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
                            <div className="border border-[hsl(var(--border))] rounded-[12px] p-4 mb-4 bg-[hsl(var(--card))]">
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
                                    saveQuestion(
                                      moduleQuizzes[String(module.id)].id,
                                      questionDrafts[moduleQuizzes[String(module.id)].id]
                                    )
                                  }
                                  className="btn-accent text-xs"
                                >
                                  {questionDrafts[moduleQuizzes[String(module.id)].id]?.id ? 'Atualizar questão' : 'Salvar questão'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cancelQuestionDraft(moduleQuizzes[String(module.id)].id)}
                                  className="btn-outline text-xs"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}

                        {moduleQuizzes[String(module.id)] &&
                          extractorDrafts[moduleQuizzes[String(module.id)].id] && (
                            <div className="border border-[hsl(var(--border))] rounded-[12px] p-4 mb-4 bg-[hsl(var(--card))]">
                              <h4 className="font-semibold mb-2">Extrator de questoes</h4>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                                Cole no formato: 1. enunciado / a. b. c. d. / Resposta certa: a (maximo 10 questoes).
                              </p>
                              <textarea
                                value={extractorDrafts[moduleQuizzes[String(module.id)].id].raw || ''}
                                onChange={(event) =>
                                  updateExtractorRaw(moduleQuizzes[String(module.id)].id, event.target.value)
                                }
                                className="input-field mb-3"
                                rows={8}
                                placeholder="1. (enunciado)\na. (alternativa A)\nb. (alternativa B)\nc. (alternativa C)\nd. (alternativa D)\nResposta certa: (a)"
                              />
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <button
                                  type="button"
                                  className="btn-outline text-xs"
                                  onClick={() => extractQuestionsFromRaw(moduleQuizzes[String(module.id)].id, 10)}
                                >
                                  Extrair questoes
                                </button>
                                <button
                                  type="button"
                                  className="btn-outline text-xs"
                                  onClick={downloadQuestionTemplate}
                                >
                                  Baixar modelo
                                </button>
                                <button
                                  type="button"
                                  className="btn-outline text-xs"
                                  onClick={() => closeExtractorDraft(moduleQuizzes[String(module.id)].id)}
                                >
                                  Fechar extrator
                                </button>
                              </div>

                              {(extractorDrafts[moduleQuizzes[String(module.id)].id].questions || []).length > 0 && (
                                <div className="space-y-3">
                                  {extractorDrafts[moduleQuizzes[String(module.id)].id].questions.map((question: any, index: number) => (
                                    <div key={index} className="rounded-[10px] border border-[hsl(var(--border))] p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium">Questao {index + 1}</p>
                                        <button
                                          type="button"
                                          className="btn-outline text-xs text-red-600"
                                          onClick={() => removeExtractedQuestion(moduleQuizzes[String(module.id)].id, index)}
                                        >
                                          Apagar
                                        </button>
                                      </div>
                                      <textarea
                                        className="input-field mb-2"
                                        rows={2}
                                        value={question.enunciado || ''}
                                        onChange={(event) =>
                                          updateExtractedQuestion(
                                            moduleQuizzes[String(module.id)].id,
                                            index,
                                            'enunciado',
                                            event.target.value
                                          )
                                        }
                                        placeholder="Enunciado"
                                      />
                                      {(['a', 'b', 'c', 'd'] as const).map((key) => (
                                        <input
                                          key={key}
                                          type="text"
                                          className="input-field mb-2"
                                          value={question['alternativa_' + key] || ''}
                                          onChange={(event) =>
                                            updateExtractedQuestion(
                                              moduleQuizzes[String(module.id)].id,
                                              index,
                                              'alternativa_' + key,
                                              event.target.value
                                            )
                                          }
                                          placeholder={'Alternativa ' + key.toUpperCase()}
                                        />
                                      ))}
                                      <select
                                        className="input-field text-sm max-w-[160px]"
                                        value={question.correta || 'a'}
                                        onChange={(event) =>
                                          updateExtractedQuestion(
                                            moduleQuizzes[String(module.id)].id,
                                            index,
                                            'correta',
                                            event.target.value
                                          )
                                        }
                                      >
                                        <option value="a">Correta: A</option>
                                        <option value="b">Correta: B</option>
                                        <option value="c">Correta: C</option>
                                        <option value="d">Correta: D</option>
                                      </select>
                                    </div>
                                  ))}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      className="btn-accent text-xs"
                                      onClick={() => saveExtractedQuestions(moduleQuizzes[String(module.id)].id)}
                                    >
                                      Salvar questoes extraidas
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-outline text-xs"
                                      onClick={() => closeExtractorDraft(moduleQuizzes[String(module.id)].id)}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        {moduleQuizzes[String(module.id)] && (
                          <div className="mb-4 space-y-3">
                            {(moduleQuizzes[String(module.id)].questoes || []).length === 0 ? (
                              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                Nenhuma questão criada ainda.
                              </p>
                            ) : (
                              sortQuestions(moduleQuizzes[String(module.id)].questoes || []).map((question: any, index: number) => (
                                <div
                                  key={question.id}
                                  className="rounded-[12px] border border-[hsl(var(--border))] p-3 bg-[hsl(var(--card))]"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="font-medium">
                                      {index + 1}. {question.enunciado}
                                    </p>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        className="btn-outline text-xs"
                                        onClick={() => reorderQuestions(moduleQuizzes[String(module.id)].id, question.id, 'up')}
                                        disabled={index === 0}
                                      >
                                        Subir
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-outline text-xs"
                                        onClick={() => reorderQuestions(moduleQuizzes[String(module.id)].id, question.id, 'down')}
                                        disabled={index === sortQuestions(moduleQuizzes[String(module.id)].questoes || []).length - 1}
                                      >
                                        Descer
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-outline text-xs flex items-center gap-1"
                                        onClick={() => startEditQuestion(moduleQuizzes[String(module.id)].id, question)}
                                      >
                                        <FaEdit />
                                        <span>Editar</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-outline text-xs flex items-center gap-1 text-red-600"
                                        onClick={() => deleteQuestion(moduleQuizzes[String(module.id)].id, question.id)}
                                      >
                                        <FaTimes />
                                        <span>Cancelar</span>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                                    <p>A) {question.alternativa_a}</p>
                                    <p>B) {question.alternativa_b}</p>
                                    <p>C) {question.alternativa_c}</p>
                                    <p>D) {question.alternativa_d}</p>
                                    <p className="font-medium text-[hsl(var(--primary))]">
                                      Correta: {String(question.correta || '').toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {module.lessons?.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 mb-3"
                          >
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

                            <div className="grid md:grid-cols-3 gap-2 mb-2">
                              {Array.from({ length: 3 }, (_, index) => (
                                <input
                                  key={`${lesson.id}-image-${index + 1}`}
                                  type="text"
                                  value={lesson.image_urls?.[index] || ''}
                                  onChange={(e) => updateLessonImageState(lesson.id, index, e.target.value)}
                                  onBlur={(e) => updateLessonImage(lesson.id, index, e.target.value)}
                                  className="input-field"
                                  placeholder={`URL da imagem ${index + 1}`}
                                />
                              ))}
                            </div>
                            {/* Botões de inserção */}
                            <div className="flex gap-2 mb-2">
                              <button
                                type="button"
                                onClick={() => handleInsertImage(lesson.id)}
                                className="btn-outline text-sm py-1 px-3 flex items-center gap-1"
                              >
                                📷 Inserir Imagem
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertVideo(lesson.id)}
                                className="btn-outline text-sm py-1 px-3 flex items-center gap-1"
                              >
                                🎬 Inserir Vídeo
                              </button>
                            </div>

                        
                            <RichTextEditor
                              value={lesson.content || ''}
                              onChange={(value) => updateLessonState(lesson.id, { content: value })}
                              onBlur={(value) => updateLesson(lesson.id, { content: value })}
                              minHeight={180}
                              placeholder="Conteúdo da aula (texto, HTML)"
                              className="mb-2"
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
              <div className="flex flex-col gap-3 mb-4">
                <h2 className="text-xl font-semibold">Questionario surpresa</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Voce pode criar apenas 2 questionarios surpresa (4 questoes cada). Use o questionario do modulo para avaliacoes mais profundas.
                </p>
                <div className="grid md:grid-cols-4 gap-2">
                  <select
                    className="input-field"
                    value={surpriseDraft.targetType}
                    onChange={(event) => setSurpriseDraft((prev) => ({ ...prev, targetType: event.target.value as 'aula' | 'modulo' }))}
                  >
                    <option value="aula">Apos uma aula</option>
                    <option value="modulo">Apos um modulo</option>
                  </select>
                  {surpriseDraft.targetType === 'modulo' ? (
                    <select
                      className="input-field md:col-span-2"
                      value={surpriseDraft.moduleId}
                      onChange={(event) => setSurpriseDraft((prev) => ({ ...prev, moduleId: event.target.value }))}
                    >
                      <option value="">Selecione o modulo</option>
                      {modules.map((module) => (
                        <option key={module.id} value={String(module.id)}>{module.title}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="input-field md:col-span-2"
                      value={surpriseDraft.lessonId}
                      onChange={(event) => setSurpriseDraft((prev) => ({ ...prev, lessonId: event.target.value }))}
                    >
                      <option value="">Selecione a aula</option>
                      {surpriseLessonOptions.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.moduleTitle} - {lesson.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    className="btn-outline text-xs"
                    onClick={createSurpriseQuiz}
                    disabled={surpriseQuizzes.length >= 2}
                  >
                    Criar questionario surpresa
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {surpriseQuizzes.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum questionario surpresa criado.</p>
                ) : (
                  surpriseQuizzes.map((quiz: any) => (
                    <div key={quiz.id} className="rounded-[12px] border border-[hsl(var(--border))] p-4 bg-[hsl(var(--card))]">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold">{quiz.titulo}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">4 questoes obrigatorias</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn-outline text-xs" onClick={() => openQuestionDraft(quiz.id)}>Adicionar questao</button>
                          <button type="button" className="btn-outline text-xs" onClick={() => openExtractorDraft(quiz.id)}>Usar extrator (4 questoes)</button>
                          {(quiz.questoes || []).length === 0 ? (
                            <button type="button" className="btn-outline text-xs text-red-600" onClick={() => deleteSurpriseQuiz(quiz.id)}>Cancelar questionario</button>
                          ) : (
                            <button type="button" className="btn-outline text-xs text-red-600" onClick={() => deleteSurpriseQuiz(quiz.id)}>Excluir</button>
                          )}
                        </div>
                      </div>

                      {questionDrafts[quiz.id] && (
                        <div className="border border-[hsl(var(--border))] rounded-[12px] p-4 mb-4">
                          <textarea
                            value={questionDrafts[quiz.id].enunciado || ''}
                            onChange={(event) => updateQuestionDraft(quiz.id, 'enunciado', event.target.value)}
                            className="input-field mb-2"
                            rows={2}
                            placeholder="Enunciado"
                          />
                          {(['a', 'b', 'c', 'd'] as const).map((key) => (
                            <input
                              key={key}
                              className="input-field mb-2"
                              value={questionDrafts[quiz.id]['alternativa_' + key] || ''}
                              onChange={(event) => updateQuestionDraft(quiz.id, 'alternativa_' + key, event.target.value)}
                              placeholder={'Alternativa ' + key.toUpperCase()}
                            />
                          ))}
                          <div className="flex flex-wrap gap-2">
                            <select
                              className="input-field text-sm max-w-[160px]"
                              value={questionDrafts[quiz.id].correta || 'a'}
                              onChange={(event) => updateQuestionDraft(quiz.id, 'correta', event.target.value)}
                            >
                              <option value="a">Correta: A</option>
                              <option value="b">Correta: B</option>
                              <option value="c">Correta: C</option>
                              <option value="d">Correta: D</option>
                            </select>
                            <button type="button" className="btn-accent text-xs" onClick={() => saveQuestion(quiz.id, questionDrafts[quiz.id])}>
                              {questionDrafts[quiz.id]?.id ? 'Atualizar questao' : 'Salvar questao'}
                            </button>
                            <button type="button" className="btn-outline text-xs" onClick={() => cancelQuestionDraft(quiz.id)}>Cancelar</button>
                          </div>
                        </div>
                      )}

                      {extractorDrafts[quiz.id] && (
                        <div className="border border-[hsl(var(--border))] rounded-[12px] p-4 mb-4">
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Cole 4 questoes no formato padrao.</p>
                          <textarea
                            value={extractorDrafts[quiz.id].raw || ''}
                            onChange={(event) => updateExtractorRaw(quiz.id, event.target.value)}
                            className="input-field mb-2"
                            rows={8}
                          />
                          <div className="flex flex-wrap gap-2 mb-2">
                            <button type="button" className="btn-outline text-xs" onClick={() => extractQuestionsFromRaw(quiz.id, 4)}>Extrair questoes</button>
                            <button type="button" className="btn-outline text-xs" onClick={() => saveExtractedQuestions(quiz.id)}>Salvar extraidas</button>
                            <button type="button" className="btn-outline text-xs" onClick={() => closeExtractorDraft(quiz.id)}>Fechar</button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {sortQuestions(quiz.questoes || []).map((question: any, index: number) => (
                          <div key={question.id} className="rounded-[10px] border border-[hsl(var(--border))] p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium">{index + 1}. {question.enunciado}</p>
                              <div className="flex gap-1">
                                <button type="button" className="btn-outline text-xs" onClick={() => startEditQuestion(quiz.id, question)}>Editar</button>
                                <button type="button" className="btn-outline text-xs text-red-600" onClick={() => deleteQuestion(quiz.id, question.id)}>Apagar</button>
                              </div>
                            </div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Correta: {String(question.correta || '').toUpperCase()}</p>
                          </div>
                        ))}
                        {(quiz.questoes || []).length < 4 && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">Faltam {4 - (quiz.questoes || []).length} questao(oes) para completar este questionario surpresa.</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Prova final</h2>
                {finalQuiz ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openQuestionDraft(finalQuiz.id)}
                      className="btn-outline text-xs"
                    >
                      Adicionar questão
                    </button>
                    <button
                      type="button"
                      onClick={() => openExtractorDraft(finalQuiz.id)}
                      className="btn-outline text-xs"
                    >
                      Gerar prova final com extrator de texto
                    </button>
                  </div>
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
                <div className="border border-[hsl(var(--border))] rounded-[12px] p-4 mb-4 bg-[hsl(var(--card))]">
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
                      onClick={() => saveQuestion(finalQuiz.id, questionDrafts[finalQuiz.id])}
                      className="btn-accent text-xs"
                    >
                      {questionDrafts[finalQuiz.id]?.id ? 'Atualizar questão' : 'Salvar questão'}
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelQuestionDraft(finalQuiz.id)}
                      className="btn-outline text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {finalQuiz && extractorDrafts[finalQuiz.id] && (
                <div className="border border-[hsl(var(--border))] rounded-[12px] p-4 mb-4 bg-[hsl(var(--card))]">
                  <h4 className="font-semibold mb-2">Extrator de questoes</h4>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                    Cole no formato: 1. enunciado / a. b. c. d. / Resposta certa: a (maximo 10 questoes).
                  </p>
                  <textarea
                    value={extractorDrafts[finalQuiz.id].raw || ''}
                    onChange={(event) => updateExtractorRaw(finalQuiz.id, event.target.value)}
                    className="input-field mb-3"
                    rows={8}
                    placeholder="1. (enunciado)\na. (alternativa A)\nb. (alternativa B)\nc. (alternativa C)\nd. (alternativa D)\nResposta certa: (a)"
                  />
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <button
                      type="button"
                      className="btn-outline text-xs"
                      onClick={() => extractQuestionsFromRaw(finalQuiz.id, 10)}
                    >
                      Extrair questoes
                    </button>
                    <button
                      type="button"
                      className="btn-outline text-xs"
                      onClick={downloadQuestionTemplate}
                    >
                      Baixar modelo
                    </button>
                    <button
                      type="button"
                      className="btn-outline text-xs"
                      onClick={() => closeExtractorDraft(finalQuiz.id)}
                    >
                      Fechar extrator
                    </button>
                  </div>

                  {(extractorDrafts[finalQuiz.id].questions || []).length > 0 && (
                    <div className="space-y-3">
                      {extractorDrafts[finalQuiz.id].questions.map((question: any, index: number) => (
                        <div key={index} className="rounded-[10px] border border-[hsl(var(--border))] p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Questao {index + 1}</p>
                            <button
                              type="button"
                              className="btn-outline text-xs text-red-600"
                              onClick={() => removeExtractedQuestion(finalQuiz.id, index)}
                            >
                              Apagar
                            </button>
                          </div>
                          <textarea
                            className="input-field mb-2"
                            rows={2}
                            value={question.enunciado || ''}
                            onChange={(event) =>
                              updateExtractedQuestion(finalQuiz.id, index, 'enunciado', event.target.value)
                            }
                            placeholder="Enunciado"
                          />
                          {(['a', 'b', 'c', 'd'] as const).map((key) => (
                            <input
                              key={key}
                              type="text"
                              className="input-field mb-2"
                              value={question['alternativa_' + key] || ''}
                              onChange={(event) =>
                                updateExtractedQuestion(finalQuiz.id, index, 'alternativa_' + key, event.target.value)
                              }
                              placeholder={'Alternativa ' + key.toUpperCase()}
                            />
                          ))}
                          <select
                            className="input-field text-sm max-w-[160px]"
                            value={question.correta || 'a'}
                            onChange={(event) =>
                              updateExtractedQuestion(finalQuiz.id, index, 'correta', event.target.value)
                            }
                          >
                            <option value="a">Correta: A</option>
                            <option value="b">Correta: B</option>
                            <option value="c">Correta: C</option>
                            <option value="d">Correta: D</option>
                          </select>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="btn-accent text-xs"
                          onClick={() => saveExtractedQuestions(finalQuiz.id)}
                        >
                          Salvar questoes extraidas
                        </button>
                        <button
                          type="button"
                          className="btn-outline text-xs"
                          onClick={() => closeExtractorDraft(finalQuiz.id)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {finalQuiz && (
                <div className="space-y-3">
                  {(finalQuiz.questoes || []).length === 0 ? (
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Nenhuma questão criada ainda.
                    </p>
                  ) : (
                    sortQuestions(finalQuiz.questoes || []).map((question: any, index: number) => (
                      <div
                        key={question.id}
                        className="rounded-[12px] border border-[hsl(var(--border))] p-3 bg-[hsl(var(--card))]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium">
                            {index + 1}. {question.enunciado}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              className="btn-outline text-xs"
                              onClick={() => reorderQuestions(finalQuiz.id, question.id, 'up')}
                              disabled={index === 0}
                            >
                              Subir
                            </button>
                            <button
                              type="button"
                              className="btn-outline text-xs"
                              onClick={() => reorderQuestions(finalQuiz.id, question.id, 'down')}
                              disabled={index === sortQuestions(finalQuiz.questoes || []).length - 1}
                            >
                              Descer
                            </button>
                            <button
                              type="button"
                              className="btn-outline text-xs flex items-center gap-1"
                              onClick={() => startEditQuestion(finalQuiz.id, question)}
                            >
                              <FaEdit />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              className="btn-outline text-xs flex items-center gap-1 text-red-600"
                              onClick={() => deleteQuestion(finalQuiz.id, question.id)}
                            >
                              <FaTimes />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                          <p>A) {question.alternativa_a}</p>
                          <p>B) {question.alternativa_b}</p>
                          <p>C) {question.alternativa_c}</p>
                          <p>D) {question.alternativa_d}</p>
                          <p className="font-medium text-[hsl(var(--primary))]">
                            Correta: {String(question.correta || '').toUpperCase()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
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
