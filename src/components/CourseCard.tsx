import { Link } from "react-router-dom";

export default function CourseCard({ course }: { course: any }) {
  return (
    <Link to={`/curso/${course.slug}`} className="block rounded-2xl border border-white/10 p-4 hover:border-white/20">
      <h3 className="text-lg font-semibold">{course.title}</h3>
      <p className="text-white/70 text-sm mt-2 line-clamp-2">{course.summary}</p>
      <div className="text-white/50 text-xs mt-3">
        Carga: {course.workload}h • Nível: {course.level}
      </div>
    </Link>
  );
}
