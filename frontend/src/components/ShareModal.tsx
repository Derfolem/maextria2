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
  FaDownload,
  FaImage,
  FaListUl,
  FaInfoCircle,
} from 'react-icons/fa';
import { stripHtml } from '../lib/text';

interface ShareModalProps {
  course: Course;
  onClose: () => void;
}

const SITE_URL = 'https://www.maextria.com.br';

type Tab = 'share' | 'content' | 'guide';

export default function ShareModal({ course, onClose }: ShareModalProps) {
  const courseUrl = `${SITE_URL}/courses/${course.id}`;
  const thumbnailUrl = course.thumbnail || `${SITE_URL}/maextria-logo.png`;

  const defaultDescription = `🎓 Confira o curso "${course.title}" na MAEXTRIA!\n\nAprenda com qualidade e obtenha seu certificado reconhecido. Acesse agora:`;
  const [description, setDescription] = useState(defaultDescription);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('share');

  const fullText = `${description}\n\n${courseUrl}`;

  const encodedUrl = encodeURIComponent(courseUrl);
  const encodedText = encodeURIComponent(description);
  const encodedFull = encodeURIComponent(fullText);
  const encodedTitle = encodeURIComponent(course.title);
  const encodedImage = encodeURIComponent(thumbnailUrl);

  // ── Conteúdo para copiar ──────────────────────────────────────
  const plainDescription = stripHtml(course.description || '');

  const modulesText =
    course.modules && course.modules.length > 0
      ? course.modules
          .map((m, i) => {
            const lessons =
              m.lessons && m.lessons.length > 0
                ? m.lessons.map((l) => `   • ${l.title}`).join('\n')
                : '';
            return `${i + 1}. ${m.title}${lessons ? '\n' + lessons : ''}`;
          })
          .join('\n')
      : '';

  const fullContentText = [
    `📚 ${course.title}`,
    '',
    plainDescription ? plainDescription : '',
    modulesText ? `\n📗 Módulos:\n${modulesText}` : '',
    `\n🔗 Acesse: ${courseUrl}`,
  ]
    .filter((s) => s !== undefined)
    .join('\n');

  // ── Clipboard ─────────────────────────────────────────────────
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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

  // ── Handlers por rede ─────────────────────────────────────────
  const handleInstagram = async () => {
    await copyToClipboard(fullText, 'instagram');
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = 'instagram://';
      setTimeout(() => {
        toast('Texto copiado! Cole na descrição do seu post.', { icon: '📱', duration: 5000 });
      }, 800);
    } else {
      window.open('https://www.instagram.com/', '_blank');
      toast('Texto copiado! Abra o Instagram e cole na descrição do post.', {
        icon: '📋',
        duration: 5000,
      });
    }
  };

  const handleTikTok = async () => {
    await copyToClipboard(fullText, 'tiktok');
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = 'snssdk1233://';
      setTimeout(() => {
        toast('Texto copiado! Cole na descrição do seu vídeo.', { icon: '📱', duration: 5000 });
      }, 800);
    } else {
      window.open('https://www.tiktok.com/', '_blank');
      toast('Texto copiado! Abra o TikTok e cole na descrição do vídeo.', {
        icon: '📋',
        duration: 5000,
      });
    }
  };

  const handleFacebook = async () => {
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
      action: () =>
        openShareWindow(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`
        ),
      tooltip: 'Compartilhar no LinkedIn',
    },
    {
      key: 'pinterest',
      name: 'Pinterest',
      icon: <FaPinterest size={26} />,
      color: '#E60023',
      lightBg: '#E6002315',
      action: () =>
        openShareWindow(
          `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedFull}&media=${encodedImage}`
        ),
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

  // ── Abas ──────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'share', label: 'Compartilhar', icon: <FaShareAlt size={12} /> },
    { key: 'content', label: 'Conteúdo', icon: <FaListUl size={12} /> },
    { key: 'guide', label: 'Como usar', icon: <FaInfoCircle size={12} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[hsl(var(--border))] shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[hsl(var(--primary))/10] flex items-center justify-center text-[hsl(var(--primary))]">
              <FaShareAlt size={14} />
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight">Compartilhar curso</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[260px]">
                {course.title}
              </p>
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

        {/* Abas */}
        <div className="flex border-b border-[hsl(var(--border))] shrink-0 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                  : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto flex-1">

          {/* ── ABA: COMPARTILHAR ── */}
          {activeTab === 'share' && (
            <div className="px-6 py-4 space-y-4">
              {/* Preview do card */}
              <div>
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
                      <span className="text-white text-xl font-extrabold tracking-widest">
                        MAEXTRIA
                      </span>
                      <span className="text-white/80 text-sm font-medium text-center px-4 leading-tight">
                        {course.title}
                      </span>
                    </div>
                  )}
                  <div className="p-3 bg-white dark:bg-[hsl(var(--card))]">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5 uppercase tracking-wider">
                      www.maextria.com.br
                    </p>
                    <p className="font-semibold text-sm leading-snug mb-1">{course.title}</p>
                    {plainDescription && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed">
                        {plainDescription.slice(0, 130)}
                        {plainDescription.length > 130 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Mensagem do post
                  <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))] font-normal">
                    (o link é incluído automaticamente)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none text-sm bg-[hsl(var(--background))]"
                  placeholder="Escreva a mensagem que aparecerá no post..."
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {description.length} caracteres
                  </p>
                  <button
                    onClick={() => copyToClipboard(fullText, 'all')}
                    className="flex items-center gap-1.5 text-xs text-[hsl(var(--primary))] hover:underline font-medium"
                  >
                    {copied === 'all' ? (
                      <FaCheck size={10} className="text-green-500" />
                    ) : (
                      <FaCopy size={10} />
                    )}
                    {copied === 'all' ? 'Copiado!' : 'Copiar texto + link'}
                  </button>
                </div>
              </div>

              {/* Redes sociais */}
              <div>
                <p className="text-sm font-semibold mb-2">Compartilhar em:</p>
                <div className="grid grid-cols-4 gap-2">
                  {socialNetworks.map((social) => (
                    <button
                      key={social.key}
                      onClick={social.action}
                      title={social.tooltip}
                      className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1"
                      style={{ backgroundColor: social.lightBg, color: social.color }}
                    >
                      {social.isCopy && copied === social.key && (
                        <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                          <FaCheck size={8} className="text-white" />
                        </span>
                      )}
                      <span style={{ color: social.color }}>{social.icon}</span>
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: social.color }}
                      >
                        {social.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Link direto */}
              <div className="flex items-center gap-2 p-3 bg-[hsl(var(--muted))] rounded-lg border border-[hsl(var(--border))]">
                <p className="text-xs text-[hsl(var(--muted-foreground))] flex-grow truncate">
                  {courseUrl}
                </p>
                <button
                  onClick={() => copyToClipboard(courseUrl, 'url')}
                  className="shrink-0 flex items-center gap-1 text-xs text-[hsl(var(--primary))] font-medium hover:underline"
                >
                  {copied === 'url' ? (
                    <FaCheck size={10} className="text-green-500" />
                  ) : (
                    <FaCopy size={10} />
                  )}
                  {copied === 'url' ? 'Copiado!' : 'Copiar link'}
                </button>
              </div>
            </div>
          )}

          {/* ── ABA: CONTEÚDO ── */}
          {activeTab === 'content' && (
            <div className="px-6 py-4 space-y-5">

              {/* Imagem do curso */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaImage size={13} className="text-[hsl(var(--primary))]" />
                  <p className="text-sm font-semibold">Imagem do curso</p>
                </div>
                {course.thumbnail ? (
                  <div className="rounded-xl overflow-hidden border border-[hsl(var(--border))] mb-2">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full aspect-video object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-purple-700 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-lg">MAEXTRIA</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(thumbnailUrl, 'img-url')}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    {copied === 'img-url' ? (
                      <FaCheck size={11} className="text-green-500" />
                    ) : (
                      <FaCopy size={11} />
                    )}
                    {copied === 'img-url' ? 'Link copiado!' : 'Copiar link da imagem'}
                  </button>
                  {course.thumbnail && (
                    <a
                      href={course.thumbnail}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors"
                    >
                      <FaDownload size={11} />
                      Baixar
                    </a>
                  )}
                </div>
              </div>

              {/* Introdução */}
              {plainDescription && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">Introdução do curso</p>
                    <button
                      onClick={() => copyToClipboard(plainDescription, 'intro')}
                      className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] font-medium hover:underline"
                    >
                      {copied === 'intro' ? (
                        <FaCheck size={10} className="text-green-500" />
                      ) : (
                        <FaCopy size={10} />
                      )}
                      {copied === 'intro' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <div className="p-3 bg-[hsl(var(--muted))] rounded-lg border border-[hsl(var(--border))] max-h-40 overflow-y-auto">
                    <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-line">
                      {plainDescription}
                    </p>
                  </div>
                </div>
              )}

              {/* Módulos */}
              {course.modules && course.modules.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaListUl size={12} className="text-[hsl(var(--primary))]" />
                      <p className="text-sm font-semibold">
                        Módulos ({course.modules.length})
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(modulesText, 'modules')}
                      className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] font-medium hover:underline"
                    >
                      {copied === 'modules' ? (
                        <FaCheck size={10} className="text-green-500" />
                      ) : (
                        <FaCopy size={10} />
                      )}
                      {copied === 'modules' ? 'Copiado!' : 'Copiar lista'}
                    </button>
                  </div>
                  <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                    {course.modules.map((mod, i) => (
                      <div
                        key={mod.id}
                        className={`px-3 py-2.5 ${
                          i < course.modules!.length - 1
                            ? 'border-b border-[hsl(var(--border))]'
                            : ''
                        }`}
                      >
                        <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
                          {i + 1}. {mod.title}
                        </p>
                        {mod.lessons && mod.lessons.length > 0 && (
                          <ul className="mt-1 space-y-0.5 pl-3">
                            {mod.lessons.map((lesson) => (
                              <li
                                key={lesson.id}
                                className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-start gap-1"
                              >
                                <span className="mt-0.5 shrink-0">•</span>
                                {lesson.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[hsl(var(--muted))] rounded-lg text-xs text-[hsl(var(--muted-foreground))] text-center">
                  Os módulos não estão disponíveis neste contexto.
                </div>
              )}

              {/* Copiar tudo */}
              <button
                onClick={() => copyToClipboard(fullContentText, 'full-content')}
                className="w-full py-2.5 rounded-lg border border-[hsl(var(--primary))] text-[hsl(var(--primary))] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[hsl(var(--primary))/5] transition-colors"
              >
                {copied === 'full-content' ? (
                  <FaCheck size={12} className="text-green-500" />
                ) : (
                  <FaCopy size={12} />
                )}
                {copied === 'full-content' ? 'Copiado!' : 'Copiar tudo (intro + módulos + link)'}
              </button>
            </div>
          )}

          {/* ── ABA: COMO USAR ── */}
          {activeTab === 'guide' && (
            <div className="px-6 py-4 space-y-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                Siga o passo a passo de cada rede para garantir que o post chegue com imagem,
                texto e link corretos.
              </p>

              {[
                {
                  icon: <FaWhatsapp size={16} style={{ color: '#25D366' }} />,
                  name: 'WhatsApp e Telegram',
                  steps: [
                    'Clique no botão da rede desejada.',
                    'Uma conversa abrirá com a mensagem já preenchida.',
                    'Escolha os contatos ou grupos e envie.',
                    'O preview mostrará a imagem e o título do curso automaticamente.',
                  ],
                },
                {
                  icon: <FaLinkedin size={16} style={{ color: '#0077B5' }} />,
                  name: 'LinkedIn',
                  steps: [
                    'Clique no botão LinkedIn.',
                    'O LinkedIn abrirá com o card do curso já inserido.',
                    'Adicione um comentário pessoal se quiser e publique.',
                  ],
                },
                {
                  icon: <FaPinterest size={16} style={{ color: '#E60023' }} />,
                  name: 'Pinterest',
                  steps: [
                    'Clique no botão Pinterest.',
                    'A tela de criar pin abrirá com a imagem e descrição do curso.',
                    'Escolha a pasta e publique o pin.',
                  ],
                },
                {
                  icon: <FaFacebook size={16} style={{ color: '#1877F2' }} />,
                  name: 'Facebook',
                  steps: [
                    'Ao clicar, o texto da mensagem é copiado automaticamente.',
                    'O Facebook abrirá a tela de compartilhamento.',
                    'Cole o texto copiado no campo da publicação.',
                    'O card do curso aparece automaticamente pelo link.',
                  ],
                },
                {
                  icon: <FaInstagram size={16} style={{ color: '#C13584' }} />,
                  name: 'Instagram',
                  steps: [
                    'Ao clicar, o texto e link são copiados automaticamente.',
                    'No celular: o app do Instagram abre direto — crie um post ou Story e cole o texto na descrição.',
                    'No computador: acesse instagram.com, crie o post e cole o texto copiado.',
                    'Dica: salve a imagem do curso na aba "Conteúdo" para usar no post.',
                  ],
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="black">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.85a8.18 8.18 0 0 0 4.78 1.52V6.9a4.85 4.85 0 0 1-1.01-.21z" />
                    </svg>
                  ),
                  name: 'TikTok',
                  steps: [
                    'Ao clicar, o texto e link são copiados automaticamente.',
                    'No celular: o app do TikTok abre — grave ou edite um vídeo e cole o texto na descrição.',
                    'No computador: acesse tiktok.com e cole na descrição do vídeo.',
                    'Dica: use a imagem do curso (aba "Conteúdo") como capa do vídeo.',
                  ],
                },
              ].map((net) => (
                <div
                  key={net.name}
                  className="rounded-xl border border-[hsl(var(--border))] p-3 space-y-2"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {net.icon}
                    {net.name}
                  </div>
                  <ol className="space-y-1 pl-1">
                    {net.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                        <span className="shrink-0 w-4 h-4 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--foreground))]">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
