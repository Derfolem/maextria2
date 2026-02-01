import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';
import { getValidAccessToken, supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

const MAX_PROMPT_TOKENS = 100;
const MAX_IMAGE_BYTES = 60 * 1024;
const IMAGE_SIZES = [640, 512, 480, 384];

const countTokens = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

const trimToTokens = (value: string, maxTokens: number) => {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (tokens.length <= maxTokens) return value;
  return tokens.slice(0, maxTokens).join(' ');
};

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });

const drawCoverCanvas = (bitmap: ImageBitmap, size: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  const dx = (size - width) / 2;
  const dy = (size - height) / 2;
  ctx.drawImage(bitmap, dx, dy, width, height);
  return canvas;
};

const compressToLimits = async (imageUrl: string) => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error('Nao foi possivel baixar a imagem gerada.');
  }
  const sourceBlob = await response.blob();
  const bitmap = await createImageBitmap(sourceBlob);

  for (const size of IMAGE_SIZES) {
    const canvas = drawCoverCanvas(bitmap, size);
    for (let quality = 0.85; quality >= 0.5; quality -= 0.05) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob && blob.size <= MAX_IMAGE_BYTES) {
        return { blob, size };
      }
    }
  }

  throw new Error('Nao foi possivel reduzir a imagem para 60KB.');
};

export default function AiCreator() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  const buildAuthHeaders = (accessToken: string) => ({
    Authorization: `Bearer ${accessToken}`,
    ...(supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
  });

  const [accessInfo, setAccessInfo] = useState<{ plan_code: string; expires_at: string; limit_usd: number } | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [usageLimit, setUsageLimit] = useState(0);
  const [usagePercent, setUsagePercent] = useState(0);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageWarningShown, setUsageWarningShown] = useState(false);
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [generatedImagePath, setGeneratedImagePath] = useState('');
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState('');
  const [imageInfo, setImageInfo] = useState<{ sizeKb: number; size: number } | null>(null);
  const [imageFeedback, setImageFeedback] = useState<'liked' | 'disliked' | null>(null);
  const [imageDeleted, setImageDeleted] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAccess();
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    loadUsage();
  }, [user?.id, accessInfo?.expires_at, accessInfo?.limit_usd]);

  useEffect(() => {
    if (usageLimit > 0 && usagePercent >= 80 && !usageWarningShown) {
      toast('Voce ja consumiu 80% do limite mensal.');
      setUsageWarningShown(true);
    }
    if (usagePercent < 80 && usageWarningShown) {
      setUsageWarningShown(false);
    }
  }, [usagePercent, usageLimit, usageWarningShown]);

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;
    const prefix = `aiCreator:${user.id}:`;
    const storedImageUrl = localStorage.getItem(`${prefix}imageUrl`) || '';
    const storedImagePath = localStorage.getItem(`${prefix}imagePath`) || '';
    const storedImageId = localStorage.getItem(`${prefix}imageId`);
    const storedText = localStorage.getItem(`${prefix}text`) || '';
    const storedInfo = localStorage.getItem(`${prefix}imageInfo`);
    const storedFeedback = localStorage.getItem(`${prefix}imageFeedback`);
    const storedDeleted = localStorage.getItem(`${prefix}imageDeleted`) === '1';

    if (storedImageUrl) setGeneratedImageUrl(storedImageUrl);
    if (storedImagePath) setGeneratedImagePath(storedImagePath);
    if (storedImageId) setGeneratedImageId(storedImageId);
    if (storedText) setGeneratedText(storedText);
    if (storedInfo) {
      try {
        setImageInfo(JSON.parse(storedInfo));
      } catch {
        setImageInfo(null);
      }
    }
    if (storedFeedback === 'liked' || storedFeedback === 'disliked') {
      setImageFeedback(storedFeedback);
    }
    setImageDeleted(storedDeleted);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;
    const prefix = `aiCreator:${user.id}:`;
    localStorage.setItem(`${prefix}imageUrl`, generatedImageUrl);
    localStorage.setItem(`${prefix}imagePath`, generatedImagePath);
    if (generatedImageId) {
      localStorage.setItem(`${prefix}imageId`, generatedImageId);
    } else {
      localStorage.removeItem(`${prefix}imageId`);
    }
    localStorage.setItem(`${prefix}text`, generatedText);
    if (imageInfo) {
      localStorage.setItem(`${prefix}imageInfo`, JSON.stringify(imageInfo));
    } else {
      localStorage.removeItem(`${prefix}imageInfo`);
    }
    if (imageFeedback) {
      localStorage.setItem(`${prefix}imageFeedback`, imageFeedback);
    } else {
      localStorage.removeItem(`${prefix}imageFeedback`);
    }
    localStorage.setItem(`${prefix}imageDeleted`, imageDeleted ? '1' : '0');
  }, [user?.id, generatedImageUrl, generatedImagePath, generatedImageId, generatedText, imageInfo, imageFeedback, imageDeleted]);

  const loadAccess = async () => {
    if (!user?.id) return;
    setAccessLoading(true);
    try {
      if (isAdmin) {
        setAccessInfo({ plan_code: 'admin', expires_at: new Date().toISOString(), limit_usd: 0 });
        return;
      }
      const { data } = await supabase
        .from('ai_plan_access')
        .select('plan_code, expires_at, limit_usd')
        .eq('usuario_id', String(user.id))
        .maybeSingle();
      if (data) {
        setAccessInfo(data);
        return;
      }

      const { data: legacyAccess } = await supabase
        .from('ai_course_access')
        .select('granted_until')
        .eq('usuario_id', String(user.id))
        .maybeSingle();
      if (legacyAccess?.granted_until) {
        setAccessInfo({ plan_code: 'legacy', expires_at: legacyAccess.granted_until, limit_usd: 5 });
        return;
      }

      setAccessInfo(null);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar acesso.');
    } finally {
      setAccessLoading(false);
    }
  };

  const loadUsage = async () => {
    if (!user?.id || isAdmin) {
      setUsageLimit(0);
      setUsagePercent(0);
      return;
    }
    setUsageLoading(true);
    try {
      if (!accessInfo?.expires_at) {
        setUsageLimit(0);
        setUsagePercent(0);
        return;
      }
      const expiresAt = new Date(accessInfo.expires_at);
      const now = new Date();
      const { data: limitOverride } = await supabase
        .from('ai_usage_limits')
        .select('limit_usd')
        .eq('usuario_id', String(user.id))
        .maybeSingle();
      const limitUsd = Number(limitOverride?.limit_usd ?? accessInfo.limit_usd ?? 0);
      setUsageLimit(limitUsd);

      if (expiresAt <= now) {
        setUsagePercent(0);
        return;
      }

      const { data } = await supabase
        .from('ai_usage_periods')
        .select('total_usd, period_end')
        .eq('usuario_id', String(user.id))
        .gte('period_end', now.toISOString())
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle();

      const totalUsd = Number(data?.total_usd ?? 0);
      const percent = limitUsd > 0 ? Math.min(100, (totalUsd / limitUsd) * 100) : 0;
      setUsagePercent(percent);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar consumo.');
    } finally {
      setUsageLoading(false);
    }
  };

  const hasAiAccess = useMemo(() => {
    if (isAdmin) return true;
    if (!accessInfo) return false;
    if (!accessInfo.expires_at) return false;
    return new Date(accessInfo.expires_at) > new Date();
  }, [accessInfo, isAdmin]);

  const promptTokens = useMemo(() => countTokens(prompt), [prompt]);

  const resetCreation = () => {
    setPrompt('');
    setGeneratedImageUrl('');
    setGeneratedImagePath('');
    setGeneratedImageId(null);
    setGeneratedText('');
    setImageInfo(null);
    setImageFeedback(null);
    setImageDeleted(false);
  };

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      toast.error('Digite um prompt.');
      return;
    }
    if (!hasAiAccess) {
      toast.error('Seu plano IA nao esta ativo.');
      return;
    }
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      toast.error('Sessao expirada. Faça login novamente.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lesson-text', {
        body: { prompt: prompt.trim() },
        headers: buildAuthHeaders(accessToken),
      });
      if (error) throw error;
      if (!data?.text) throw new Error('Nenhum texto retornado.');
      setGeneratedText(data.text);
      setGeneratedImageUrl('');
      await loadUsage();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao gerar texto.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Digite um prompt.');
      return;
    }
    if (!hasAiAccess) {
      toast.error('Seu plano IA nao esta ativo.');
      return;
    }
    if (!user?.id) {
      toast.error('Usuario nao autenticado.');
      return;
    }
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      toast.error('Sessao expirada. Faça login novamente.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-course-image', {
        body: { prompt: prompt.trim() },
        headers: buildAuthHeaders(accessToken),
      });
      if (error) throw error;
      const remoteImageUrl = data?.imageUrl;
      if (!remoteImageUrl) throw new Error('Nenhuma imagem foi gerada.');

      const { blob, size } = await compressToLimits(remoteImageUrl);
      const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

      const { error: uploadError } = await supabase
        .storage
        .from('ai-assets')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('ai-assets').getPublicUrl(filename);
      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) throw new Error('Nao foi possivel obter a URL publica.');

      const { data: savedImage, error: saveError } = await supabase
        .from('ai_generated_assets')
        .insert({
          usuario_id: String(user.id),
          tipo: 'image',
          url: publicUrl,
          storage_path: filename,
        })
        .select('id')
        .single();
      if (saveError) throw saveError;

      setGeneratedImageUrl(publicUrl);
      setGeneratedImagePath(filename);
      setGeneratedImageId(savedImage?.id ?? null);
      setGeneratedText('');
      setImageInfo({ sizeKb: Math.round(blob.size / 1024), size });
      setImageFeedback(null);
      setImageDeleted(false);
      await loadUsage();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao gerar imagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageFeedback = async (value: 'liked' | 'disliked') => {
    setImageFeedback(value);
    if (value !== 'disliked') return;
    if (!generatedImagePath) {
      setGeneratedImageUrl('');
      setGeneratedImageId(null);
      setImageInfo(null);
      setImageDeleted(true);
      return;
    }
    if (generatedImageId) {
      await supabase
        .from('ai_generated_assets')
        .delete()
        .eq('id', generatedImageId);
    }
    const { error } = await supabase.storage.from('ai-assets').remove([generatedImagePath]);
    if (error) {
      toast.error('Nao foi possivel excluir a imagem.');
      return;
    }
    setGeneratedImageUrl('');
    setGeneratedImagePath('');
    setGeneratedImageId(null);
    setImageInfo(null);
    setImageDeleted(true);
    toast('Imagem excluida.');
  };

  const handleCopy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch (error) {
      toast.error('Nao foi possivel copiar.');
    }
  };

  if (accessLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!hasAiAccess) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        <div className="card space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">
            Acesso IA para professores
          </p>
          <h1 className="text-3xl font-bold">Area de criacao com IA</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Para liberar a area de criacao com IA e necessario ativar um plano mensal.
          </p>
          <div className="rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))] space-y-2">
            <p className="font-semibold text-[hsl(var(--foreground))]">Vantagens</p>
            <p>• Gere imagens leves e prontas para usar.</p>
            <p>• Crie textos curtos para suas aulas.</p>
            <p>• Fluxo rapido e focado no conteudo.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/teacher/ai-access')}
            className="btn-accent"
          >
            Ver planos de IA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">
              Area de criacao com IA
            </p>
            <h1 className="text-2xl font-semibold">Imagens e textos para aulas</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <button type="button" className="btn-outline" onClick={() => navigate('/teacher/course/new')}>
              Voltar para criar curso
            </button>
            <button type="button" className="btn-outline" onClick={resetCreation}>
              Nova criacao
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={mode === 'image' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setMode('image')}
          >
            Imagem
          </button>
          <button
            type="button"
            className={mode === 'text' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setMode('text')}
          >
            Texto
          </button>
        </div>

        <div className="rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
            <span>0%</span>
            <span>100%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/80">
            <div
              className="h-2 rounded-full bg-[hsl(var(--accent))]"
              style={{ width: `${Math.min(100, Math.max(0, usagePercent))}%` }}
            />
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {usageLoading ? 'Carregando consumo...' : `${usagePercent.toFixed(0)}% usado do limite mensal.`}
          </p>
          {accessInfo?.expires_at && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Valido ate {new Date(accessInfo.expires_at).toLocaleDateString('pt-BR')}.
            </p>
          )}
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Seu limite e renovado por mes. O bloqueio acontece ao atingir o consumo ou completar 1 mes.
          </p>
          {usageLimit > 0 && usagePercent >= 100 && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Limite mensal atingido. Renove o plano para continuar.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt (ate 100 tokens)
          </label>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(trimToTokens(event.target.value, MAX_PROMPT_TOKENS))}
            className="input-field min-h-[120px]"
            placeholder="Descreva a imagem ou o texto que deseja gerar..."
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
            {promptTokens}/{MAX_PROMPT_TOKENS} tokens
          </p>
        </div>

        {mode === 'image' ? (
          <div className="space-y-3">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              A imagem sera ajustada para no maximo 640x640 e 60KB.
            </p>
            <button type="button" className="btn-accent" onClick={handleGenerateImage} disabled={loading}>
              {loading ? 'Gerando imagem...' : 'Gerar imagem'}
            </button>
            {generatedImageUrl && (
              <div className="space-y-3">
                <img src={generatedImageUrl} alt="Imagem gerada" className="rounded-lg border max-w-full" />
                {imageInfo && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {imageInfo.size}x{imageInfo.size}px • {imageInfo.sizeKb}KB
                  </p>
                )}
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    className={`btn-outline ${imageFeedback === 'liked' ? 'btn-primary' : ''}`}
                    onClick={() => handleImageFeedback('liked')}
                  >
                    <FaThumbsUp className="mr-2" />
                    Gostei
                  </button>
                  <button
                    type="button"
                    className={`btn-outline ${imageFeedback === 'disliked' ? 'btn-primary' : ''}`}
                    onClick={() => handleImageFeedback('disliked')}
                  >
                    <FaThumbsDown className="mr-2" />
                    Nao gostei
                  </button>
                </div>
                {imageFeedback === 'liked' && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="text"
                      value={generatedImageUrl}
                      readOnly
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => handleCopy(generatedImageUrl, 'URL copiada!')}
                    >
                      Copiar URL
                    </button>
                  </div>
                )}
                {imageFeedback === 'disliked' && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Essa imagem sera excluida.
                  </p>
                )}
                <button
                  type="button"
                  className="text-sm text-[hsl(var(--muted-foreground))] underline underline-offset-2"
                  onClick={() => handleImageFeedback('disliked')}
                >
                  Excluir imagem
                </button>
              </div>
            )}
            {!generatedImageUrl && imageDeleted && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                A imagem anterior foi excluida. Gere uma nova imagem.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              O texto gerado respeita o limite de 100 tokens.
            </p>
            <button type="button" className="btn-accent" onClick={handleGenerateText} disabled={loading}>
              {loading ? 'Gerando texto...' : 'Gerar texto'}
            </button>
            {generatedText && (
              <div className="space-y-3">
                <textarea
                  value={generatedText}
                  readOnly
                  className="input-field min-h-[140px]"
                />
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => handleCopy(generatedText, 'Texto copiado!')}
                >
                  Copiar texto
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
