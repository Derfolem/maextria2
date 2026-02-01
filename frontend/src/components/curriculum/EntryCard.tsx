import { FaEdit, FaTrash } from 'react-icons/fa';

interface EntryCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  period?: string;
  badge?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export default function EntryCard({
  title,
  subtitle,
  description,
  period,
  badge,
  onEdit,
  onDelete,
  readOnly = false
}: EntryCardProps) {
  return (
    <div className="bg-[hsl(var(--muted)/0.3)] rounded-lg p-4 mb-3 group hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-[hsl(var(--foreground))]">{title}</h4>
            {badge && (
              <span className="bg-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))] text-xs px-2 py-0.5 rounded">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
          )}
          {period && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{period}</p>
          )}
          {description && (
            <p className="text-sm text-[hsl(var(--foreground)/0.8)] mt-2 whitespace-pre-wrap">{description}</p>
          )}
        </div>

        {!readOnly && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                title="Editar"
              >
                <FaEdit size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
                title="Excluir"
              >
                <FaTrash size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
