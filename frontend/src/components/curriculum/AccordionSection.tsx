import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  actions?: React.ReactNode;
}

export default function AccordionSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
  actions
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="card mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[hsl(var(--muted)/0.3)] transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-[hsl(var(--primary))]">{icon}</span>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
          {badge !== undefined && (
            <span className="bg-[hsl(var(--primary))] text-white text-xs px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions && (
            <div onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
          {isOpen ? (
            <FaChevronUp className="text-[hsl(var(--muted-foreground))]" />
          ) : (
            <FaChevronDown className="text-[hsl(var(--muted-foreground))]" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-[hsl(var(--border))]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
