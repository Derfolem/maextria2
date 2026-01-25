import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CourseCard from "@/components/CourseCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CursosPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .eq("ativo", true)
        .order("criado_em", { ascending: false });
      if (!error) setCourses(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-dvh bg-[#0A0A1A] text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl p-4">
        <h1 className="text-2xl font-bold mb-4">Cursos</h1>
        {loading ? <div>Carregando…</div> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
