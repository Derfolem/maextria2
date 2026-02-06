import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '../lib/supabase';
import { createArticleSchema } from '../components/AdvancedSchemas';
import { Breadcrumb } from '../components/Breadcrumb';

type BlogPost = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo_html: string;
  autor: string;
  imagem_capa_url: string | null;
  publicado_em: string | null;
  atualizado_em: string | null;
};

type BlogComment = {
  id: string;
  nome: string;
  comentario: string;
  publicado_em: string | null;
};

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentStatus, setCommentStatus] = useState('');
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [shareUrl, setShareUrl] = useState('');
  const [reactedEmojis, setReactedEmojis] = useState<string[]>([]);
  const [hasRead, setHasRead] = useState(false);

  const reactionOptions = ['👍', '👏', '🔥', '💡', '✅', '🎯', '🚀', '💙'];

  const getAnonId = () => {
    if (typeof window === 'undefined') return '';
    const key = 'maextria_anon_id';
    const stored = window.localStorage.getItem(key);
    if (stored) return stored;
    const value = window.crypto?.randomUUID ? window.crypto.randomUUID() : `anon_${Date.now()}`;
    window.localStorage.setItem(key, value);
    return value;
  };

  const trackEvent = async (eventType: string, channel?: string) => {
    if (!post?.id) return;
    const anonId = getAnonId();
    await supabase.from('blog_events').insert({
      post_id: post.id,
      event_type: eventType,
      channel: channel || null,
      anon_id: anonId,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      path: typeof window !== 'undefined' ? window.location.pathname : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
  };

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, titulo, slug, resumo, conteudo_html, autor, imagem_capa_url, publicado_em, atualizado_em')
        .eq('slug', slug)
        .or('tipo.is.null,tipo.eq.blog')
        .eq('publicado', true)
        .maybeSingle();
      if (!error) {
        setPost(data || null);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const sanitized = useMemo(() => (
    post?.conteudo_html ? DOMPurify.sanitize(post.conteudo_html) : ''
  ), [post?.conteudo_html]);

  const readingTime = useMemo(() => {
    if (!post?.conteudo_html) return null;
    const text = post.conteudo_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    const words = text.split(' ').length;
    const minutes = Math.max(1, Math.round(words / 220));
    return `${minutes} min de leitura`;
  }, [post?.conteudo_html]);

  const schema = useMemo(() => {
    if (!post?.publicado_em) return null;
    return createArticleSchema({
      headline: post.titulo,
      image: post.imagem_capa_url || 'https://www.maextria.com.br/maextria-logo.png',
      datePublished: post.publicado_em,
      dateModified: post.atualizado_em || post.publicado_em,
      author: post.autor,
      description: post.resumo || '',
    });
  }, [post]);

  useEffect(() => {
    if (!post?.id) return;
    const loadExtras = async () => {
      const { data: commentData } = await supabase
        .from('blog_comments')
        .select('id, nome, comentario, publicado_em')
        .eq('post_id', post.id)
        .eq('status', 'aprovado')
        .order('publicado_em', { ascending: false });
      setComments(commentData || []);

      const { data: reactionData } = await supabase
        .from('blog_reactions')
        .select('emoji')
        .eq('post_id', post.id);
      const counts: Record<string, number> = {};
      (reactionData || []).forEach((item: any) => {
        counts[item.emoji] = (counts[item.emoji] || 0) + 1;
      });
      setReactions(counts);
    };
    loadExtras();

    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
      const reactedKey = `maextria_reacted_${post.id}`;
      const stored = window.localStorage.getItem(reactedKey);
      if (stored) setReactedEmojis(stored.split(',').filter(Boolean));
    }
  }, [post?.id]);

  useEffect(() => {
    if (!post?.id) return;
    trackEvent('page_view');
    const readTimer = window.setTimeout(() => {
      if (!hasRead) {
        setHasRead(true);
        trackEvent('read');
      }
    }, 45000);

    const onScroll = () => {
      if (hasRead) return;
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0 && scrollTop / height > 0.7) {
        setHasRead(true);
        trackEvent('read');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(readTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [post?.id, hasRead]);

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!post?.id) return;
    setCommentStatus('');
    const payload = {
      post_id: post.id,
      nome: commentName.trim(),
      comentario: commentBody.trim(),
    };
    const { error } = await supabase.from('blog_comments').insert(payload);
    if (error) {
      setCommentStatus('Nao foi possivel enviar. Tente novamente.');
      return;
    }
    await trackEvent('comment_submitted');
    setCommentStatus('Comentario enviado para curadoria.');
    setCommentName('');
    setCommentBody('');
  };

  const handleReact = async (emoji: string) => {
    if (!post?.id) return;
    if (reactedEmojis.includes(emoji)) return;
    const anonId = getAnonId();
    const { error } = await supabase.from('blog_reactions').insert({
      post_id: post.id,
      emoji,
      anon_id: anonId,
    });
    if (!error) {
      setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      await trackEvent('reaction', emoji);
      const updated = [...reactedEmojis, emoji];
      setReactedEmojis(updated);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`maextria_reacted_${post.id}`, updated.join(','));
      }
    }
  };

  const handleCopy = async (value: string, label: string) => {
    if (typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(value);
      await trackEvent('share', label === 'Link' ? 'copy_link' : 'copy_embed');
      setCommentStatus(`${label} copiado.`);
    } catch {
      setCommentStatus('Nao foi possivel copiar.');
    }
  };

  const embedCode = shareUrl
    ? `<iframe src="${shareUrl}" style="width:100%;height:600px;border:0;" loading="lazy"></iframe>`
    : '';

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[hsl(var(--background))] py-12 px-[clamp(24px,5vw,80px)]">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb visual */}
        <Breadcrumb
          items={[
            { label: 'Blog', href: '/blog' },
            { label: post?.titulo || 'Artigo' },
          ]}
          className="mb-6"
        />

        {loading ? (
          <div className="card p-8 mt-6">
            <div className="h-6 w-2/3 bg-gray-200 rounded mb-3 shimmer" />
            <div className="h-4 w-1/3 bg-gray-200 rounded mb-6 shimmer" />
            <div className="h-44 bg-gray-200 rounded mb-6 shimmer" />
            <div className="h-4 bg-gray-200 rounded mb-2 shimmer" />
            <div className="h-4 bg-gray-200 rounded mb-2 shimmer" />
            <div className="h-4 bg-gray-200 rounded shimmer" />
          </div>
        ) : !post ? (
          <div className="card p-8 mt-6 text-[hsl(var(--muted-foreground))]">
            Artigo nao encontrado.
          </div>
        ) : (
          <article className="card relative mt-6 overflow-hidden">
            {schema && (
              <script type="application/ld+json">
                {JSON.stringify(schema)}
              </script>
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_55%)]" />
            <div className="relative p-8 space-y-10">
              <header className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">{post.autor}</p>
                <h1 className="headline-font text-3xl md:text-4xl leading-tight">{post.titulo}</h1>
                <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.25em] text-[hsl(var(--muted-foreground))]">
                  {post.publicado_em && (
                    <span>{new Date(post.publicado_em).toLocaleDateString('pt-BR')}</span>
                  )}
                  {readingTime && <span>{readingTime}</span>}
                </div>
                {post.resumo && (
                  <div className="rounded-[18px] bg-[hsl(var(--muted))] p-5 text-sm text-[hsl(var(--muted-foreground))]">
                    {post.resumo}
                  </div>
                )}
              </header>

              {post.imagem_capa_url && (
                <img
                  src={post.imagem_capa_url}
                  alt={post.titulo}
                  loading="lazy"
                  decoding="async"
                  width={960}
                  height={520}
                  className="w-full rounded-[22px] object-cover max-h-[480px]"
                />
              )}

              <div className="grid lg:grid-cols-[1fr_0.4fr] gap-10">
                <div className="space-y-6">
                  <div
                    className="prose prose-lg prose-neutral max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-figcaption:text-sm prose-figcaption:text-[hsl(var(--muted-foreground))] prose-img:rounded-[20px]"
                    dangerouslySetInnerHTML={{ __html: sanitized }}
                  />

                  <section className="pt-6 border-t border-[hsl(var(--border))] space-y-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Reacoes</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {reactionOptions.map((emoji) => {
                          const isActive = reactedEmojis.includes(emoji);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReact(emoji)}
                              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                                isActive
                                  ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10'
                                  : 'border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))]'
                              }`}
                              aria-label={`Reagir com ${emoji}`}
                            >
                              <span className="text-base">{emoji}</span>
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                {reactions[emoji] || 0}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Comentarios</p>
                      <form onSubmit={handleSubmitComment} className="mt-4 grid gap-3">
                        <input
                          className="input-field"
                          placeholder="Seu nome"
                          value={commentName}
                          onChange={(event) => setCommentName(event.target.value)}
                          required
                        />
                        <textarea
                          className="input-field min-h-[120px]"
                          placeholder="Seu comentario"
                          value={commentBody}
                          onChange={(event) => setCommentBody(event.target.value)}
                          required
                        />
                        <button type="submit" className="btn-accent w-full sm:w-auto">
                          Enviar comentario
                        </button>
                        {commentStatus && (
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">{commentStatus}</p>
                        )}
                      </form>
                      <div className="mt-6 space-y-4">
                        {comments.length === 0 ? (
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            Nenhum comentario publicado ainda.
                          </p>
                        ) : (
                          comments.map((comment) => (
                            <div key={comment.id} className="rounded-[16px] border border-[hsl(var(--border))] p-4">
                              <p className="text-sm font-semibold">{comment.nome}</p>
                              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                                {comment.comentario}
                              </p>
                              {comment.publicado_em && (
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3">
                                  {new Date(comment.publicado_em).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </section>
                </div>
                <aside className="space-y-4 lg:sticky lg:top-24 self-start">
                  <div className="card p-5 bg-[hsl(var(--muted))]">
                    <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Proximo passo</p>
                    <h3 className="text-lg font-semibold mt-2">Cursos + Certificados</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                      Aprenda com foco, valide com certificado e leve prova real para o mercado.
                    </p>
                    <Link
                      to="/courses"
                      className="btn-accent mt-4 w-full text-center"
                      onClick={() => trackEvent('cta_click', 'courses')}
                    >
                      Ver cursos
                    </Link>
                  </div>
                  <div className="card p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
                      Dica rapida
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                      Use o certificado como prova no curriculo, no LinkedIn e nas entrevistas. A clareza acelera convites.
                    </p>
                  </div>
                  <div className="card p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
                      Compartilhar
                    </p>
                    <div className="mt-3 grid gap-2">
                      <a
                        className="btn-outline w-full text-center"
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackEvent('share', 'facebook')}
                      >
                        Facebook
                      </a>
                      <a
                        className="btn-outline w-full text-center"
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackEvent('share', 'linkedin')}
                      >
                        LinkedIn
                      </a>
                      <a
                        className="btn-outline w-full text-center"
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackEvent('share', 'whatsapp')}
                      >
                        WhatsApp
                      </a>
                      <button
                        type="button"
                        className="btn-outline w-full"
                        onClick={() => handleCopy(shareUrl, 'Link')}
                      >
                        Copiar link
                      </button>
                      <button
                        type="button"
                        className="btn-outline w-full"
                        onClick={() => handleCopy(embedCode, 'Embed')}
                      >
                        Copiar embed
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
