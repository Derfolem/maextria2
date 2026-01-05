import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../types';
import { supabase } from '../lib/supabase';
import { FaSearch } from 'react-icons/fa';
import { normalizeCourse } from '../lib/normalizeCourse';

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('ativo', true);
      if (error) {
        throw error;
      }
      setCourses((data || []).map(normalizeCourse));
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(80px,10vh,160px)]">
          <div className="flex flex-col items-center text-center gap-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Catálogo MAEXTRIA</p>
            <h1 className="headline-font text-4xl md:text-5xl section-title">
              Cursos para aprender,
              <span className="block gradient-text"> aplicar e expandir</span>
            </h1>
            <p className="text-base text-[hsl(var(--muted-foreground))] max-w-xl">
              Curadoria profissional com foco em clareza, método e aplicação real no mercado.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] pb-[clamp(80px,10vh,160px)]">
        <div className="card mb-10 p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-3 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busque por habilidades, temas ou instrutores..."
                className="input-field pl-12 w-full text-base"
              />
            </div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              {filteredCourses.length} cursos encontrados
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-6">
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 shimmer"></div>
                <div className="h-6 bg-gray-200 rounded mb-2 shimmer"></div>
                <div className="h-4 bg-gray-200 rounded shimmer"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="card group p-6 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition"
              >
                <div className="w-full aspect-[16/10] rounded-[12px] mb-5 overflow-hidden bg-[hsl(var(--foreground))] text-white flex items-center justify-center text-4xl font-bold">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--foreground))] to-[hsl(var(--accent))]">
                      {course.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                    <span className="rounded-full bg-[hsl(var(--secondary))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--secondary-foreground))]">
                      {course.category || 'Trilha'}
                    </span>
                    <span>{course.enrollment_count || 0} alunos</span>
                  </div>
                  <h3 className="text-xl font-semibold group-hover:text-[hsl(var(--primary))] transition">
                    {course.title}
                  </h3>
                  <p className="text-[hsl(var(--muted-foreground))] line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
                    <span>{course.teacher_name || 'Instrutor MAEXTRIA'}</span>
                    <span className="text-[hsl(var(--primary))] font-semibold">
                      {course.price === 0 ? 'Sem custo' : `R$ ${course.price.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#0b1b2b]/60 text-lg">Nenhum curso encontrado</p>
          </div>
        )}
      </section>
    </div>
  );
}
