import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import type { LanguageEntry } from '../../../types';
import EntryModal from '../EntryModal';

interface LanguagesSectionProps {
  entries: LanguageEntry[];
  onUpdate: () => void;
}

const proficiencyLabels: Record<string, string> = {
  basic: 'Basico',
  intermediate: 'Intermediario',
  advanced: 'Avancado',
  fluent: 'Fluente',
  native: 'Nativo',
};

const proficiencyWidth: Record<string, string> = {
  basic: 'w-1/5',
  intermediate: 'w-2/5',
  advanced: 'w-3/5',
  fluent: 'w-4/5',
  native: 'w-full',
};

const fields = [
  { name: 'language', label: 'Idioma', type: 'text' as const, required: true, placeholder: 'Ex: Ingles, Espanhol...' },
  {
    name: 'proficiency',
    label: 'Proficiencia',
    type: 'select' as const,
    options: [
      { value: 'basic', label: 'Basico' },
      { value: 'intermediate', label: 'Intermediario' },
      { value: 'advanced', label: 'Avancado' },
      { value: 'fluent', label: 'Fluente' },
      { value: 'native', label: 'Nativo' },
    ],
  },
];

export default function LanguagesSection({ entries, onUpdate }: LanguagesSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LanguageEntry | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingEntry(null);
    setFormValues({ proficiency: 'intermediate' });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: LanguageEntry) => {
    setEditingEntry(entry);
    setFormValues({
      language: entry.language,
      proficiency: entry.proficiency,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formValues.language) {
      toast.error('Nome do idioma e obrigatorio');
      return;
    }

    setIsSaving(true);
    try {
      if (editingEntry) {
        await api.put(`/curriculum/languages/${editingEntry.id}`, formValues);
        toast.success('Idioma atualizado!');
      } else {
        await api.post('/curriculum/languages', formValues);
        toast.success('Idioma adicionado!');
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (error) {
      toast.error('Erro ao salvar idioma');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este idioma?')) return;

    try {
      await api.delete(`/curriculum/languages/${id}`);
      toast.success('Idioma removido!');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao excluir idioma');
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Adicione os idiomas que voce domina e seu nivel de proficiencia.
        </p>
        <button
          onClick={openAddModal}
          className="btn-accent px-3 py-1.5 flex items-center gap-2 text-sm"
        >
          <FaPlus size={12} />
          Adicionar
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
          Nenhum idioma adicionado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="group bg-[hsl(var(--muted)/0.3)] rounded-lg p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[hsl(var(--foreground))]">{entry.language}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    ({proficiencyLabels[entry.proficiency] || entry.proficiency})
                  </span>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(entry)}
                    className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                    title="Editar"
                  >
                    <FaEdit size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1 text-[hsl(var(--muted-foreground))] hover:text-red-500"
                    title="Excluir"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div
                  className={`h-full bg-[hsl(var(--primary))] rounded-full transition-all ${proficiencyWidth[entry.proficiency] || 'w-1/5'}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <EntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Editar Idioma' : 'Adicionar Idioma'}
        fields={fields}
        values={formValues}
        onChange={(name, value) => setFormValues({ ...formValues, [name]: value })}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
