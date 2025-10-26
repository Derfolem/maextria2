import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/cursos?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
      <Input
        type="search"
        placeholder="Buscar cursos, categorias ou temas..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-12 pr-4 py-6 text-lg bg-card border-border focus:border-primary transition-all"
      />
    </form>
  );
};
