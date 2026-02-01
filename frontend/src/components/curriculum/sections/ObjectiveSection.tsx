import { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../lib/store';
import { updateCurriculum } from '../../../lib/curriculumApi';

interface ObjectiveSectionProps {
  initialValue?: string;
  onUpdate?: () => void;
}

export default function ObjectiveSection({ initialValue, onUpdate }: ObjectiveSectionProps) {
  const user = useAuthStore((state) => state.user);
  const [objective, setObjective] = useState(initialValue || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setObjective(initialValue || '');
    setHasChanges(false);
  }, [initialValue]);

  const handleChange = (value: string) => {
    setObjective(value);
    setHasChanges(value !== (initialValue || ''));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await updateCurriculum(String(user.id), { professional_objective: objective });
      toast.success('Objetivo salvo com sucesso!');
      setHasChanges(false);
      onUpdate?.();
    } catch (error) {
      toast.error('Erro ao salvar objetivo');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
        Descreva seu objetivo profissional de forma clara e objetiva. O que voce busca na sua carreira?
      </p>

      <textarea
        className="input-field w-full min-h-[120px] resize-y"
        placeholder="Ex: Busco oportunidade como desenvolvedor full-stack, com foco em aplicacoes web modernas utilizando React e Node.js..."
        value={objective}
        onChange={(e) => handleChange(e.target.value)}
      />

      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {objective.length} caracteres
        </p>

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-accent px-4 py-2 flex items-center gap-2"
          >
            <FaSave size={14} />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        )}
      </div>
    </div>
  );
}
