import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
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

  const [accessInfo, setAccessInfo] = useState<{ granted_until: string | null; granted_by_admin: boolean } | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [imageInfo, setImageInfo] = useState<{ sizeKb: number; size: number } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAccess();
  }, [user, navigate]);

  const loadAccess = async () => {
    if (!user?.id) return;
    setAccessLoading(true);
    try {
      if (isAdmin) {
        setAccessInfo({ granted_until: null, granted_by_admin: true });
        return;
      }
      const { data } = await supabase
        .from('ai_course_access')
        .select('granted_until, granted_by_admin')
        .eq('usuario_id', String(user.id))
        .maybeSingle();
      setAccessInfo(data ?? null);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar acesso.');
    } finally {
      setAccessLoading(false);
    }
  };

  const hasAiAccess = useMemo(() => {
    if (isAdmin) return true;
    if (!accessInfo) return false;
    if (accessInfo.granted_by_admin) return true;
    if (!accessInfo.granted_until) return false;
    return new Date(accessInfo.granted_until) > new Date();
  }, [accessInfo, isAdmin]);

  const promptTokens = useMemo(() => countTokens(prompt), [prompt]);

  const resetCreation = () => {
    setPrompt('');
    setGeneratedImageUrl('');
    setGeneratedText('');
    setImageInfo(null);
  };

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      toast.error('Digite um prompt.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lesson-text', {
        body: { prompt: prompt.trim() },
      });
      if (error) throw error;
      if (!data?.text) throw new Error('Nenhum texto retornado.');
      setGeneratedText(data.text);
      setGeneratedImageUrl('');
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
    if (!user?.id) {
      toast.error('Usuario nao autenticado.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-course-image', {
        body: { prompt: prompt.trim() },
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

      setGeneratedImageUrl(publicUrl);
      setGeneratedText('');
      setImageInfo({ sizeKb: Math.round(blob.size / 1024), size });
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao gerar imagem.');
    } finally {
      setLoading(false);
    }
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
            Para liberar a area de criacao com IA e necessario um pagamento unico de R$ 25,00,
            valido por 30 dias. Assim voce acelera a criacao das suas aulas.
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
            Ativar IA por R$ 25,00
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
          <button type="button" className="btn-outline" onClick={resetCreation}>
            Nova criacao
          </button>
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
              </div>
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
