import { Link } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Componente Breadcrumb para navegação
 * Renderiza visualmente e inclui markup semântico para acessibilidade
 */
export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm text-[hsl(var(--muted-foreground))] ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-1" itemScope itemType="https://schema.org/BreadcrumbList">
        {/* Home sempre primeiro */}
        <li
          className="flex items-center"
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
        >
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-[hsl(var(--primary))] transition"
            itemProp="item"
          >
            <FaHome className="text-xs" />
            <span itemProp="name" className="sr-only">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        {items.map((item, index) => (
          <li
            key={item.label}
            className="flex items-center"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <FaChevronRight className="mx-2 text-[10px] text-[hsl(var(--muted-foreground))]/50" />
            {item.href && index < items.length - 1 ? (
              <Link
                to={item.href}
                className="hover:text-[hsl(var(--primary))] transition"
                itemProp="item"
              >
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span
                className="text-[hsl(var(--foreground))] font-medium"
                itemProp="name"
                aria-current="page"
              >
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(index + 2)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
