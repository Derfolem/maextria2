import { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import Layout from './components/Layout';
import { lazy } from 'react';

// Helper para lazy load com retry automático após deploy
function lazyWithRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch((error) => {
      // Detecta erro de chunk não encontrado (comum após novo deploy)
      if (
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('Loading chunk') ||
        error.message.includes('Loading CSS chunk')
      ) {
        // Evita loop infinito verificando se já tentou reload
        const hasReloaded = sessionStorage.getItem('chunk-reload');
        if (!hasReloaded) {
          sessionStorage.setItem('chunk-reload', 'true');
          window.location.reload();
          return { default: () => null }; // Retorno temporário
        }
        sessionStorage.removeItem('chunk-reload');
      }
      throw error;
    })
  );
}



const Home = lazyWithRetry(() => import('./pages/Home'));
const FAQ = lazyWithRetry(() => import('./pages/FAQ'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const Courses = lazyWithRetry(() => import('./pages/Courses'));
const CourseDetail = lazyWithRetry(() => import('./pages/CourseDetail'));
const Blog = lazyWithRetry(() => import('./pages/Blog'));
const BlogPost = lazyWithRetry(() => import('./pages/BlogPost'));
const Vagas = lazyWithRetry(() => import('./pages/Vagas'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const PagamentoCertificado = lazyWithRetry(() => import('./pages/PagamentoCertificado'));
const VerificarCertificado = lazyWithRetry(() => import('./pages/VerificarCertificado'));
const StudentDashboard = lazyWithRetry(() => import('./pages/student/Dashboard'));
const StudentMyCourses = lazyWithRetry(() => import('./pages/student/MyCourses'));
const CoursePlayer = lazyWithRetry(() => import('./pages/student/CoursePlayer'));
const StudentNotifications = lazyWithRetry(() => import('./pages/student/Notifications'));
const TeacherDashboard = lazyWithRetry(() => import('./pages/teacher/Dashboard'));
const TeacherMyCourses = lazyWithRetry(() => import('./pages/teacher/MyCourses'));
const CourseEditor = lazyWithRetry(() => import('./pages/teacher/CourseEditor'));
const AiAccessPayment = lazyWithRetry(() => import('./pages/teacher/AiAccessPayment'));
const AiCreator = lazyWithRetry(() => import('./pages/teacher/AiCreator'));
const TeacherNotifications = lazyWithRetry(() => import('./pages/teacher/Notifications'));
const TeacherTutorial = lazyWithRetry(() => import('./pages/teacher/Tutorial'));
const TeacherPerformance = lazyWithRetry(() => import('./pages/teacher/Performance'));
const TeacherComissoes = lazyWithRetry(() => import('./pages/teacher/Comissoes'));
const CourseCreatorGlass = lazyWithRetry(() => import('./pages/teacher/CourseCreatorGlass')); // New import
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazyWithRetry(() => import('./pages/admin/Users'));
const AdminCourses = lazyWithRetry(() => import('./pages/admin/Courses'));
const AdminSettings = lazyWithRetry(() => import('./pages/admin/Settings'));
const AdminNotifications = lazyWithRetry(() => import('./pages/admin/Notifications'));
const AdminPayments = lazyWithRetry(() => import('./pages/admin/Payments'));
const AdminModeracao = lazyWithRetry(() => import('./pages/admin/Moderacao'));
const AdminBlog = lazyWithRetry(() => import('./pages/admin/Blog'));
const AdminComissoes = lazyWithRetry(() => import('./pages/admin/Comissoes'));
const AdminCertificateTemplates = lazyWithRetry(() => import('./pages/admin/CertificateTemplates'));
const AdminTrilhas = lazyWithRetry(() => import('./pages/admin/Trilhas'));
const TeacherLanding = lazyWithRetry(() => import('./pages/TeacherLanding'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const loadUser = useAuthStore((state) => state.loadUser);

  
  // Listener para erros de chunk não capturados
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.message.includes('Failed to fetch dynamically imported module') ||
        event.message.includes('Loading chunk')
      ) {
        const hasReloaded = sessionStorage.getItem('chunk-reload');
        if (!hasReloaded) {
          sessionStorage.setItem('chunk-reload', 'true');
          window.location.reload();
        } else {
          sessionStorage.removeItem('chunk-reload');
        }
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);


  useEffect(() => {
    loadUser();
    // Limpar flag de reload após carregamento bem-sucedido
    sessionStorage.removeItem('chunk-reload');
  }, [loadUser]);

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
            Carregando...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/vagas" element={<Vagas />} />
          <Route path="/sou-professor" element={<TeacherLanding />} />
          <Route path="/verificar-certificado" element={<VerificarCertificado />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos" element={<TermsOfService />} />

          <Route
            path="/pagamento-certificado/:cursoId"
            element={
              <ProtectedRoute roles={['student', 'teacher', 'admin']}>
                <PagamentoCertificado />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/my-courses"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentMyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/course/:id"
            element={
              <ProtectedRoute roles={['student']}>
                <CoursePlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preview/course/:id"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CoursePlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentNotifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/my-courses"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherMyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/course/new"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CourseEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/ai-access"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <AiAccessPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/ai-creator"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <AiCreator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/course/:id/edit"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CourseEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/notifications"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/tutorial"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherTutorial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/performance"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherPerformance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/professor/comissoes"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherComissoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/course/new-glass" // New route for glassmorphism creator
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CourseCreatorGlass />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trilhas"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminTrilhas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/certificados-modelos"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminCertificateTemplates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/moderacao"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminModeracao />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blog"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminBlog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/comissoes"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminComissoes />
              </ProtectedRoute>
            }
          />

          {/* Rota 404 - deve ser a ultima */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
