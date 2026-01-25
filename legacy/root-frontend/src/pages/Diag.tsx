import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Diag() {
  const [envOk, setEnvOk] = useState(false);
  const [auth, setAuth] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // 1) Envs
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    setEnvOk(Boolean(url && anon));

    // 2) Sessão
    supabase.auth.getSession().then(({ data }) => setAuth(data.session || null));

    // 3) Consulta simples (cursos publicados)
    supabase.from("cursos")
      .select("id,titulo,slug,publicado")
      .eq("publicado", true)
      .limit(5)
      .then(({ data, error }) => {
        if (error) setErrors((e) => [...e, `cursos: ${error.message}`]);
        else setCatalog(data || []);
      });
  }, []);

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico MAEXTRIA</h1>

      <div className="space-y-4">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Variáveis de ambiente</h2>
          <p>VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY: {envOk ? "OK ✅" : "Faltando ❌"}</p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Autenticação</h2>
          {auth ? (
            <div>
              <p>Logado: ✅</p>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(auth.user, null, 2)}
              </pre>
            </div>
          ) : (
            <p>Não logado (isso é OK para teste público) ⚠️</p>
          )}
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Catálogo público (até 5 cursos)</h2>
          {catalog.length ? (
            <ul className="list-disc pl-5">
              {catalog.map((c) => <li key={c.id}>{c.titulo} — /curso/{c.slug}</li>)}
            </ul>
          ) : (
            <p>Nenhum curso publicado retornado (ou erro).</p>
          )}
        </div>

        {!!errors.length && (
          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2 text-red-600">Erros</h2>
            <ul className="list-disc pl-5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
