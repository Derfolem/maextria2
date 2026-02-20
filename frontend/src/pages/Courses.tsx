import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Course, Trilha } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';
import {
  FaSearch,
  FaTimes,
  FaThLarge,
  FaList,
  FaClock,
  FaGraduationCap,
  FaChevronDown,
  FaChevronUp,
  FaFire,
  FaStar,
  FaBookOpen,
  FaRoute,
  FaPlay
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeCourse } from '../lib/normalizeCourse';
import { SEO } from '../components/SEO';
import StarRating from '../components/StarRating';
import { trackSearch } from '../lib/analytics';
import { stripHtml } from '../lib/text';

type SortOption = 'popular' | 'recent' | 'az' | 'za';
type ViewMode = 'grid' | 'list';

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const levenshtein = (a: string, b: string) => {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;
  if (!aLen) return bLen;
  if (!bLen) return aLen;

  const dp = Array.from({ length: aLen + 1 }, () => new Array(bLen + 1).fill(0));
  for (let i = 0; i <= aLen; i += 1) dp[i][0] = i;
  for (let j = 0; j <= bLen; j += 1) dp[0][j] = j;

  for (let i = 1; i <= aLen; i += 1) {
    for (let j = 1; j <= bLen; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[aLen][bLen];
};

const SORT_OPTIONS = [
  { value: 'popular', label: 'Mais procurados', icon: FaFire },
  { value: 'recent', label: 'Mais recentes', icon: FaClock },
  { value: 'az', label: 'A - Z', icon: FaBookOpen },
  { value: 'za', label: 'Z - A', icon: FaBookOpen },
];

const DURATION_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: '0-5', label: 'Até 5 horas' },
  { value: '5-10', label: '5 - 10 horas' },
  { value: '10-20', label: '10 - 20 horas' },
  { value: '20+', label: '+20 horas' },
];

const LEVEL_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'Iniciante', label: 'Iniciante' },
  { value: 'Intermediário', label: 'Intermediário' },
  { value: 'Avançado', label: 'Avançado' },
];

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trilhas
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [showTrilhas, setShowTrilhas] = useState(searchParams.get('filter') === 'trilhas');
  const [selectedTrilha, setSelectedTrilha] = useState<string>(searchParams.get('trilha') || '');
  const [cursoTrilhaMap, setCursoTrilhaMap] = useState<Record<string, Trilha[]>>({});
  const [enrollingTrilha, setEnrollingTrilha] = useState<string | null>(null);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [selectedLevel, setSelectedLevel] = useState<string>(searchParams.get('level') || '');
  const [durationRange, setDurationRange] = useState<string>(searchParams.get('duration') || '');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'popular');
  const [visibleCount, setVisibleCount] = useState(6);

  // Secoes colapsaveis
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    level: true,
    duration: true,
    trilhas: true,
  });

  useEffect(() => {
    loadCourses();
    loadTrilhas();
  }, []);

  // Sincronizar URL com filtros
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedLevel) params.set('level', selectedLevel);
    if (durationRange) params.set('duration', durationRange);
    if (sortBy !== 'popular') params.set('sort', sortBy);
    if (showTrilhas) params.set('filter', 'trilhas');
    if (selectedTrilha) params.set('trilha', selectedTrilha);
    setSearchParams(params, { replace: true });
  }, [search, selectedCategory, selectedLevel, durationRange, sortBy, showTrilhas, selectedTrilha, setSearchParams]);

  useEffect(() => {
    if (!search.trim()) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      trackSearch(search.trim());
    }, 600);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [search]);

  useEffect(() => {
    setVisibleCount(6);
  }, [search, selectedCategory, selectedLevel, durationRange, sortBy, showTrilhas]);

  const loadTrilhas = async () => {
    try {
      const { data, error } = await supabase
        .from('trilhas')
        .select(`
          *,
          trilha_cursos(
            *,
            cursos(*)
          )
        `)
        .eq('ativa', true);

      if (error) throw error;

      const trilhasNormalizadas = (data || []).map(t => ({
        ...t,
        cursos: t.trilha_cursos?.map((tc: any) => ({
          ...tc,
          curso: tc.cursos ? normalizeCourse(tc.cursos) : null,
        })) || [],
      }));

      setTrilhas(trilhasNormalizadas);

      // Criar mapa de curso -> trilhas
      const map: Record<string, Trilha[]> = {};
      trilhasNormalizadas.forEach(trilha => {
        trilha.cursos?.forEach((tc: any) => {
          if (!map[tc.curso_id]) {
            map[tc.curso_id] = [];
          }
          map[tc.curso_id].push(trilha);
        });
      });
      setCursoTrilhaMap(map);
    } catch (error) {
      console.error('Erro ao carregar trilhas:', error);
    }
  };

  const handleIniciarTrilha = async (trilhaId: string) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/courses?filter=trilhas&trilha=${trilhaId}`);
      return;
    }

    setEnrollingTrilha(trilhaId);
    try {
      const { data, error } = await supabase.rpc('matricular_trilha', {
        p_trilha_id: trilhaId,
      });

      if (error) throw error;

      toast.success(`Matriculado em ${data.cursos_matriculados} curso(s)!`);
      navigate('/student/dashboard');
    } catch (error: any) {
      console.error('Erro ao matricular na trilha:', error);
      toast.error(error?.message || 'Erro ao iniciar trilha');
    } finally {
      setEnrollingTrilha(null);
    }
  };

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('ativo', true);
      if (error) throw error;

      // Filtrar para mostrar apenas a versão mais recente de cada curso
      // Agrupa por curso_original_id (ou id se for original) e mantém a maior versão
      const latestVersions = (data || []).reduce((acc: Record<string, any>, course) => {
        // O identificador do curso raiz é curso_original_id se existir, senão é o próprio id
        const rootId = course.curso_original_id || course.id;
        const key = String(rootId);
        const courseVersion = course.versao || 1;
        const existingVersion = acc[key]?.versao || 0;

        // Manter apenas a versão mais alta
        if (!acc[key] || courseVersion > existingVersion) {
          acc[key] = course;
        }
        return acc;
      }, {});

      setCourses(Object.values(latestVersions).map(normalizeCourse));
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extrair categorias únicas
  const categories = useMemo(() => {
    const cats = courses.map((c) => c.category).filter(Boolean) as string[];
    return [...new Set(cats)].sort();
  }, [courses]);

  // Sugestões de busca
  const suggestions = useMemo(() => {
    if (!search || search.length < 2) return [];
    const searchLower = normalizeText(search);
    const titleMatches = courses
      .filter((c) => normalizeText(c.title).includes(searchLower))
      .slice(0, 5)
      .map((c) => ({ type: 'course' as const, text: c.title, id: c.id }));
    const categoryMatches = categories
      .filter((c) => normalizeText(c).includes(searchLower))
      .slice(0, 3)
      .map((c) => ({ type: 'category' as const, text: c }));
    return [...titleMatches, ...categoryMatches];
  }, [search, courses, categories]);

  // Filtrar e ordenar cursos
  const filteredCourses = useMemo(() => {
    const normalizedQuery = normalizeText(search);
    const tokens = normalizedQuery ? normalizedQuery.split(' ').filter(Boolean) : [];

    const scoreCourse = (course: Course) => {
      if (!tokens.length) return 0;
      const fields = [
        course.title,
        stripHtml(course.description),
        course.teacher_name || '',
        course.category || '',
      ];
      let score = 0;
      fields.forEach((field) => {
        const hay = normalizeText(field || '');
        if (!hay) return;
        tokens.forEach((token) => {
          const idx = hay.indexOf(token);
          if (idx >= 0) {
            score += 2 + token.length / Math.max(hay.length, 1) + 1 / (idx + 1);
          } else if (token.length > 3) {
            const dist = levenshtein(token, hay.slice(0, Math.min(hay.length, token.length + 2)));
            if (dist <= 2) score += 0.5;
          }
        });
      });
      return score;
    };

    let result = courses
      .map((course) => ({ course, score: scoreCourse(course) }))
      .filter(({ course, score }) => {
        if (tokens.length && score <= 0) return false;
        const categoryMatch = !selectedCategory || course.category === selectedCategory;
        const levelMatch = !selectedLevel || course.level === selectedLevel;

        let durationMatch = true;
        if (durationRange) {
          const hours = course.duration_hours || 0;
          switch (durationRange) {
            case '0-5': durationMatch = hours <= 5; break;
            case '5-10': durationMatch = hours > 5 && hours <= 10; break;
            case '10-20': durationMatch = hours > 10 && hours <= 20; break;
            case '20+': durationMatch = hours > 20; break;
          }
        }

        return categoryMatch && levelMatch && durationMatch;
      });

    const sortBase = (a: Course, b: Course) => {
      switch (sortBy) {
        case 'popular': return (b.enrollment_count || 0) - (a.enrollment_count || 0);
        case 'recent': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'az': return a.title.localeCompare(b.title);
        case 'za': return b.title.localeCompare(a.title);
      }
      return 0;
    };

    if (tokens.length) {
      result = result.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return sortBase(a.course, b.course);
      });
    } else {
      result = result.sort((a, b) => sortBase(a.course, b.course));
    }

    return result.map((item) => item.course);
  }, [courses, search, selectedCategory, selectedLevel, durationRange, sortBy]);

  const activeFiltersCount = [selectedCategory, selectedLevel, durationRange, showTrilhas ? 'trilhas' : ''].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedLevel('');
    setDurationRange('');
    setSortBy('popular');
    setShowTrilhas(false);
    setSelectedTrilha('');
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Componente de Sidebar de Filtros
  const FilterSidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`space-y-6 ${mobile ? '' : 'sticky top-24'}`}>
      {/* Categorias */}
      <div className="card p-4">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full text-left font-semibold mb-3"
        >
          <span className="flex items-center gap-2">
            <FaGraduationCap className="text-[hsl(var(--primary))]" />
            Categorias
          </span>
          {expandedSections.category ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        <AnimatePresence>
          {expandedSections.category && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  !selectedCategory
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'hover:bg-[hsl(var(--muted))]'
                }`}
              >
                Todas as categorias
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedCategory === cat
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nível */}
      <div className="card p-4">
        <button
          onClick={() => toggleSection('level')}
          className="flex items-center justify-between w-full text-left font-semibold mb-3"
        >
          <span className="flex items-center gap-2">
            <FaStar className="text-[hsl(var(--accent))]" />
            Nível
          </span>
          {expandedSections.level ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        <AnimatePresence>
          {expandedSections.level && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedLevel(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedLevel === opt.value
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Duração */}
      <div className="card p-4">
        <button
          onClick={() => toggleSection('duration')}
          className="flex items-center justify-between w-full text-left font-semibold mb-3"
        >
          <span className="flex items-center gap-2">
            <FaClock className="text-[hsl(var(--muted-foreground))]" />
            Duração
          </span>
          {expandedSections.duration ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        <AnimatePresence>
          {expandedSections.duration && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDurationRange(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    durationRange === opt.value
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trilhas */}
      {trilhas.length > 0 && (
        <div className="card p-4">
          <button
            onClick={() => toggleSection('trilhas')}
            className="flex items-center justify-between w-full text-left font-semibold mb-3"
          >
            <span className="flex items-center gap-2">
              <FaRoute className="text-orange-500" />
              Trilhas
            </span>
            {expandedSections.trilhas ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          <AnimatePresence>
            {expandedSections.trilhas && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1 overflow-hidden"
              >
                <button
                  onClick={() => {
                    setShowTrilhas(!showTrilhas);
                    setSelectedTrilha('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    showTrilhas && !selectedTrilha
                      ? 'bg-orange-500 text-white'
                      : 'hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  Ver todas as trilhas
                </button>
                {trilhas.map((trilha) => (
                  <button
                    key={trilha.id}
                    onClick={() => {
                      setShowTrilhas(true);
                      setSelectedTrilha(trilha.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      selectedTrilha === trilha.id
                        ? 'bg-orange-500 text-white'
                        : 'hover:bg-[hsl(var(--muted))]'
                    }`}
                  >
                    {trilha.nome}
                    <span className="text-xs opacity-70 ml-1">
                      ({trilha.cursos?.length || 0})
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Limpar filtros */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full btn-outline text-sm"
        >
          <FaTimes className="mr-2" />
          Limpar filtros ({activeFiltersCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      <SEO
        title="Cursos Online com Certificado Reconhecido | MAEXTRIA"
        description="Explore nossa biblioteca com centenas de cursos online. Tecnologia, programação, negócios, design e desenvolvimento pessoal."
        url="https://www.maextria.com.br/courses"
        image="https://www.maextria.com.br/maextria-logo.png"
        keywords={['catálogo de cursos', 'cursos online certificados', 'cursos de tecnologia']}
      />

      <div className="min-h-screen">
        {/* Hero com busca */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[hsl(var(--background))] to-[hsl(var(--card))]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.1),_transparent_50%)]" />
          <div className="relative max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))] mb-4">
                Catálogo MAEXTRIA
              </p>
              <h1 className="headline-font text-4xl md:text-5xl lg:text-6xl mb-4">
                Encontre seu próximo
                <span className="block gradient-text">curso ideal</span>
              </h1>
              <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
                {courses.length} cursos disponíveis para transformar sua carreira
              </p>
            </motion.div>

            {/* Barra de busca profissional */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-3xl mx-auto relative"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-2xl blur-xl opacity-20" />
                <div className="relative bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2">
                  <div className="flex-1 flex items-center w-full">
                    <FaSearch className="ml-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      ref={searchRef}
                      type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="O que você quer aprender hoje?"
                      className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-base sm:text-lg placeholder:text-[hsl(var(--muted-foreground))]"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                          className="p-2 hover:bg-[hsl(var(--muted))] rounded-full transition mr-2"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                    <button className="btn-primary rounded-xl px-6 w-full sm:w-auto whitespace-nowrap">
                      Buscar
                    </button>
                  </div>

                  {/* Sugestões */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-2xl overflow-hidden z-50"
                      >
                        {suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (sug.type === 'course') {
                                window.location.href = `/courses/${sug.id}`;
                              } else {
                                setSelectedCategory(sug.text);
                                setSearch('');
                              }
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--muted))] transition text-left"
                          >
                            {sug.type === 'course' ? (
                              <FaBookOpen className="text-[hsl(var(--primary))]" />
                            ) : (
                              <FaGraduationCap className="text-[hsl(var(--secondary))]" />
                            )}
                            <div>
                              <p className="font-medium">{sug.text}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                {sug.type === 'course' ? 'Curso' : 'Categoria'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Tags populares */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Populares:</span>
                {categories.slice(0, 5).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      selectedCategory === cat
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                        : 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Conteúdo principal */}
        <section className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-12">
          <div className="flex gap-8">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <FilterSidebar />
            </aside>

            {/* Lista de cursos */}
            <div className="flex-1 min-w-0">
              {/* Barra de controles */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {/* Botão filtros mobile */}
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden btn-outline flex items-center gap-2"
                  >
                    <FaGraduationCap />
                    Filtros
                    {activeFiltersCount > 0 && (
                      <span className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    <span className="font-semibold text-[hsl(var(--foreground))]">{filteredCourses.length}</span> cursos
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Ordenação */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="input-field text-sm py-2 pr-8"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {/* Toggle view */}
                  <div className="hidden md:flex items-center bg-[hsl(var(--muted))] rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition ${
                        viewMode === 'grid' ? 'bg-[hsl(var(--card))] shadow' : ''
                      }`}
                    >
                      <FaThLarge />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition ${
                        viewMode === 'list' ? 'bg-[hsl(var(--card))] shadow' : ''
                      }`}
                    >
                      <FaList />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filtros ativos */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm">
                      <FaGraduationCap className="text-xs" />
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory('')}>
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  )}
                  {selectedLevel && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] text-sm">
                      <FaStar className="text-xs" />
                      {selectedLevel}
                      <button onClick={() => setSelectedLevel('')}>
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  )}
                  {durationRange && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--muted-foreground))]/10 text-[hsl(var(--muted-foreground))] text-sm">
                      <FaClock className="text-xs" />
                      {DURATION_OPTIONS.find((d) => d.value === durationRange)?.label}
                      <button onClick={() => setDurationRange('')}>
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  )}
                  {showTrilhas && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-sm">
                      <FaRoute className="text-xs" />
                      {selectedTrilha ? trilhas.find(t => t.id === selectedTrilha)?.nome : 'Trilhas'}
                      <button onClick={() => { setShowTrilhas(false); setSelectedTrilha(''); }}>
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Visualizacao de Trilhas */}
              {showTrilhas && !loading && (
                <div className="space-y-8 mb-8">
                  {(selectedTrilha
                    ? trilhas.filter(t => t.id === selectedTrilha)
                    : trilhas
                  ).map((trilha) => (
                    <motion.div
                      key={trilha.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card p-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FaRoute className="text-orange-500" />
                            <h2 className="text-xl font-semibold">{trilha.nome}</h2>
                          </div>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            {trilha.cursos?.length || 0} curso(s) nesta trilha
                          </p>
                        </div>
                        <button
                          onClick={() => handleIniciarTrilha(trilha.id)}
                          disabled={enrollingTrilha === trilha.id}
                          className="btn-accent flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          <FaPlay className="text-sm" />
                          {enrollingTrilha === trilha.id ? 'Matriculando...' : 'Iniciar Trilha'}
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trilha.cursos?.sort((a: any, b: any) => a.ordem - b.ordem).map((tc: any) => {
                          const course = tc.curso;
                          if (!course) return null;
                          return (
                            <Link
                              key={tc.id}
                              to={`/courses/${course.id}`}
                              className="group flex gap-3 p-3 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] transition"
                            >
                              <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                                {course.thumbnail ? (
                                  <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))]">
                                    <span className="text-lg font-bold text-white">
                                      {course.title?.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate group-hover:text-[hsl(var(--primary))] transition">
                                  {course.title}
                                </p>
                                {course.duration_hours && (
                                  <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-1">
                                    <FaClock className="text-xs" />
                                    {course.duration_hours}h
                                  </p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}

                  {trilhas.length === 0 && (
                    <div className="text-center py-12">
                      <FaRoute className="text-4xl text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                      <p className="text-[hsl(var(--muted-foreground))]">
                        Nenhuma trilha disponivel no momento
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Grid/Lista de cursos (oculto quando visualizando trilhas) */}
              {loading ? (
                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="card p-6">
                      <div className="w-full h-48 bg-[hsl(var(--muted))] rounded-lg mb-4 shimmer" />
                      <div className="h-6 bg-[hsl(var(--muted))] rounded mb-2 shimmer" />
                      <div className="h-4 bg-[hsl(var(--muted))] rounded shimmer" />
                    </div>
                  ))}
                </div>
              ) : showTrilhas ? null : filteredCourses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
                    <FaSearch className="text-3xl text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Nenhum curso encontrado</h3>
                  <p className="text-[hsl(var(--muted-foreground))] mb-6">
                    Tente ajustar os filtros ou buscar por outro termo
                  </p>
                  <button onClick={clearFilters} className="btn-primary">
                    Limpar filtros
                  </button>
                </motion.div>
              ) : viewMode === 'grid' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {filteredCourses.slice(0, visibleCount).map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={`/courses/${course.id}`}
                        className="card group block p-0 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))]">
                              <span className="text-5xl font-bold text-white">{course.title.charAt(0)}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
                          {course.category && (
                            <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-xs">
                              {course.category}
                            </span>
                          )}
                          {cursoTrilhaMap[String(course.id)]?.length > 0 && (
                            <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-orange-500 text-white text-xs font-medium">
                              Trilha
                            </span>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-[hsl(var(--primary))] transition line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-4">
                            {stripHtml(course.description)}
                          </p>
                          <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
                            <StarRating value={course.rating || 4.3} readonly size="sm" showValue />
                            {(course.duration_hours !== undefined && course.duration_hours !== null) && (
                              <span className="flex items-center gap-1">
                                <FaClock className="text-xs" />
                                {course.duration_hours}h
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {filteredCourses.slice(0, visibleCount).map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Link
                        to={`/courses/${course.id}`}
                        className="card group flex gap-6 p-4 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))]">
                              <span className="text-3xl font-bold text-white">{course.title.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 py-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              {course.category && (
                                <span className="text-xs text-[hsl(var(--primary))] font-medium">
                                  {course.category}
                                </span>
                              )}
                              <h3 className="font-semibold text-lg group-hover:text-[hsl(var(--primary))] transition">
                                {course.title}
                              </h3>
                            </div>
                          </div>
                          <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mt-2">
                            {stripHtml(course.description)}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                            <StarRating value={course.rating || 4.3} readonly size="sm" showValue />
                            {(course.duration_hours !== undefined && course.duration_hours !== null) && (
                              <span className="flex items-center gap-1">
                                <FaClock className="text-xs" />
                                {course.duration_hours}h
                              </span>
                            )}
                            {course.teacher_name && (
                              <span>{course.teacher_name}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {visibleCount < filteredCourses.length && (
                <div className="flex justify-center mt-8">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="btn-outline px-6 py-2 text-sm flex items-center gap-2 hover:bg-[hsl(var(--muted))] transition"
                  >
                    <FaChevronDown className="text-xs" /> Carregar mais
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Modal de filtros mobile */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFiltersOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed left-0 top-0 bottom-0 w-80 bg-[hsl(var(--background))] z-50 lg:hidden overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Filtros</h2>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <FilterSidebar mobile />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
