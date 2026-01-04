import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { FaBook, FaUser, FaSignOutAlt, FaCog, FaChartBar, FaUsers, FaBars, FaTimes, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import AIChat from './AIChat';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="fixed top-0 inset-x-0 z-50 bg-[hsl(var(--background))]/95 backdrop-blur border-b border-[hsl(var(--border))]">
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
              {isHome && (
                <Link to="/sou-professor" className="nav-link">
                  Sou professor
                </Link>
              )}

              {isAuthenticated ? (
                <>
                  {user?.role === 'student' && (
                    <>
                      <Link to="/student/dashboard" className="nav-link flex items-center space-x-1">
                        <FaChartBar />
                        <span>Dashboard</span>
                      </Link>
                      <Link to="/student/my-courses" className="nav-link">
                        Meus Cursos
                      </Link>
                    </>
                  )}

                  {user?.role === 'teacher' && (
                    <>
                      <Link to="/teacher/dashboard" className="nav-link flex items-center space-x-1">
                        <FaChartBar />
                        <span>Dashboard</span>
                      </Link>
                      <Link to="/teacher/my-courses" className="nav-link">
                        Meus Cursos
                      </Link>
                    </>
                  )}

                  {user?.role === 'admin' && (
                    <>
                      <Link to="/admin/dashboard" className="nav-link flex items-center space-x-1">
                        <FaChartBar />
                        <span>Dashboard</span>
                      </Link>
                      <Link to="/admin/users" className="nav-link flex items-center space-x-1">
                        <FaUsers />
                        <span>Usuários</span>
                      </Link>
                      <Link to="/admin/courses" className="nav-link">
                        Cursos
                      </Link>
                      <Link to="/admin/settings" className="nav-link flex items-center space-x-1">
                        <FaCog />
                        <span>Configurações</span>
                      </Link>
                    </>
                  )}

                  <Link to="/settings" className="nav-link">
                    <FaUser />
                  </Link>
                  <button onClick={handleLogout} className="nav-link flex items-center space-x-1">
                    <FaSignOutAlt />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link">
                    Entrar
                  </Link>
                  <Link to="/register" className="btn-outline">
                    Iniciar
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="md:hidden text-[hsl(var(--foreground))]"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <FaBars className="text-xl" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-16 page-fade">
        {children}
      </main>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-[hsl(var(--graphite))] shadow-xl p-6 flex flex-col gap-6 transition-transform duration-200 translate-x-0">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">MAEXTRIA</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
                <FaTimes />
              </button>
            </div>
            <Link to="/courses" className="nav-link" onClick={() => setMobileOpen(false)}>
              Cursos
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
                    <Link to="/student/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                    <Link to="/student/my-courses" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Meus Cursos
                    </Link>
                  </>
                )}
                {user?.role === 'teacher' && (
                  <>
                    <Link to="/teacher/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                    <Link to="/teacher/my-courses" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Meus Cursos
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                    <Link to="/admin/users" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Usuarios
                    </Link>
                    <Link to="/admin/courses" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Cursos
                    </Link>
                    <Link to="/admin/settings" className="nav-link" onClick={() => setMobileOpen(false)}>
                      Configuracoes
                    </Link>
                  </>
                )}
                <Link to="/settings" className="nav-link" onClick={() => setMobileOpen(false)}>
                  Perfil
                </Link>
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
