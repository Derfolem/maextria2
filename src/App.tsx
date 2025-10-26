import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Cursos from "./pages/Cursos";
import CursoDetail from "./pages/CursoDetail";
import ModuloViewer from "./pages/ModuloViewer";
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import Prova from "./pages/Prova";
import PagamentoCertificado from "./pages/PagamentoCertificado";
import NotFound from "./pages/NotFound";
import Sobre from "./pages/Sobre";
import ComoFunciona from "./pages/ComoFunciona";
import Categorias from "./pages/Categorias";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import Contato from "./pages/Contato";
import { AdminRoute } from "./pages/admin/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCursos from "./pages/admin/AdminCursos";
import CursoForm from "./pages/admin/CursoForm";
import ModulosManager from "./pages/admin/ModulosManager";
import ModuloForm from "./pages/admin/ModuloForm";
import QuestoesManager from "./pages/admin/QuestoesManager";
import QuestaoForm from "./pages/admin/QuestaoForm";
import ConfiguracoesSite from "./pages/admin/ConfiguracoesSite";
import Financeiro from "./pages/admin/Financeiro";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/curso/:slug" element={<CursoDetail />} />
          <Route path="/modulo/:cursoId/:moduloId" element={<ModuloViewer />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/prova/:cursoId" element={<Prova />} />
          <Route path="/pagamento-certificado/:cursoId" element={<PagamentoCertificado />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/contato" element={<Contato />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="cursos" element={<AdminCursos />} />
            <Route path="cursos/novo" element={<CursoForm />} />
            <Route path="cursos/:id/editar" element={<CursoForm />} />
            <Route path="cursos/:cursoId/modulos" element={<ModulosManager />} />
            <Route path="cursos/:cursoId/modulos/novo" element={<ModuloForm />} />
            <Route path="modulos/:moduloId/editar" element={<ModuloForm />} />
            <Route path="cursos/:cursoId/prova" element={<QuestoesManager />} />
            <Route path="cursos/:cursoId/questoes/nova" element={<QuestaoForm />} />
            <Route path="questoes/:questaoId/editar" element={<QuestaoForm />} />
            <Route path="configuracoes" element={<ConfiguracoesSite />} />
            <Route path="financeiro" element={<Financeiro />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
