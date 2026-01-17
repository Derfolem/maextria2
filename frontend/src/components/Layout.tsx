import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { FaBook, FaBars, FaTimes, FaInstagram, FaLinkedinIn, FaYoutube, FaBell } from 'react-icons/fa';
import AIChat from './AIChat';
import { supabase } from '../lib/supabase';

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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const bannerEnabled = banner.enabled && Boolean(banner.imageUrl);
  const isMemberArea = location.pathname.startsWith('/admin') || location.pathname.startsWith('/teacher');
  const isTeacherLanding = location.pathname === '/sou-professor';
  const showBanner = bannerEnabled && !isMemberArea && !isTeacherLanding;

  const pageViewKey = useMemo(() => {
    const base = location.pathname + location.search;
    return `maextria_pv_${base}`;
  }, [location.pathname, location.search]);

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

      const headCode = resolve('marketing_pixel_head');
      const bodyCode = resolve('marketing_pixel_body');
      if (headCode) {
        const marker = document.getElementById('maextria-pixel-head');
        if (!marker) {
          const container = document.createElement('div');
          container.id = 'maextria-pixel-head';
          container.innerHTML = headCode;
          document.head.appendChild(container);
        }
      }
      if (bodyCode) {
        const marker = document.getElementById('maextria-pixel-body');
        if (!marker) {
          const container = document.createElement('div');
          container.id = 'maextria-pixel-body';
          container.innerHTML = bodyCode;
          document.body.appendChild(container);
        }
      }
    };

    loadMarketingConfig();
  }, []);

  useEffect(() => {
    if (seoConfig.title) {
      document.title = seoConfig.title;
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
    ensureMeta('description', seoConfig.description);
    ensureMeta('keywords', seoConfig.keywords);
    ensureMeta('robots', seoConfig.robots);
    if (seoConfig.canonical) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', seoConfig.canonical);
    }
  }, [seoConfig]);

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
              <Link to="/verificar-certificado" className="nav-link">
                Verificar certificado
              </Link>
              {isHome && (
                <Link to="/sou-professor" className="nav-link">
                  Sou professor
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4">
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
                  className="block h-auto w-full"
                />
              </a>
            ) : (
              <img
                src={banner.imageUrl}
                alt={banner.alt}
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
            <Link to="/courses" className="nav-link" onClick={() => setMobileOpen(false)}>
              Cursos
            </Link>
            <Link to="/verificar-certificado" className="nav-link" onClick={() => setMobileOpen(false)}>
              Verificar certificado
            </Link>
            {isHome && (
              <Link to="/sou-professor" className="nav-link" onClick={() => setMobileOpen(false)}>
                Sou professor
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

      <AIChat />

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
        </div>
      </footer>
    </div>
  );
}
