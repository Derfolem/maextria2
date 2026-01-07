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
import VerificarCertificado from "./pages/VerificarCertificado";
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
import GerenciarUsuarios from "./pages/admin/GerenciarUsuarios";
import DetalhesUsuario from "./pages/admin/DetalhesUsuario";
import Mensagens from "./pages/admin/Mensagens";
import Colaboradores from "./pages/admin/Colaboradores";
import AulasManager from "./pages/admin/AulasManager";
import AulaForm from "./pages/admin/AulaForm";
import MarketingDashboard from "./pages/marketing/MarketingDashboard";
import MarketingCalendario from "./pages/marketing/MarketingCalendario";
import MarketingCRM from "./pages/marketing/MarketingCRM";
import MarketingSEO from "./pages/marketing/MarketingSEO";
import MarketingAutomacao from "./pages/marketing/MarketingAutomacao";
import MarketingFerramentas from "./pages/marketing/MarketingFerramentas";
import CertificadoModelo from "./pages/admin/CertificadoModelo";

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
          <Route path="/verificar-certificado" element={<VerificarCertificado />} />
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
            <Route path="modulos/:moduloId/aulas" element={<AulasManager />} />
            <Route path="modulos/:moduloId/aulas/nova" element={<AulaForm />} />
            <Route path="modulos/:moduloId/aulas/:aulaId/editar" element={<AulaForm />} />
            <Route path="cursos/:cursoId/prova" element={<QuestoesManager />} />
            <Route path="cursos/:cursoId/questoes/nova" element={<QuestaoForm />} />
            <Route path="questoes/:questaoId/editar" element={<QuestaoForm />} />
            <Route path="configuracoes" element={<ConfiguracoesSite />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="usuarios" element={<GerenciarUsuarios />} />
            <Route path="usuarios/:userId" element={<DetalhesUsuario />} />
            <Route path="mensagens" element={<Mensagens />} />
            <Route path="colaboradores" element={<Colaboradores />} />
            <Route path="marketing" element={<MarketingDashboard />} />
            <Route path="marketing/calendario" element={<MarketingCalendario />} />
            <Route path="marketing/crm" element={<MarketingCRM />} />
            <Route path="marketing/seo" element={<MarketingSEO />} />
            <Route path="marketing/automacao" element={<MarketingAutomacao />} />
            <Route path="marketing/ferramentas" element={<MarketingFerramentas />} />
            <Route path="certificado-modelo" element={<CertificadoModelo />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
