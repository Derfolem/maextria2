import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { addEducation, updateEducation, deleteEducation } from '../../../lib/curriculumApi';
import type { EducationEntry } from '../../../types';
import EntryCard from '../EntryCard';
import EntryModal from '../EntryModal';

interface EducationSectionProps {
  entries: EducationEntry[];
  curriculumId?: string;
  onUpdate: () => void;
}

const fields = [
  { name: 'institution', label: 'Instituicao', type: 'text' as const, required: true, placeholder: 'Nome da instituicao' },
  { name: 'degree', label: 'Grau/Titulo', type: 'text' as const, required: true, placeholder: 'Ex: Bacharelado, Tecnologo, MBA...' },
  { name: 'field_of_study', label: 'Area de Estudo', type: 'text' as const, placeholder: 'Ex: Ciencia da Computacao' },
  { name: 'start_date', label: 'Data de Inicio', type: 'date' as const },
  { name: 'end_date', label: 'Data de Conclusao', type: 'date' as const },
  { name: 'is_current', label: 'Em andamento', type: 'checkbox' as const, placeholder: 'Ainda estou cursando' },
  { name: 'description', label: 'Descricao', type: 'textarea' as const, placeholder: 'Descreva atividades, projetos relevantes...' },
];

export default function EducationSection({ entries, curriculumId, onUpdate }: EducationSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EducationEntry | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingEntry(null);
    setFormValues({});
    setIsModalOpen(true);
  };

  const openEditModal = (entry: EducationEntry) => {
    setEditingEntry(entry);
    setFormValues({
      institution: entry.institution,
      degree: entry.degree,
      field_of_study: entry.field_of_study || '',
      start_date: entry.start_date || '',
      end_date: entry.end_date || '',
      is_current: entry.is_current === 1,
      description: entry.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formValues.institution || !formValues.degree) {
      toast.error('Instituicao e grau sao obrigatorios');
      return;
    }

    setIsSaving(true);
    try {
      if (editingEntry) {
        await updateEducation(editingEntry.id, formValues);
        toast.success('Formacao atualizada!');
      } else {
        if (!curriculumId) {
          toast.error('Erro: curriculo nao encontrado');
          return;
        }
        await addEducation(curriculumId, formValues);
        toast.success('Formacao adicionada!');
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (error) {
      toast.error('Erro ao salvar formacao');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta formacao?')) return;

    try {
      await deleteEducation(id);
      toast.success('Formacao removida!');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao excluir formacao');
      console.error(error);
    }
  };

  const formatPeriod = (entry: EducationEntry) => {
    const start = entry.start_date || '';
    const end = entry.is_current ? 'Atual' : (entry.end_date || '');
    if (!start && !end) return undefined;
    return `${start} - ${end}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Adicione sua formacao academica, cursos superiores, tecnicos, etc.
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
          Nenhuma formacao adicionada ainda.
        </div>
      ) : (
        <div>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              title={`${entry.degree} - ${entry.institution}`}
              subtitle={entry.field_of_study}
              period={formatPeriod(entry)}
              description={entry.description}
              badge={entry.is_current ? 'Em andamento' : undefined}
              onEdit={() => openEditModal(entry)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}

      <EntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Editar Formacao' : 'Adicionar Formacao'}
        fields={fields}
        values={formValues}
        onChange={(name, value) => setFormValues({ ...formValues, [name]: value })}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
