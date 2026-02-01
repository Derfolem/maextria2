import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { addExperience, updateExperience, deleteExperience } from '../../../lib/curriculumApi';
import type { ExperienceEntry } from '../../../types';
import EntryCard from '../EntryCard';
import EntryModal from '../EntryModal';

interface ExperienceSectionProps {
  entries: ExperienceEntry[];
  curriculumId?: string;
  onUpdate: () => void;
}

const fields = [
  { name: 'company', label: 'Empresa', type: 'text' as const, required: true, placeholder: 'Nome da empresa' },
  { name: 'position', label: 'Cargo', type: 'text' as const, required: true, placeholder: 'Ex: Desenvolvedor Senior' },
  { name: 'location', label: 'Localizacao', type: 'text' as const, placeholder: 'Ex: Sao Paulo, SP' },
  { name: 'start_date', label: 'Data de Inicio', type: 'date' as const },
  { name: 'end_date', label: 'Data de Saida', type: 'date' as const },
  { name: 'is_current', label: 'Emprego atual', type: 'checkbox' as const, placeholder: 'Trabalho aqui atualmente' },
  { name: 'description', label: 'Descricao', type: 'textarea' as const, placeholder: 'Descreva suas principais atividades e conquistas...' },
];

export default function ExperienceSection({ entries, curriculumId, onUpdate }: ExperienceSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExperienceEntry | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingEntry(null);
    setFormValues({});
    setIsModalOpen(true);
  };

  const openEditModal = (entry: ExperienceEntry) => {
    setEditingEntry(entry);
    setFormValues({
      company: entry.company,
      position: entry.position,
      location: entry.location || '',
      start_date: entry.start_date || '',
      end_date: entry.end_date || '',
      is_current: entry.is_current === 1,
      description: entry.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formValues.company || !formValues.position) {
      toast.error('Empresa e cargo sao obrigatorios');
      return;
    }

    setIsSaving(true);
    try {
      if (editingEntry) {
        await updateExperience(editingEntry.id, formValues);
        toast.success('Experiencia atualizada!');
      } else {
        if (!curriculumId) {
          toast.error('Erro: curriculo nao encontrado');
          return;
        }
        await addExperience(curriculumId, formValues);
        toast.success('Experiencia adicionada!');
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (error) {
      toast.error('Erro ao salvar experiencia');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta experiencia?')) return;

    try {
      await deleteExperience(id);
      toast.success('Experiencia removida!');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao excluir experiencia');
      console.error(error);
    }
  };

  const formatPeriod = (entry: ExperienceEntry) => {
    const start = entry.start_date || '';
    const end = entry.is_current ? 'Atual' : (entry.end_date || '');
    if (!start && !end) return undefined;
    return `${start} - ${end}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Adicione suas experiencias profissionais, comecando pela mais recente.
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
          Nenhuma experiencia adicionada ainda.
        </div>
      ) : (
        <div>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              title={`${entry.position} - ${entry.company}`}
              subtitle={entry.location}
              period={formatPeriod(entry)}
              description={entry.description}
              badge={entry.is_current ? 'Atual' : undefined}
              onEdit={() => openEditModal(entry)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}

      <EntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Editar Experiencia' : 'Adicionar Experiencia'}
        fields={fields}
        values={formValues}
        onChange={(name, value) => setFormValues({ ...formValues, [name]: value })}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
