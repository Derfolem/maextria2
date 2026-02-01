import { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../lib/store';
import { updateCurriculum } from '../../../lib/curriculumApi';

interface AdditionalInfoSectionProps {
  initialValue?: string;
  onUpdate?: () => void;
}

export default function AdditionalInfoSection({ initialValue, onUpdate }: AdditionalInfoSectionProps) {
  const user = useAuthStore((state) => state.user);
  const [info, setInfo] = useState(initialValue || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setInfo(initialValue || '');
    setHasChanges(false);
  }, [initialValue]);

  const handleChange = (value: string) => {
    setInfo(value);
    setHasChanges(value !== (initialValue || ''));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await updateCurriculum(String(user.id), { additional_info: info });
      toast.success('Informacoes salvas com sucesso!');
      setHasChanges(false);
      onUpdate?.();
    } catch (error) {
      toast.error('Erro ao salvar informacoes');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
        Adicione informacoes complementares que possam ser relevantes, como disponibilidade,
        pretensao salarial, projetos pessoais, hobbies relacionados a area, etc.
      </p>

      <textarea
        className="input-field w-full min-h-[120px] resize-y"
        placeholder="Ex: Disponibilidade para inicio imediato. Interesse em projetos de inovacao tecnologica. Contribuidor ativo em projetos open source..."
        value={info}
        onChange={(e) => handleChange(e.target.value)}
      />

      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {info.length} caracteres
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
