import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import type { SkillEntry } from '../../../types';
import EntryModal from '../EntryModal';

interface SkillsSectionProps {
  entries: SkillEntry[];
  onUpdate: () => void;
}

const levelLabels: Record<string, string> = {
  basic: 'Basico',
  intermediate: 'Intermediario',
  advanced: 'Avancado',
  expert: 'Expert',
};

const levelColors: Record<string, string> = {
  basic: 'bg-gray-500',
  intermediate: 'bg-blue-500',
  advanced: 'bg-green-500',
  expert: 'bg-purple-500',
};

const fields = [
  { name: 'name', label: 'Habilidade', type: 'text' as const, required: true, placeholder: 'Ex: React, Python, Gestao de Projetos...' },
  {
    name: 'level',
    label: 'Nivel',
    type: 'select' as const,
    options: [
      { value: 'basic', label: 'Basico' },
      { value: 'intermediate', label: 'Intermediario' },
      { value: 'advanced', label: 'Avancado' },
      { value: 'expert', label: 'Expert' },
    ],
  },
];

export default function SkillsSection({ entries, onUpdate }: SkillsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SkillEntry | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingEntry(null);
    setFormValues({ level: 'intermediate' });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: SkillEntry) => {
    setEditingEntry(entry);
    setFormValues({
      name: entry.name,
      level: entry.level,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formValues.name) {
      toast.error('Nome da habilidade e obrigatorio');
      return;
    }

    setIsSaving(true);
    try {
      if (editingEntry) {
        await api.put(`/curriculum/skills/${editingEntry.id}`, formValues);
        toast.success('Habilidade atualizada!');
      } else {
        await api.post('/curriculum/skills', formValues);
        toast.success('Habilidade adicionada!');
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (error) {
      toast.error('Erro ao salvar habilidade');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta habilidade?')) return;

    try {
      await api.delete(`/curriculum/skills/${id}`);
      toast.success('Habilidade removida!');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao excluir habilidade');
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Liste suas principais habilidades tecnicas e comportamentais.
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
          Nenhuma habilidade adicionada ainda.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="group flex items-center gap-2 bg-[hsl(var(--muted)/0.3)] rounded-full px-4 py-2 hover:bg-[hsl(var(--muted)/0.5)] transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${levelColors[entry.level] || 'bg-gray-500'}`}
                title={levelLabels[entry.level] || entry.level}
              />
              <span className="text-[hsl(var(--foreground))]">{entry.name}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                ({levelLabels[entry.level] || entry.level})
              </span>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
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
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-500" /> Basico
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Intermediario
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Avancado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> Expert
        </span>
      </div>

      <EntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Editar Habilidade' : 'Adicionar Habilidade'}
        fields={fields}
        values={formValues}
        onChange={(name, value) => setFormValues({ ...formValues, [name]: value })}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
