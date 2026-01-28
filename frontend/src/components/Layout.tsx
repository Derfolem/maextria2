import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { FaBook, FaBars, FaTimes, FaInstagram, FaLinkedinIn, FaYoutube, FaBell } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import DOMPurify from 'dompurify';

const SITE_BASE_URL = 'https://www.maextria.com.br';
const DEFAULT_OG_IMAGE = `${SITE_BASE_URL}/maextria-logo.png`;

const getDefaultSeo = (pathname: string) => {
  switch (pathname) {
    case '/courses':
      return {
        title: 'Cursos | MAEXTRIA',
        description: 'Explore cursos curados para aprender, aplicar e expandir com foco pratico.',
        keywords: '',
        robots: 'index,follow',
        canonical: `${SITE_BASE_URL}/courses`,
        ogImage: `${SITE_BASE_URL}/hero-01.png`,
      };
    case '/sou-professor':
      return {
        title: 'Sou Professor | MAEXTRIA',
        description: 'Compartilhe sua experiencia e crie cursos com a MAEXTRIA.',
        keywords: '',
        robots: 'index,follow',
        canonical: `${SITE_BASE_URL}/sou-professor`,
        ogImage: `${SITE_BASE_URL}/hero-02.png`,
      };
    case '/verificar-certificado':
      return {
        title: 'Verificar Certificado | MAEXTRIA',
        description: 'Valide certificados emitidos pela MAEXTRIA com seguranca.',
        keywords: '',
        robots: 'index,follow',
        canonical: `${SITE_BASE_URL}/verificar-certificado`,
        ogImage: `${SITE_BASE_URL}/hero-03.png`,
      };
    case '/login':
      return {
        title: 'Entrar | MAEXTRIA',
        description: 'Acesse sua conta MAEXTRIA.',
        keywords: '',
        robots: 'noindex,nofollow',
        canonical: `${SITE_BASE_URL}/login`,
        ogImage: DEFAULT_OG_IMAGE,
      };
    case '/register':
      return {
        title: 'Criar Conta | MAEXTRIA',
        description: 'Crie sua conta gratuita e comece a aprender na MAEXTRIA.',
        keywords: '',
        robots: 'noindex,nofollow',
        canonical: `${SITE_BASE_URL}/register`,
        ogImage: DEFAULT_OG_IMAGE,
      };
    case '/reset-password':
      return {
        title: 'Recuperar Senha | MAEXTRIA',
        description: 'Redefina sua senha para acessar sua conta.',
        keywords: '',
        robots: 'noindex,nofollow',
        canonical: `${SITE_BASE_URL}/reset-password`,
        ogImage: DEFAULT_OG_IMAGE,
      };
    default:
      return {
        title: 'MAEXTRIA - Plataforma de Cursos Online',
        description: 'MAEXTRIA: plataforma de cursos online com trilhas, certificados e conteudo com IA.',
        keywords: '',
        robots: 'index,follow',
        canonical: `${SITE_BASE_URL}/`,
        ogImage: DEFAULT_OG_IMAGE,
      };
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = location.pathname === '/';
  const [banner, setBanner] = useState({
    enabled: false,
    imageUrl: '',
    linkUrl: '',
    alt: 'Banner promocional',
  });
  const [seoConfig, setSeoConfig] = useState({
    title: '',
    description: '',
    keywords: '',
    robots: 'index,follow',
    canonical: '',
  });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemFlagsLoaded, setSystemFlagsLoaded] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const bannerEnabled = banner.enabled && Boolean(banner.imageUrl);
  const isMemberArea =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/teacher') ||
    location.pathname.startsWith('/professor');
  const isTeacherLanding = location.pathname === '/sou-professor';
  const showBanner = bannerEnabled && !isMemberArea && !isTeacherLanding;

  const pageViewKey = useMemo(() => {
    const base = location.pathname + location.search;
    return `maextria_pv_${base}`;
  }, [location.pathname, location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('admin') === '1' && user?.role === 'admin') {
      window.sessionStorage.setItem('maextria_admin_bypass', '1');
    }
  }, [location.search, user?.role]);

  // Afiliados (em breve): tracking desativado

  const maintenanceBypass =
    user?.role === 'admin' &&
    (new URLSearchParams(location.search).get('admin') === '1' ||
      (typeof window !== 'undefined' && window.sessionStorage.getItem('maextria_admin_bypass') === '1'));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const loadMarketingConfig = async () => {
      const { data } = await supabase
        .from('configuracoes_site')
        .select('chave, valor')
        .in('chave', [
          'marketing_banner_enabled',
          'marketing_banner_image_url',
          'marketing_banner_link_url',
          'marketing_banner_alt',
          'marketing_pixel_head',
          'marketing_pixel_body',
          'seo_meta_title',
          'seo_meta_description',
          'seo_meta_keywords',
          'seo_meta_robots',
          'seo_canonical_url',
          'maintenance_mode',
        ]);

      const resolve = (key: string) => data?.find((item: any) => item.chave === key)?.valor ?? '';
      const bannerEnabledValue = resolve('marketing_banner_enabled') === '1';
      setBanner({
        enabled: bannerEnabledValue,
        imageUrl: resolve('marketing_banner_image_url'),
        linkUrl: resolve('marketing_banner_link_url'),
        alt: resolve('marketing_banner_alt') || 'Banner promocional',
      });
      setSeoConfig({
        title: resolve('seo_meta_title'),
        description: resolve('seo_meta_description'),
        keywords: resolve('seo_meta_keywords'),
        robots: resolve('seo_meta_robots') || 'index,follow',
        canonical: resolve('seo_canonical_url'),
      });
      setMaintenanceMode(resolve('maintenance_mode') === '1');
      setSystemFlagsLoaded(true);

      const headCode = resolve('marketing_pixel_head');
      const bodyCode = resolve('marketing_pixel_body');
      if (headCode) {
        const marker = document.getElementById('maextria-pixel-head');
        if (!marker) {
          const container = document.createElement('div');
          container.id = 'maextria-pixel-head';
          // Sanitizar código de marketing para prevenir XSS, mas permitir scripts de analytics
          container.innerHTML = DOMPurify.sanitize(headCode, {
            ADD_TAGS: ['script', 'noscript', 'iframe'],
            ADD_ATTR: ['async', 'defer', 'src', 'type']
          });
          document.head.appendChild(container);
        }
      }
      if (bodyCode) {
        const marker = document.getElementById('maextria-pixel-body');
        if (!marker) {
          const container = document.createElement('div');
          container.id = 'maextria-pixel-body';
          // Sanitizar código de marketing para prevenir XSS, mas permitir scripts de analytics
          container.innerHTML = DOMPurify.sanitize(bodyCode, {
            ADD_TAGS: ['script', 'noscript', 'iframe'],
            ADD_ATTR: ['async', 'defer', 'src', 'type']
          });
          document.body.appendChild(container);
        }
      }
    };

    loadMarketingConfig();
  }, []);

  useEffect(() => {
    const fallback = getDefaultSeo(location.pathname);
    const effectiveSeo = {
      title: seoConfig.title || fallback.title,
      description: seoConfig.description || fallback.description,
      keywords: seoConfig.keywords || fallback.keywords,
      robots: seoConfig.robots || fallback.robots,
      canonical: seoConfig.canonical || fallback.canonical,
      ogImage: fallback.ogImage || DEFAULT_OG_IMAGE,
    };

    if (effectiveSeo.title) {
      document.title = effectiveSeo.title;
    }
    const ensureMeta = (name: string, content: string) => {
      if (!content) return;
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    const ensureProperty = (property: string, content: string) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    ensureMeta('description', effectiveSeo.description);
    ensureMeta('keywords', effectiveSeo.keywords);
    ensureMeta('robots', effectiveSeo.robots);
    ensureMeta('twitter:title', effectiveSeo.title);
    ensureMeta('twitter:description', effectiveSeo.description);
    ensureMeta('twitter:image', effectiveSeo.ogImage);
    ensureProperty('og:title', effectiveSeo.title);
    ensureProperty('og:description', effectiveSeo.description);
    ensureProperty('og:url', effectiveSeo.canonical);
    ensureProperty('og:image', effectiveSeo.ogImage);
    if (effectiveSeo.canonical) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', effectiveSeo.canonical);
    }
  }, [seoConfig, location.pathname]);

  useEffect(() => {
    const trackPageView = async () => {
      try {
        const sessionKey = 'maextria_session_id';
        let sessionId = window.localStorage.getItem(sessionKey);
        if (!sessionId) {
          sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          window.localStorage.setItem(sessionKey, sessionId);
        }
        if (window.localStorage.getItem(pageViewKey)) {
          return;
        }
        window.localStorage.setItem(pageViewKey, '1');
        const { data: authData } = await supabase.auth.getUser();
        await supabase.from('marketing_pageviews').insert({
          session_id: sessionId,
          path: `${location.pathname}${location.search}`,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          user_id: authData.user?.id ?? null,
        });
      } catch (error) {
        console.error('Pageview error:', error);
      }
    };

    trackPageView();
  }, [location.pathname, location.search, pageViewKey]);

  const loadNotificationBadge = async (userId: string, role: 'student' | 'teacher' | 'admin') => {
    try {
      const recipientRoles = role === 'teacher' ? ['teacher', 'all'] : ['student', 'all'];
      const nowIso = new Date().toISOString();
      const { data: threads } = await supabase
        .from('internal_threads')
        .select('id, internal_messages(id)')
        .eq('type', 'broadcast')
        .eq('created_by_role', 'admin')
        .in('recipient_role', recipientRoles)
        .or(`expires_at.is.null,expires_at.gte.${nowIso}`);

      const messageIds = (threads || [])
        .flatMap((thread: any) => (thread.internal_messages || []).map((message: any) => message.id));
      const uniqueMessageIds = Array.from(new Set(messageIds));
      if (uniqueMessageIds.length === 0) {
        setUnreadNotifications(0);
        return;
      }

      const { data: receipts } = await supabase
        .from('internal_message_receipts')
        .select('message_id')
        .eq('user_id', userId)
        .in('message_id', uniqueMessageIds);

      const readSet = new Set((receipts || []).map((row: any) => row.message_id));
      setUnreadNotifications(uniqueMessageIds.filter((id) => !readSet.has(id)).length);
    } catch (error) {
      console.error('Error loading notification badge:', error);
      setUnreadNotifications(0);
    }
  };

  useEffect(() => {
    if (!user || !['student', 'teacher'].includes(user.role)) {
      setUnreadNotifications(0);
      return;
    }
    loadNotificationBadge(String(user.id), user.role);
  }, [user?.id, user?.role, location.pathname]);

  useEffect(() => {
    const handler = () => {
      if (!user || !['student', 'teacher'].includes(user.role)) return;
      loadNotificationBadge(String(user.id), user.role);
    };
    window.addEventListener('maextria-notifications-read', handler);
    return () => window.removeEventListener('maextria-notifications-read', handler);
  }, [user?.id, user?.role]);

  const notificationLink = user?.role === 'teacher' ? '/teacher/notifications' : '/student/notifications';

  if (systemFlagsLoaded && maintenanceMode && user?.role !== 'admin' && !maintenanceBypass) {
    return (
      <div className="min-h-screen hero-gradient text-white flex items-center justify-center px-6">
        <div className="max-w-3xl w-full grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">Manutencao</p>
            <h1 className="headline-font text-4xl md:text-5xl leading-tight">
              No momento o site esta em manutencao.
            </h1>
            <p className="text-base md:text-lg text-white/80">
              No momento o site está em manutenção. Estamos fazendo alguns ajustes para tornar o
              site ainda mais exponencial para você. Volte daqui a instantes e veja as novas
              mudanças.
            </p>
          </div>
          <div className="hero-frame rounded-[28px] p-4 bg-white/5">
            <img
              src="/hero-10.png"
              alt="Pessoa trabalhando na manutencao"
              loading="lazy"
              decoding="async"
              width={600}
              height={400}
              className="w-full rounded-[20px]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="fixed inset-x-0 top-0 z-50 bg-[hsl(var(--background))]/95 backdrop-blur border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3 text-[hsl(var(--foreground))] hover:text-[hsl(var(--secondary))] transition">
              <img src="/maextria-logo.png" alt="MAEXTRIA" className="h-9 w-9 x-glow" />
              <span className="text-xl font-semibold tracking-wide">MAEXTRIA</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6 text-sm text-[hsl(var(--foreground))]">
              <Link to="/courses" className="nav-link flex items-center space-x-1">
                <FaBook />
                <span>Cursos</span>
              </Link>
              <Link to="/blog" className="nav-link">
                Blog
              </Link>
              <Link to="/verificar-certificado" className="nav-link">
                Verificar certificado
              </Link>
              {isHome && (
                <Link to="/sou-professor" className="nav-link">
                  Seja professor
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated && user && (
                <Link
                  to={user.role === 'teacher' ? '/teacher/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                  data-testid="link-minha-area"
                >
                  Minha Area
                </Link>
              )}
              {user && (user.role === 'student' || user.role === 'teacher') && (
                <Link
                  to={notificationLink}
                  className="relative text-[hsl(var(--foreground))] hover:text-[hsl(var(--secondary))] transition"
                  aria-label="Abrir notificacoes"
                >
                  <FaBell className="text-lg" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                  )}
                </Link>
              )}
              <button
                type="button"
                className="text-[hsl(var(--foreground))]"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Abrir menu do usuario"
              >
                <FaBars className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow page-fade pt-16">
        {showBanner && (
          <div className="w-full bg-transparent">
            {banner.linkUrl ? (
              <a href={banner.linkUrl} className="block" target="_blank" rel="noreferrer">
                <img
                  src={banner.imageUrl}
                  alt={banner.alt}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full"
                />
              </a>
            ) : (
              <img
                src={banner.imageUrl}
                alt={banner.alt}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            )}
          </div>
        )}
        {children}
      </main>

      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 md:bg-black/10"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-[hsl(var(--graphite))] shadow-xl p-6 flex flex-col gap-6 transition-transform duration-200 translate-x-0 md:top-16 md:right-6 md:h-auto md:rounded-[18px]">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">MAEXTRIA</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
                <FaTimes />
              </button>
            </div>
            <Link to="/courses" className="nav-link md:hidden" onClick={() => setMobileOpen(false)}>
              Cursos
            </Link>
            <Link to="/blog" className="nav-link md:hidden" onClick={() => setMobileOpen(false)}>
              Blog
            </Link>
            <Link to="/verificar-certificado" className="nav-link md:hidden" onClick={() => setMobileOpen(false)}>
              Verificar certificado
            </Link>
            {isHome && (
              <Link to="/sou-professor" className="nav-link md:hidden" onClick={() => setMobileOpen(false)}>
                Seja professor
              </Link>
            )}
            {isAuthenticated ? (
              <>
                {user?.role === 'student' && (
                  <>
                    <Link to="/student/notifications" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Notificacoes
                    </Link>
                    <Link to="/settings" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Perfil do usuario
                    </Link>
                    <Link to="/student/my-courses" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Meus Cursos
                    </Link>
                    <Link to="/student/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Painel geral
                    </Link>
                  </>
                )}
                {user?.role === 'teacher' && (
                  <>
                    <Link to="/teacher/notifications" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Notificacoes
                    </Link>
                    <Link to="/settings" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Perfil do usuario
                    </Link>
                    <Link to="/teacher/my-courses" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Meus Cursos
                    </Link>
                    <Link to="/teacher/tutorial" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Tutorial
                    </Link>
                    <Link to="/teacher/performance" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Desempenho
                    </Link>
                    <Link to="/professor/comissoes" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Comissoes
                    </Link>
                    <Link to="/teacher/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Painel
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin/notifications" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Notificacoes
                    </Link>
                    <Link to="/admin/blog" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Blog
                    </Link>
                    <Link to="/admin/comissoes" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Comissoes
                    </Link>
                    <Link to="/admin/certificados-modelos" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Modelos de certificados
                    </Link>
                    <Link to="/admin/settings" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Sistema
                    </Link>
                    <Link to="/settings" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Perfil do usuario
                    </Link>
                    <Link to="/admin/courses" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Aprovacoes
                    </Link>
                    <Link to="/admin/users" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Liberacoes
                    </Link>
                    <Link to="/admin/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Painel
                    </Link>
                  </>
                )}
                <button type="button" className="btn-outline w-full" onClick={handleLogout}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link" onClick={() => setMobileOpen(false)}>
                  Entrar
                </Link>
                <Link to="/register" className="btn-outline w-full text-center" onClick={() => setMobileOpen(false)}>
                  Iniciar
                </Link>
              </>
            )}
          </div>
        </div>
      )}


      <footer className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] py-12 border-t border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <img src="/maextria-logo.png" alt="MAEXTRIA" className="h-9 w-9 x-glow" />
              <span className="text-lg font-semibold tracking-wide">MAEXTRIA</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-white/70">
              <Link to="/courses" className="hover:text-[hsl(var(--secondary))] transition">Cursos</Link>
              <Link to="/login" className="hover:text-[hsl(var(--secondary))] transition">Acessar</Link>
              <Link to="/register" className="hover:text-[hsl(var(--secondary))] transition">Iniciar</Link>
              <Link to="/privacidade" className="hover:text-[hsl(var(--secondary))] transition">Privacidade</Link>
              <Link to="/termos" className="hover:text-[hsl(var(--secondary))] transition">Termos</Link>
              <Link to="/faq" className="hover:text-[hsl(var(--secondary))] transition">FAQ</Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 text-sm text-white/70">
            <p>&copy; 2024 MAEXTRIA. Todos os direitos reservados.</p>
            <div className="flex items-center gap-6 text-xl">
              <FaLinkedinIn />
              <FaInstagram />
              <FaYoutube />
            </div>
          </div>
          {!isMemberArea && (
            <div className="pt-3 text-[5px] text-white/40">
              criado por Fred MeloR
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
