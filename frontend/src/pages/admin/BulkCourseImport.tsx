import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTimes, FaSearch, FaUpload, FaCheck } from 'react-icons/fa';
import { parseBulkCourseText } from '../../lib/courseTextParser';
import { Course } from '../../types';
import api from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { stripHtml } from '../../lib/text';

const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

interface ImportResult {
  title: string;
  course_id: string;
  modules: number;
  lessons: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

export default function BulkCourseImport({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuthStore();
  const [rawText, setRawText] = useState('');
  const [parsedCourses, setParsedCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);

  useEffect(() => {
    if (USE_LOCAL_AUTH) {
      api.get('/users?role=teacher').then(res => {
        setTeachers(res.data);
        if (res.data.length > 0) setSelectedTeacherId(res.data[0].id);
      }).catch(() => {});
    }
  }, []);

  const handlePreview = () => {
    if (!rawText.trim()) {
      toast.error('O campo de texto está vazio');
      return;
    }
    try {
      // Pass currentUserId and currentUserName to the parser (SAME AS CourseCreatorGlass)
      const courses = parseBulkCourseText(rawText, user?.id || '', user?.name || '');
      if (courses.length === 0) {
        toast.error('Nenhum curso válido encontrado. Verifique o formato.');
        setParsedCourses([]);
        return;
      }
      setParsedCourses(courses);
      setResults(null);
      toast.success(`${courses.length} curso(s) extraído(s) com sucesso!`);
    } catch (error) {
      console.error('Error parsing text:', error);
      toast.error('Erro ao processar o texto. Verifique o console e o formato.');
      setParsedCourses([]);
    }
  };

  const handleImport = async () => {
    if (parsedCourses.length === 0) {
      toast.error('Faça o preview primeiro');
      return;
    }
    setImporting(true);
    try {
      if (USE_LOCAL_AUTH) {
        const payload = {
          courses: parsedCourses.map(c => ({
            title: c.title,
            description: c.description,
            difficulty: c.level || 'beginner',
            price: c.price,
            certificate_price: c.price,
            duration_hours: c.duration_hours || null,
            modules: c.modules?.map(m => ({
              title: m.title,
              description: m.description,
              order_index: m.order_index,
              lessons: m.lessons?.map(l => ({
                title: l.title,
                content: l.content,
                video_url: l.video_url,
                order_index: l.order_index,
              })),
            })),
          })),
          teacher_id: selectedTeacherId || undefined,
        };

        const response = await api.post('/courses/bulk', payload);
        setResults(response.data.results);
        toast.success(response.data.message);
        onSuccess();
      } else {
        // Supabase: 3 requests totais via batch insert
        const now = Date.now();

        const coursePayloads = parsedCourses.map((course, ci) => ({
          titulo: course.title,
          slug: course.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + (now + ci),
          descricao: course.description,
          preco_certificado: course.price,
          nivel: course.level || 'beginner',
          professor_id: selectedTeacherId || user?.id || null,
          carga_horaria_horas: course.duration_hours || null,
          ativo: false,
          em_curadoria: false,
        }));

        const { data: createdCourses, error: coursesError } = await supabase
          .from('cursos').insert(coursePayloads).select('id');
        if (coursesError) throw coursesError;

        // Monta todos os módulos de uma vez
        const modulePayloads: any[] = [];
        const moduleSourceMap: { courseIdx: number; moduleIdx: number }[] = [];

        parsedCourses.forEach((course, ci) => {
          course.modules?.forEach((mod, mi) => {
            modulePayloads.push({
              curso_id: createdCourses[ci].id,
              titulo_modulo: mod.title,
              conteudo_texto_html: mod.description,  // SAME AS CourseCreatorGlass (no || null)
              ordem: mod.order_index,
            });
            moduleSourceMap.push({ courseIdx: ci, moduleIdx: mi });
          });
        });

        let createdModules: any[] = [];
        if (modulePayloads.length > 0) {
          const { data, error } = await supabase.from('modulos').insert(modulePayloads).select('id');
          if (error) throw error;
          createdModules = data;
        }

        // Monta todas as aulas de uma vez
        const lessonPayloads: any[] = [];
        createdModules.forEach((mod, mi) => {
          const { courseIdx, moduleIdx } = moduleSourceMap[mi];
          const lessons = parsedCourses[courseIdx].modules?.[moduleIdx]?.lessons || [];
          lessons.forEach(lesson => {
            lessonPayloads.push({
              modulo_id: mod.id,
              titulo: lesson.title,
              conteudo_html: lesson.content,  // SAME AS CourseCreatorGlass (no || null)
              video_url: lesson.video_url,    // SAME AS CourseCreatorGlass (no || null)
              ordem: lesson.order_index,
            });
          });
        });

        if (lessonPayloads.length > 0) {
          const { error } = await supabase.from('aulas').insert(lessonPayloads);
          if (error) throw error;
        }

        const importedResults: ImportResult[] = parsedCourses.map((course, ci) => ({
          title: course.title,
          course_id: String(createdCourses[ci].id),
          modules: course.modules?.length || 0,
          lessons: course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0,
        }));

        setResults(importedResults);
        toast.success(`${importedResults.length} curso(s) importado(s) com sucesso`);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Erro ao importar cursos');
    } finally {
      setImporting(false);
    }
  };

  const totalLessons = parsedCourses.reduce((acc, c) =>
    acc + (c.modules?.reduce((a, m) => a + (m.lessons?.length || 0), 0) || 0), 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div>
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Importação em massa</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Separe cursos com <code className="bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded text-xs">===</code> numa linha própria
            </p>
          </div>
          <button onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Textarea */}
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Título do Curso: Meu Primeiro Curso
Descrição do Curso: Uma descrição completa
Nível: Iniciante
Preço: 49.90

Módulo 1: Fundamentos
### Aula 1: Introdução
Conteúdo da primeira aula...

===

Título do Curso: Segundo Curso
Descrição do Curso: Outro curso aqui
...`}
            className="w-full h-48 p-3 border border-[hsl(var(--border))] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm font-mono bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]"
          />

          {/* Teacher select */}
          {USE_LOCAL_AUTH && teachers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                Professor (aplica a todos os cursos)
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="input-field w-full"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.email}</option>
                ))}
              </select>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={!rawText.trim() || !!results}
              className="btn-outline flex items-center gap-2 disabled:opacity-40"
            >
              <FaSearch /> Extrair e Preview
            </button>
            <button
              onClick={handleImport}
              disabled={parsedCourses.length === 0 || importing || !!results}
              className="btn-accent flex items-center gap-2 disabled:opacity-40"
            >
              {importing ? 'Importando...' : <><FaUpload /> Importar</>}
            </button>
          </div>

          {/* Preview dos cursos extraídos */}
          {parsedCourses.length > 0 && !results && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Preview — {parsedCourses.length} curso(s)
                </p>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {parsedCourses.reduce((a, c) => a + (c.modules?.length || 0), 0)} módulos • {totalLessons} aulas
                </span>
              </div>
              <div className="space-y-2">
                {parsedCourses.map((course, i) => (
                  <div key={i} className="border border-[hsl(var(--border))] bg-[hsl(var(--muted))] rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{course.title || '(sem título)'}</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {course.modules?.length || 0} mód • {course.modules?.reduce((a, m) => a + (m.lessons?.length || 0), 0) || 0} aulas
                      </span>
                    </div>
                    {course.description && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                        {stripHtml(course.description)}
                      </p>
                    )}
                    {course.modules?.map((mod, mi) => (
                      <div key={mi} className="mt-2 ml-4">
                        <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{mod.title}</p>
                        {mod.lessons?.map((lesson, li) => (
                          <p key={li} className="text-xs text-[hsl(var(--muted-foreground))] ml-3 opacity-70">
                            • {lesson.title}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultado após importação */}
          {results && (
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--primary))] mb-3 flex items-center gap-2">
                <FaCheck /> Importação concluída — {results.length} curso(s) criado(s)
              </p>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="border border-[hsl(var(--border))] bg-[hsl(var(--muted))] rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">{r.title}</span>
                    <span className="text-xs text-[hsl(var(--primary))]">
                      {r.modules} módulo(s) • {r.lessons} aula(s)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
