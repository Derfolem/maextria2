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
  tipo: 'blog' | 'atalho';
};

type BlogComment = {
  id: string;
  post_id: string;
  nome: string;
  comentario: string;
  status: string;
  criado_em: string | null;
  publicado_em: string | null;
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
  tipo: 'blog',
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
  const [search, setSearch] = useState('');
  const [activeTipo, setActiveTipo] = useState<'blog' | 'atalho'>('blog');
  const [pendingComments, setPendingComments] = useState<BlogComment[]>([]);
  const [currentComments, setCurrentComments] = useState<BlogComment[]>([]);
  const [currentReactions, setCurrentReactions] = useState<Record<string, number>>({});
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

  useEffect(() => {
    if (current.id) {
      loadCurrentExtras(current.id);
    } else {
      setCurrentComments([]);
      setCurrentReactions({});
    }
  }, [current.id]);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await adminClient
      .from('blog_posts')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar posts.');
    } else {
      const normalized = (data || []).map((post: any) => ({
        ...post,
        tipo: (post?.tipo || 'blog') as 'blog' | 'atalho',
      }));
      setPosts(normalized);
    }
    setLoading(false);
    await loadPendingComments();
  };

  const loadPendingComments = async () => {
    const { data } = await adminClient
      .from('blog_comments')
      .select('id, post_id, nome, comentario, status, criado_em, publicado_em')
      .eq('status', 'pendente')
      .order('criado_em', { ascending: false });
    setPendingComments(data || []);
  };

  const loadCurrentExtras = async (postId: string) => {
    const { data: commentsData } = await adminClient
      .from('blog_comments')
      .select('id, post_id, nome, comentario, status, criado_em, publicado_em')
      .eq('post_id', postId)
      .order('criado_em', { ascending: false });
    setCurrentComments(commentsData || []);

    const { data: reactionData } = await adminClient
      .from('blog_reactions')
      .select('emoji')
      .eq('post_id', postId);
    const counts: Record<string, number> = {};
    (reactionData || []).forEach((item: any) => {
      counts[item.emoji] = (counts[item.emoji] || 0) + 1;
    });
    setCurrentReactions(counts);
  };

  const hasCurrent = Boolean(current.id);
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const levenshtein = (a: string, b: string) => {
    if (a === b) return 0;
    const aLen = a.length;
    const bLen = b.length;
    if (!aLen) return bLen;
    if (!bLen) return aLen;

    const dp = Array.from({ length: aLen + 1 }, () => new Array(bLen + 1).fill(0));
    for (let i = 0; i <= aLen; i += 1) dp[i][0] = i;
    for (let j = 0; j <= bLen; j += 1) dp[0][j] = j;

    for (let i = 1; i <= aLen; i += 1) {
      for (let j = 1; j <= bLen; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[aLen][bLen];
  };

  const normalizedSearch = useMemo(() => normalize(search), [search]);
  const postsByTipo = useMemo(
    () => posts.filter((post) => (post.tipo || 'blog') === activeTipo),
    [posts, activeTipo]
  );

  const filteredPosts = useMemo(() => {
    if (!normalizedSearch) return postsByTipo;
    const tokens = normalizedSearch.split(' ').filter(Boolean);

    return postsByTipo
      .map((post) => {
        const dateLabel = post.publicado_em
          ? new Date(post.publicado_em).toLocaleDateString('pt-BR')
          : '';
        const scoreField = (field: string) => {
          if (!field) return 0;
          const hay = normalize(field);
          let score = 0;
          tokens.forEach((token) => {
            const idx = hay.indexOf(token);
            if (idx >= 0) {
              score += 2 + token.length / Math.max(hay.length, 1) + 1 / (idx + 1);
            } else if (token.length > 3) {
              const dist = levenshtein(token, hay.slice(0, Math.min(hay.length, token.length + 2)));
              if (dist <= 2) score += 0.5;
            }
          });
          return score;
        };

        const score = [
          scoreField(post.titulo),
          scoreField(post.resumo || ''),
          scoreField(post.autor),
          scoreField(dateLabel),
          scoreField(post.slug),
        ].reduce((acc, value) => acc + value, 0);

        return { post, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.post);
  }, [normalizedSearch, posts]);

  const handleEdit = (post: BlogPost) => {
    setActiveTipo(post.tipo || 'blog');
    setCurrent({
      ...post,
      resumo: post.resumo || '',
      imagem_capa_url: post.imagem_capa_url || '',
    });
  };

  const handleNew = () => {
    setCurrent({ ...emptyPost, tipo: activeTipo });
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
        tipo: current.tipo || activeTipo,
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

  const handleApproveComment = async (commentId: string) => {
    const { error } = await adminClient
      .from('blog_comments')
      .update({ status: 'aprovado', publicado_em: new Date().toISOString() })
      .eq('id', commentId);
    if (error) {
      toast.error('Erro ao aprovar comentario.');
      return;
    }
    await loadPendingComments();
    if (current.id) await loadCurrentExtras(current.id);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await adminClient
      .from('blog_comments')
      .delete()
      .eq('id', commentId);
    if (error) {
      toast.error('Erro ao excluir comentario.');
      return;
    }
    await loadPendingComments();
    if (current.id) await loadCurrentExtras(current.id);
  };

  const handleClearReactions = async (postId: string) => {
    const { error } = await adminClient
      .from('blog_reactions')
      .delete()
      .eq('post_id', postId);
    if (error) {
      toast.error('Erro ao excluir reacoes.');
      return;
    }
    await loadCurrentExtras(postId);
  };

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Administracao</p>
          <h1 className="headline-font text-4xl md:text-5xl">Blog e Atalhos</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            Crie e edite publicacoes do blog e dos atalhos MAEXTRIA.
          </p>
        </div>
        <button type="button" onClick={handleNew} className="btn-accent">
          Novo post
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-8">
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col gap-3 mb-4">
            <h2 className="text-lg font-semibold">Publicacoes</h2>
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] p-1 text-sm">
              {(['blog', 'atalho'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => {
                    setActiveTipo(tipo);
                    setSearch('');
                  }}
                  className={`px-4 py-1.5 rounded-full transition ${
                    activeTipo === tipo
                      ? 'bg-[hsl(var(--primary))] text-white shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {tipo === 'blog' ? 'Blog' : 'Atalhos'}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-field"
              placeholder={`Buscar em ${activeTipo === 'blog' ? 'Blog' : 'Atalhos'}`}
            />
            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              {filteredPosts.length} resultado{filteredPosts.length === 1 ? '' : 's'}
            </p>
          </div>
          {loading ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando...</p>
          ) : postsByTipo.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum post ainda.</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum resultado para a busca.</p>
          ) : (
            <div className="space-y-2 sm:space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {filteredPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => handleEdit(post)}
                  className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 border border-[hsl(var(--border))] rounded-[10px] hover:border-[hsl(var(--primary))] transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold truncate">{post.titulo}</p>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--muted-foreground))]">
                      {post.tipo === 'atalho' ? 'Atalho' : 'Blog'}
                    </span>
                  </div>
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
            <label className="block text-sm font-medium mb-2">Tipo de publicacao</label>
            <select
              value={current.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              className="input-field"
            >
              <option value="blog">Blog</option>
              <option value="atalho">Atalho</option>
            </select>
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

          {current.id && (
            <div className="pt-6 border-t border-[hsl(var(--border))] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Reacoes do post</h3>
                <button
                  type="button"
                  className="btn-outline text-xs"
                  onClick={() => handleClearReactions(current.id)}
                >
                  Excluir reacoes
                </button>
              </div>
              {Object.keys(currentReactions).length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Sem reacoes ainda.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(currentReactions).map(([emoji, count]) => (
                    <span
                      key={emoji}
                      className="rounded-full border border-[hsl(var(--border))] px-3 py-1 text-sm"
                    >
                      {emoji} {count}
                    </span>
                  ))}
                </div>
              )}
              <div className="pt-4 border-t border-[hsl(var(--border))] space-y-3">
                <h3 className="text-base font-semibold">Comentarios do post</h3>
                {currentComments.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Sem comentarios.</p>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {currentComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-[12px] border border-[hsl(var(--border))] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{comment.nome}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                              {comment.status === 'aprovado' ? 'Publicado' : 'Pendente'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {comment.status !== 'aprovado' && (
                              <button
                                type="button"
                                className="btn-outline text-xs"
                                onClick={() => handleApproveComment(comment.id)}
                              >
                                Aprovar
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-outline text-xs"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                          {comment.comentario}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Curadoria de comentarios</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Comentarios pendentes aguardando aprovacao.
            </p>
          </div>
          <button type="button" className="btn-outline text-xs" onClick={loadPendingComments}>
            Atualizar
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {pendingComments.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum comentario pendente.</p>
          ) : (
            pendingComments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-[12px] border border-[hsl(var(--border))] p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{comment.nome}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Post: {posts.find((post) => post.id === comment.post_id)?.titulo || 'Post removido'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-outline text-xs"
                      onClick={() => handleApproveComment(comment.id)}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      className="btn-outline text-xs"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-3">{comment.comentario}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
