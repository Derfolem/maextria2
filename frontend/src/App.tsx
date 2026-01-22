import { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import Layout from './components/Layout';
import { lazy } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Settings = lazy(() => import('./pages/Settings'));
const PagamentoCertificado = lazy(() => import('./pages/PagamentoCertificado'));
const VerificarCertificado = lazy(() => import('./pages/VerificarCertificado'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentMyCourses = lazy(() => import('./pages/student/MyCourses'));
const CoursePlayer = lazy(() => import('./pages/student/CoursePlayer'));
const StudentNotifications = lazy(() => import('./pages/student/Notifications'));
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const TeacherMyCourses = lazy(() => import('./pages/teacher/MyCourses'));
const CourseEditor = lazy(() => import('./pages/teacher/CourseEditor'));
const AiAccessPayment = lazy(() => import('./pages/teacher/AiAccessPayment'));
const AiCreator = lazy(() => import('./pages/teacher/AiCreator'));
const TeacherNotifications = lazy(() => import('./pages/teacher/Notifications'));
const CourseCreatorGlass = lazy(() => import('./pages/teacher/CourseCreatorGlass')); // New import
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminCourses = lazy(() => import('./pages/admin/Courses'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminModeracao = lazy(() => import('./pages/admin/Moderacao'));
const AdminBlog = lazy(() => import('./pages/admin/Blog'));
const TeacherLanding = lazy(() => import('./pages/TeacherLanding'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

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

  useEffect(() => {
    loadUser();
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
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
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
