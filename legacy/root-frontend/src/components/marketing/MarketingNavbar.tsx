import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, BarChart3, Calendar, Users, Target, Zap, Wrench } from "lucide-react";

export const MarketingNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const marketingLinks = [
    { path: "/admin/marketing", label: "Dashboard", icon: BarChart3 },
    { path: "/admin/marketing/calendario", label: "Calendário", icon: Calendar },
    { path: "/admin/marketing/crm", label: "CRM", icon: Users },
    { path: "/admin/marketing/seo", label: "SEO", icon: Target },
    { path: "/admin/marketing/automacao", label: "Automação", icon: Zap },
    { path: "/admin/marketing/ferramentas", label: "Ferramentas", icon: Wrench },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Marketing Maextria</span>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              {marketingLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link key={link.path} to={link.path}>
                    <Button 
                      variant={isActive ? "default" : "ghost"} 
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/dashboard")}
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Admin
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};