import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Enrollment } from '../../types';
import api from '../../lib/api';
import { FaPlay, FaCertificate } from 'react-icons/fa';
import { normalizeEnrollment } from '../../lib/normalizeEnrollment';

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const response = await api.get('/enrollments/my');
      setEnrollments(response.data.map(normalizeEnrollment));
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (filter === 'in-progress') return !enrollment.completed;
    if (filter === 'completed') return enrollment.completed;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Meus cursos</p>
          <h1 className="headline-font text-4xl md:text-5xl">Sua trilha ativa</h1>
        </div>
        <Link to="/courses" className="btn-accent">
          Explorar cursos
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'btn-accent' : 'btn-outline'}
        >
          Todos ({enrollments.length})
        </button>
        <button
          onClick={() => setFilter('in-progress')}
          className={filter === 'in-progress' ? 'btn-accent' : 'btn-outline'}
        >
          Em andamento ({enrollments.filter((e) => !e.completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'btn-accent' : 'btn-outline'}
        >
          Concluidos ({enrollments.filter((e) => e.completed).length})
        </button>
      </div>

      {filteredEnrollments.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))] mb-4">Nenhum curso encontrado</p>
          <Link to="/courses" className="btn-accent">
            Explorar Cursos
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-grow mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold mb-2">
                    {enrollment.course?.title}
                  </h3>
                  <p className="text-[hsl(var(--muted-foreground))] mb-3">
                    {enrollment.course?.description}
                  </p>
                  <div className="w-full bg-[hsl(var(--muted))] rounded-full h-3">
                    <div
                      className="bg-[hsl(var(--primary))] h-3 rounded-full transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                    Progresso: {enrollment.progress}%
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/student/course/${enrollment.course_id}`}
                    className="btn-accent flex items-center space-x-2"
                  >
                    <FaPlay />
                    <span>{enrollment.completed ? 'Revisar' : 'Continuar'}</span>
                  </Link>
                  {enrollment.completed && (
                    <button className="btn-outline flex items-center space-x-2">
                      <FaCertificate />
                      <span>Certificado</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
