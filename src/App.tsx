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
import Prova from "./pages/Prova";
import NotFound from "./pages/NotFound";

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
          <Route path="/prova/:cursoId" element={<Prova />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
