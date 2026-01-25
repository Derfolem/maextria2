import { Link } from "react-router-dom";

export default function CourseCard({ course }: { course: any }) {
  return (
    <Link to={`/curso/${course.slug}`} className="block rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
      {course.imagem_capa_url && (
        <div className="relative w-full h-48 bg-white/5 overflow-hidden">
          <img 
            src={course.imagem_capa_url} 
            alt={course.titulo}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{course.titulo}</h3>
        <p className="text-white/70 text-sm mt-2 line-clamp-2">{course.descricao}</p>
        <div className="text-white/50 text-xs mt-3">
          Carga: {course.carga_horaria_horas}h • Categoria: {course.categoria}
        </div>
      </div>
    </Link>
  );
}
