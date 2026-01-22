import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type BlogPost = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  autor: string;
  imagem_capa_url: string | null;
  publicado_em: string | null;
};

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, titulo, slug, resumo, autor, imagem_capa_url, publicado_em')
        .eq('publicado', true)
        .order('publicado_em', { ascending: false });
      if (!error) {
        setPosts(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[hsl(var(--background))] py-12 px-[clamp(24px,5vw,80px)]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Blog MAEXTRIA</p>
          <h1 className="headline-font text-4xl md:text-5xl">Insights para evoluir na carreira</h1>
          <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Conteudos práticos sobre mercado, certificacoes e habilidades que aceleram sua evolucao.
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6">
                <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 shimmer" />
                <div className="h-5 bg-gray-200 rounded mb-2 shimmer" />
                <div className="h-4 bg-gray-200 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-8 text-center text-[hsl(var(--muted-foreground))]">
            Nenhum artigo publicado ainda.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="card p-6 group hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition"
              >
                <div className="w-full h-44 rounded-[16px] mb-4 overflow-hidden bg-[hsl(var(--muted))]">
                  {post.imagem_capa_url ? (
                    <img
                      src={post.imagem_capa_url}
                      alt={post.titulo}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-[hsl(var(--primary))]">
                      {post.titulo.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                    {post.autor}
                  </p>
                  <h3 className="text-xl font-semibold group-hover:text-[hsl(var(--primary))] transition">
                    {post.titulo}
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {post.resumo}
                  </p>
                  {post.publicado_em && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {new Date(post.publicado_em).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
