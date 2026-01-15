import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Settings from './pages/Settings';
import PagamentoCertificado from './pages/PagamentoCertificado';
import VerificarCertificado from './pages/VerificarCertificado';
import StudentDashboard from './pages/student/Dashboard';
import StudentMyCourses from './pages/student/MyCourses';
import CoursePlayer from './pages/student/CoursePlayer';
import StudentNotifications from './pages/student/Notifications';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherMyCourses from './pages/teacher/MyCourses';
import CourseEditor from './pages/teacher/CourseEditor';
import AiAccessPayment from './pages/teacher/AiAccessPayment';
import AiCreator from './pages/teacher/AiCreator';
import TeacherNotifications from './pages/teacher/Notifications';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCourses from './pages/admin/Courses';
import AdminSettings from './pages/admin/Settings';
import AdminNotifications from './pages/admin/Notifications';
import AdminPayments from './pages/admin/Payments';
import TeacherLanding from './pages/TeacherLanding';

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/sou-professor" element={<TeacherLanding />} />
        <Route path="/verificar-certificado" element={<VerificarCertificado />} />

        <Route path="/pagamento-certificado/:cursoId" element={
          <ProtectedRoute roles={['student', 'teacher', 'admin']}>
            <PagamentoCertificado />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        <Route path="/student/dashboard" element={
          <ProtectedRoute roles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/my-courses" element={
          <ProtectedRoute roles={['student']}>
            <StudentMyCourses />
          </ProtectedRoute>
        } />
        <Route path="/student/course/:id" element={
          <ProtectedRoute roles={['student']}>
            <CoursePlayer />
          </ProtectedRoute>
        } />
        <Route path="/student/notifications" element={
          <ProtectedRoute roles={['student']}>
            <StudentNotifications />
          </ProtectedRoute>
        } />

        <Route path="/teacher/dashboard" element={
          <ProtectedRoute roles={['teacher', 'admin']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/teacher/my-courses" element={
          <ProtectedRoute roles={['teacher', 'admin']}>
            <TeacherMyCourses />
          </ProtectedRoute>
        } />
        <Route path="/teacher/course/new" element={
          <ProtectedRoute roles={['teacher', 'admin']}>
            <CourseEditor />
          </ProtectedRoute>
        } />
        <Route path="/teacher/ai-access" element={
          <ProtectedRoute roles={['teacher', 'admin']}>
            <AiAccessPayment />
          </ProtectedRoute>
        } />
        <Route path="/teacher/ai-creator" element={
          <ProtectedRoute roles={['teacher', 'admin']}>
            <AiCreator />
          </ProtectedRoute>
        } />
        <Route path="/teacher/course/:id/edit" element={
          <ProtectedRoute roles={['teacher', 'admin']}>
            <CourseEditor />
          </ProtectedRoute>
        } />
        <Route path="/teacher/notifications" element={
          <ProtectedRoute roles={['teacher', 'admin']}>
            <TeacherNotifications />
          </ProtectedRoute>
        } />

        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="/admin/courses" element={
          <ProtectedRoute roles={['admin']}>
            <AdminCourses />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute roles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
          <ProtectedRoute roles={['admin']}>
            <AdminNotifications />
          </ProtectedRoute>
        } />
        <Route path="/admin/payments" element={
          <ProtectedRoute roles={['admin']}>
            <AdminPayments />
          </ProtectedRoute>
        } />
      </Routes>
    </Layout>
  );
}

export default App;
