import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FieldConfig[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export default function EntryModal({
  isOpen,
  onClose,
  title,
  fields,
  values,
  onChange,
  onSave,
  isSaving = false
}: EntryModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[hsl(var(--card))] rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      className="input-field w-full"
                      placeholder={field.placeholder}
                      value={values[field.name] || ''}
                      onChange={(e) => onChange(field.name, e.target.value)}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      className="input-field w-full min-h-[100px] resize-y"
                      placeholder={field.placeholder}
                      value={values[field.name] || ''}
                      onChange={(e) => onChange(field.name, e.target.value)}
                    />
                  )}

                  {field.type === 'date' && (
                    <input
                      type="date"
                      className="input-field w-full"
                      value={values[field.name] || ''}
                      onChange={(e) => onChange(field.name, e.target.value)}
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      className="input-field w-full"
                      value={values[field.name] || ''}
                      onChange={(e) => onChange(field.name, e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                        checked={values[field.name] || false}
                        onChange={(e) => onChange(field.name, e.target.checked)}
                      />
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        {field.placeholder}
                      </span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-[hsl(var(--border))]">
            <button
              onClick={onClose}
              className="btn-outline px-4 py-2"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="btn-accent px-4 py-2"
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
