import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, BookOpen, LayoutDashboard, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AdminNavbar = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isColaborador, setIsColaborador] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!adminRole);

    if (!adminRole) {
      const { data: colabData } = await supabase
        .from("colaboradores")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("ativo", true)
        .maybeSingle();
      
      setIsColaborador(!!colabData);
    }
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">
                {isColaborador && !isAdmin ? (
                  <>
                    Colaborador
                    <Badge variant="secondary" className="ml-2">🎖️</Badge>
                  </>
                ) : (
                  "Administração"
                )}
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              {isAdmin && (
                <>
                  <Link to="/admin/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/admin/colaboradores">
                    <Button variant="ghost" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Colaboradores
                    </Button>
                  </Link>
                </>
              )}
              <Link to="/admin/cursos">
                <Button variant="ghost" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Cursos
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin/certificado-modelo">
                  <Button variant="ghost" size="sm">
                    Certificados
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Site
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};