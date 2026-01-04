import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImage from "@/assets/maextria-logo-new.png";

export const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isColaborador, setIsColaborador] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        fetchUserName(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        checkColaboradorStatus(session.user.id);
        fetchUserName(session.user.id);
      } else {
        setIsAdmin(false);
        setIsColaborador(false);
        setUserName("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserName = async (userId: string) => {
    const { data } = await supabase
      .from("usuarios")
      .select("nome_completo")
      .eq("id", userId)
      .maybeSingle();
    
    if (data) {
      setUserName(data.nome_completo);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const checkColaboradorStatus = async (userId: string) => {
    const { data } = await supabase
      .from("colaboradores")
      .select("id")
      .eq("usuario_id", userId)
      .eq("ativo", true)
      .maybeSingle();
    
    setIsColaborador(!!data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition-opacity flex items-center">
          <img 
            src={logoImage} 
            alt="MAEXTRIA" 
            className="h-20 md:h-24 w-auto object-contain" 
            style={{ backgroundColor: 'transparent' }}
          />
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/cursos">
            <Button variant="ghost" className="font-semibold">Cursos</Button>
          </Link>

          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin/dashboard">
                  <Button variant="outline" className="border-primary/50">Administração</Button>
                </Link>
              )}
              {!isAdmin && isColaborador && (
                <Link to="/admin/cursos">
                  <Button variant="outline" className="border-secondary/50 bg-secondary/10">
                    <span className="mr-2">🎖️</span>
                    Colaborador
                  </Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hover:bg-primary/10 flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    {userName && <span className="text-sm">Olá, {userName.split(' ')[0]}</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer w-full">
                      Painel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="cursor-pointer w-full flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 font-semibold">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
