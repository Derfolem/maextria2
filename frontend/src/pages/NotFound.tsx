import { Link } from 'react-router-dom';
import { FaHome, FaBook, FaSearch } from 'react-icons/fa';
import { SEO } from '../components/SEO';

export default function NotFound() {
  return (
    <>
      <SEO
        title="Pagina nao encontrada | MAEXTRIA"
        description="A pagina que voce procura nao foi encontrada. Explore nossos cursos ou volte para a pagina inicial."
        url="https://www.maextria.com.br/404"
      />
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-[clamp(24px,5vw,80px)] py-[clamp(60px,8vh,120px)]">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Numero 404 estilizado */}
          <div className="relative">
            <span className="text-[150px] md:text-[200px] font-bold leading-none text-[hsl(var(--muted))]/20 select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
                <FaSearch className="text-4xl text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="headline-font text-3xl md:text-4xl">
              Pagina nao encontrada
            </h1>
            <p className="text-[hsl(var(--muted-foreground))] text-lg max-w-md mx-auto">
              A pagina que voce esta procurando pode ter sido removida, renomeada ou esta temporariamente indisponivel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/" className="btn-accent flex items-center gap-2">
              <FaHome />
              Voltar ao inicio
            </Link>
            <Link to="/courses" className="btn-outline flex items-center gap-2">
              <FaBook />
              Explorar cursos
            </Link>
          </div>

          {/* Links uteis */}
          <div className="pt-8 border-t border-[hsl(var(--border))]">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Links que podem ajudar:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/courses" className="text-[hsl(var(--primary))] hover:underline">
                Todos os cursos
              </Link>
              <Link to="/blog" className="text-[hsl(var(--primary))] hover:underline">
                Blog
              </Link>
              <Link to="/verificar-certificado" className="text-[hsl(var(--primary))] hover:underline">
                Verificar certificado
              </Link>
              <Link to="/sou-professor" className="text-[hsl(var(--primary))] hover:underline">
                Seja professor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
