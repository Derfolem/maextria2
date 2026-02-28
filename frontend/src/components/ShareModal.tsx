import { useState } from 'react';
import { Course } from '../types';
import toast from 'react-hot-toast';
import {
  FaTimes,
  FaInstagram,
  FaLinkedin,
  FaFacebook,
  FaPinterest,
  FaWhatsapp,
  FaTelegram,
  FaCopy,
  FaCheck,
  FaShareAlt,
} from 'react-icons/fa';
import { stripHtml } from '../lib/text';

interface ShareModalProps {
  course: Course;
  onClose: () => void;
}

const SITE_URL = 'https://www.maextria.com.br';

export default function ShareModal({ course, onClose }: ShareModalProps) {
  const courseUrl = `${SITE_URL}/courses/${course.id}`;

  const defaultDescription = `🎓 Confira o curso "${course.title}" na MAEXTRIA!\n\nAprenda com qualidade e obtenha seu certificado reconhecido. Acesse agora:`;
  const [description, setDescription] = useState(defaultDescription);
  const [copied, setCopied] = useState<string | null>(null);

  const fullText = `${description}\n\n${courseUrl}`;
  const clipboardText = fullText;

  const encodedUrl = encodeURIComponent(courseUrl);
  const encodedText = encodeURIComponent(description);
  const encodedFull = encodeURIComponent(fullText);
  const encodedTitle = encodeURIComponent(course.title);
  const encodedImage = encodeURIComponent(course.thumbnail || `${SITE_URL}/maextria-logo.png`);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback para navegadores sem suporte
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
    toast.success('Copiado para a área de transferência!');
  };

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=640,height=580,resizable=yes,scrollbars=yes,status=yes');
  };

  const handleInstagram = async () => {
    await copyToClipboard(clipboardText, 'instagram');
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      // Tenta abrir o app. O texto já foi copiado, então será colável no post.
      window.location.href = 'instagram://';
      setTimeout(() => {
        toast('Texto copiado! Cole na descrição do seu post.', { icon: '📱', duration: 5000 });
      }, 800);
    } else {
      window.open('https://www.instagram.com/', '_blank');
      toast('Texto copiado! Abra o Instagram e cole na descrição do post.', { icon: '📋', duration: 5000 });
    }
  };

  const handleTikTok = async () => {
    await copyToClipboard(clipboardText, 'tiktok');
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = 'snssdk1233://';
      setTimeout(() => {
        toast('Texto copiado! Cole na descrição do seu vídeo.', { icon: '📱', duration: 5000 });
      }, 800);
    } else {
      window.open('https://www.tiktok.com/', '_blank');
      toast('Texto copiado! Abra o TikTok e cole na descrição do vídeo.', { icon: '📋', duration: 5000 });
    }
  };

  const handleFacebook = async () => {
    // Facebook não suporta texto pré-preenchido — copia para colar no post
    await copyToClipboard(description, 'facebook');
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
  };

  const socialNetworks = [
    {
      key: 'whatsapp',
      name: 'WhatsApp',
      icon: <FaWhatsapp size={26} />,
      color: '#25D366',
      lightBg: '#25D36615',
      action: () => openShareWindow(`https://wa.me/?text=${encodedFull}`),
      tooltip: 'Compartilhar no WhatsApp',
    },
    {
      key: 'telegram',
      name: 'Telegram',
      icon: <FaTelegram size={26} />,
      color: '#26A5E4',
      lightBg: '#26A5E415',
      action: () => openShareWindow(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`),
      tooltip: 'Compartilhar no Telegram',
    },
    {
      key: 'facebook',
      name: 'Facebook',
      icon: <FaFacebook size={26} />,
      color: '#1877F2',
      lightBg: '#1877F215',
      action: handleFacebook,
      tooltip: 'Copiar texto e abrir Facebook',
      isCopy: true,
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: <FaLinkedin size={26} />,
      color: '#0077B5',
      lightBg: '#0077B515',
      action: () => openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`),
      tooltip: 'Compartilhar no LinkedIn',
    },
    {
      key: 'pinterest',
      name: 'Pinterest',
      icon: <FaPinterest size={26} />,
      color: '#E60023',
      lightBg: '#E6002315',
      action: () => openShareWindow(`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedFull}&media=${encodedImage}`),
      tooltip: 'Compartilhar no Pinterest',
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: <FaInstagram size={26} />,
      color: '#C13584',
      lightBg: '#C1358415',
      action: handleInstagram,
      tooltip: 'Copiar e abrir Instagram',
      isCopy: true,
    },
    {
      key: 'tiktok',
      name: 'TikTok',
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.85a8.18 8.18 0 0 0 4.78 1.52V6.9a4.85 4.85 0 0 1-1.01-.21z" />
        </svg>
      ),
      color: '#000000',
      lightBg: '#00000010',
      action: handleTikTok,
      tooltip: 'Copiar e abrir TikTok',
      isCopy: true,
    },
  ];

  const plainDescription = stripHtml(course.description || '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[hsl(var(--primary))/10] flex items-center justify-center text-[hsl(var(--primary))]">
              <FaShareAlt size={16} />
            </span>
            <div>
              <h2 className="text-lg font-bold leading-tight">Compartilhar curso</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Divulgue nas redes sociais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]"
            aria-label="Fechar"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Preview do card */}
        <div className="px-6 pt-5">
          <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
            Preview do card
          </p>
          <div className="rounded-xl overflow-hidden border border-[hsl(var(--border))] shadow-sm">
            {course.thumbnail ? (
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute top-3 left-3 bg-[hsl(var(--primary))] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest">
                  MAEXTRIA
                </span>
                {course.duration_hours && (
                  <span className="absolute top-3 right-3 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {course.duration_hours}h
                  </span>
                )}
                <p className="absolute bottom-3 left-3 right-3 text-white font-bold text-sm leading-tight drop-shadow-lg">
                  {course.title}
                </p>
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-[hsl(var(--primary))] to-purple-700 flex flex-col items-center justify-center gap-2">
                <span className="text-white text-xl font-extrabold tracking-widest">MAEXTRIA</span>
                <span className="text-white/80 text-sm font-medium text-center px-4 leading-tight">{course.title}</span>
              </div>
            )}
            <div className="p-3 bg-white dark:bg-[hsl(var(--card))]">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5 uppercase tracking-wider">
                www.maextria.com.br
              </p>
              <p className="font-semibold text-sm leading-snug mb-1">{course.title}</p>
              {plainDescription && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed">
                  {plainDescription.slice(0, 130)}{plainDescription.length > 130 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Textarea de descrição */}
        <div className="px-6 pt-4 pb-2">
          <label className="block text-sm font-semibold mb-1.5">
            Mensagem do post
            <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))] font-normal">
              (o link será incluído automaticamente)
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-3 border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none text-sm bg-[hsl(var(--background))]"
            placeholder="Escreva a mensagem que aparecerá no post..."
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {description.length} caracteres
            </p>
            <button
              onClick={() => copyToClipboard(clipboardText, 'all')}
              className="flex items-center gap-1.5 text-xs text-[hsl(var(--primary))] hover:underline font-medium"
            >
              {copied === 'all' ? <FaCheck size={10} className="text-green-500" /> : <FaCopy size={10} />}
              {copied === 'all' ? 'Copiado!' : 'Copiar texto + link'}
            </button>
          </div>
        </div>

        {/* Botões das redes sociais */}
        <div className="px-6 pb-4">
          <p className="text-sm font-semibold mb-3">Compartilhar em:</p>
          <div className="grid grid-cols-4 gap-2">
            {socialNetworks.map((social) => (
              <button
                key={social.key}
                onClick={social.action}
                title={social.tooltip}
                className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{
                  backgroundColor: social.lightBg,
                  color: social.color,
                }}
              >
                {social.isCopy && copied === social.key && (
                  <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                    <FaCheck size={8} className="text-white" />
                  </span>
                )}
                <span style={{ color: social.color }}>{social.icon}</span>
                <span className="text-[10px] font-semibold" style={{ color: social.color }}>
                  {social.name}
                </span>
              </button>
            ))}
          </div>

          {/* Avisos de uso */}
          <div className="mt-4 p-3 bg-[hsl(var(--muted))] rounded-lg border border-[hsl(var(--border))] space-y-2">
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              <strong className="text-[hsl(var(--foreground))]">Instagram e TikTok:</strong>{' '}
              Texto e link copiados automaticamente. No celular o app abre direto; no computador cole na descrição do post.
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              <strong className="text-[hsl(var(--foreground))]">Facebook:</strong>{' '}
              O texto é copiado automaticamente. Cole no campo da publicação após o Facebook abrir.
            </p>
          </div>

          {/* Link direto */}
          <div className="mt-3 flex items-center gap-2 p-3 bg-[hsl(var(--muted))] rounded-lg border border-[hsl(var(--border))]">
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex-grow truncate">
              {courseUrl}
            </p>
            <button
              onClick={() => copyToClipboard(courseUrl, 'url')}
              className="shrink-0 flex items-center gap-1 text-xs text-[hsl(var(--primary))] font-medium hover:underline"
            >
              {copied === 'url' ? <FaCheck size={10} className="text-green-500" /> : <FaCopy size={10} />}
              {copied === 'url' ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
