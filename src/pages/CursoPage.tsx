import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CursoPage() {
  const { slug } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("courses").select("*").eq("slug", slug).single();
      setCourse(c || null);
      if (c?.id) {
        const { data: l } = await supabase.from("lessons")
          .select("*")
          .eq("course_id", c.id)
          .order("order_index");
        setLessons(l || []);
      }
    })();
  }, [slug]);

  return (
    <div className="min-h-dvh bg-[#0A0A1A] text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl p-4 space-y-6">
        <h1 className="text-2xl font-bold">{course?.title ?? "Curso"}</h1>
        <p className="text-white/70">{course?.summary}</p>

        <div className="space-y-2">
          {lessons.map((l) => (
            <div key={l.id} className="rounded-xl border border-white/10 p-3">
              <div className="font-medium">{l.title}</div>
              <div className="text-white/70 text-sm">{l.content_type === "video" ? "Vídeo" : "Texto"}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link to={`/prova/${course?.slug}`} className="rounded-xl border border-white/20 px-4 py-2">Fazer prova</Link>
          <Link to={`/certificado/${course?.slug}`} className="rounded-xl border border-white/20 px-4 py-2">Gerar certificado</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
