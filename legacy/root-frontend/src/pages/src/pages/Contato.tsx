import { useState } from "react";

export default function Contato() {
  const [status, setStatus] = useState<"idle"|"enviando"|"ok"|"erro">("idle");
  const [msg, setMsg] = useState("");

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
  const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

  async function enviarMensagem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("enviando");
    const fd = new FormData(e.currentTarget);
    const payload = {
      nome: fd.get("nome"),
      email: fd.get("email"),
      assunto: fd.get("assunto"),
      corpo: fd.get("corpo"),
    };

    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/mensagens`, {
        method: "POST",
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${ANON}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      setStatus("ok");
      setMsg("Mensagem enviada com sucesso! ✔️");
      e.currentTarget.reset();
    } catch (err: any) {
      setStatus("erro");
      setMsg(`Erro ao enviar: ${err.message || err}`);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Fale com a MAEXTRIA</h1>
      <form onSubmit={enviarMensagem} className="space-y-4">
        <input name="nome" required placeholder="Seu nome" className="w-full border rounded p-3" />
        <input name="email" type="email" required placeholder="Seu e-mail" className="w-full border rounded p-3" />
        <input name="assunto" required placeholder="Assunto" className="w-full border rounded p-3" />
        <textarea name="corpo" required placeholder="Sua mensagem" className="w-full border rounded p-3 h-40" />
        <button disabled={status==="enviando"} className="px-5 py-3 rounded bg-indigo-600 text-white font-semibold">
          {status==="enviando" ? "Enviando..." : "Enviar"}
        </button>
      </form>
      {msg && <p className="mt-4">{msg}</p>}
    </div>
  );
}
