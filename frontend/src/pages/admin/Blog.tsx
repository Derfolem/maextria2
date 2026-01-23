import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../lib/store';

type BlogPost = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo_html: string;
  autor: string;
  imagem_capa_url: string | null;
  publicado: boolean;
  publicado_em: string | null;
  atualizado_em: string | null;
};

const emptyPost: BlogPost = {
  id: '',
  titulo: '',
  slug: '',
  resumo: '',
  conteudo_html: '',
  autor: 'Equipe Maextria',
  imagem_capa_url: '',
  publicado: false,
  publicado_em: null,
  atualizado_em: null,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [current, setCurrent] = useState<BlogPost>(emptyPost);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = useAuthStore((state) => state.token);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const adminClient = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return supabase;
    }
    if (!token) {
      return supabase;
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }, [token, supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await adminClient
      .from('blog_posts')
      .select('id, titulo, slug, resumo, conteudo_html, autor, imagem_capa_url, publicado, publicado_em, atualizado_em')
      .order('criado_em', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar posts.');
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const hasCurrent = Boolean(current.id);

  const handleEdit = (post: BlogPost) => {
    setCurrent({
      ...post,
      resumo: post.resumo || '',
      imagem_capa_url: post.imagem_capa_url || '',
    });
  };

  const handleNew = () => {
    setCurrent({ ...emptyPost });
  };

  const handleChange = (field: keyof BlogPost, value: string | boolean) => {
    setCurrent((prev) => ({ ...prev, [field]: value }));
  };

  const ensureSlug = useMemo(() => slugify(current.titulo), [current.titulo]);

  useEffect(() => {
    if (!current.slug && current.titulo) {
      setCurrent((prev) => ({ ...prev, slug: ensureSlug }));
    }
  }, [ensureSlug, current.slug, current.titulo]);

  const handleSave = async () => {
    if (!current.titulo || !current.slug || !current.conteudo_html) {
      toast.error('Titulo, slug e conteudo sao obrigatorios.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        titulo: current.titulo.trim(),
        slug: current.slug.trim(),
        resumo: current.resumo?.trim() || null,
        conteudo_html: current.conteudo_html.trim(),
        autor: current.autor.trim() || 'Equipe Maextria',
        imagem_capa_url: current.imagem_capa_url?.trim() || null,
        publicado: current.publicado,
        publicado_em: current.publicado
          ? current.publicado_em || new Date().toISOString()
          : null,
        atualizado_em: new Date().toISOString(),
      };

      if (hasCurrent) {
        const { error } = await adminClient
          .from('blog_posts')
          .update(payload)
          .eq('id', current.id);
        if (error) throw error;
        toast.success('Post atualizado.');
      } else {
        const { data, error } = await adminClient
          .from('blog_posts')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        setCurrent((prev) => ({ ...prev, id: data.id }));
        toast.success('Post criado.');
      }
      await loadPosts();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Administracao</p>
          <h1 className="headline-font text-4xl md:text-5xl">Blog</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            Crie e edite publicacoes do blog MAEXTRIA.
          </p>
        </div>
        <button type="button" onClick={handleNew} className="btn-accent">
          Novo post
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Publicacoes</h2>
          {loading ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum post ainda.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => handleEdit(post)}
                  className="w-full text-left p-3 border border-[hsl(var(--border))] rounded-[12px] hover:border-[hsl(var(--primary))] transition"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                    {post.publicado ? 'Publicado' : 'Rascunho'}
                  </p>
                  <p className="font-semibold">{post.titulo}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
                    {post.resumo || 'Sem resumo'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Editor</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Titulo</label>
              <input
                value={current.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                className="input-field"
                placeholder="Titulo do post"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <input
                value={current.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="input-field"
                placeholder="slug-do-post"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resumo</label>
            <textarea
              value={current.resumo || ''}
              onChange={(e) => handleChange('resumo', e.target.value)}
              className="input-field min-h-[90px]"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Autor</label>
              <input
                value={current.autor}
                onChange={(e) => handleChange('autor', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Imagem de capa (URL)</label>
              <input
                value={current.imagem_capa_url || ''}
                onChange={(e) => handleChange('imagem_capa_url', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Conteudo (HTML)</label>
            <textarea
              value={current.conteudo_html}
              onChange={(e) => handleChange('conteudo_html', e.target.value)}
              className="input-field min-h-[320px]"
              placeholder="<h2>Seu titulo</h2><p>Seu texto...</p>"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="published"
              type="checkbox"
              checked={current.publicado}
              onChange={(e) => handleChange('publicado', e.target.checked)}
              className="accent-[hsl(var(--primary))]"
            />
            <label htmlFor="published" className="text-sm text-[hsl(var(--muted-foreground))]">
              Publicar
            </label>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-accent"
          >
            {saving ? 'Salvando...' : 'Salvar post'}
          </button>
        </div>
      </div>
    </div>
  );
}
