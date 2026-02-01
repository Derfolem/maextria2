import { useState, useEffect } from 'react';
import { FaPlus, FaCertificate, FaExternalLinkAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../lib/store';
import { getPlatformCerts, addExternalCert, updateExternalCert, deleteExternalCert } from '../../../lib/curriculumApi';
import type { ExternalCertEntry, PlatformCertificate } from '../../../types';
import EntryCard from '../EntryCard';
import EntryModal from '../EntryModal';

interface CertificationsSectionProps {
  externalCerts: ExternalCertEntry[];
  curriculumId?: string;
  onUpdate: () => void;
}

const fields = [
  { name: 'name', label: 'Nome do Curso/Certificado', type: 'text' as const, required: true, placeholder: 'Ex: AWS Certified Developer' },
  { name: 'institution', label: 'Instituicao', type: 'text' as const, required: true, placeholder: 'Ex: Amazon Web Services' },
  { name: 'issue_date', label: 'Data de Emissao', type: 'date' as const },
  { name: 'expiration_date', label: 'Data de Validade', type: 'date' as const },
  { name: 'credential_url', label: 'URL da Credencial', type: 'text' as const, placeholder: 'https://...' },
];

export default function CertificationsSection({ externalCerts, curriculumId, onUpdate }: CertificationsSectionProps) {
  const user = useAuthStore((state) => state.user);
  const [platformCerts, setPlatformCerts] = useState<PlatformCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExternalCertEntry | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPlatformCerts();
    }
  }, [user?.id]);

  const loadPlatformCerts = async () => {
    if (!user?.id) return;
    try {
      const certs = await getPlatformCerts(String(user.id));
      setPlatformCerts(certs);
    } catch (error) {
      console.error('Error loading platform certs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingEntry(null);
    setFormValues({});
    setIsModalOpen(true);
  };

  const openEditModal = (entry: ExternalCertEntry) => {
    setEditingEntry(entry);
    setFormValues({
      name: entry.name,
      institution: entry.institution,
      issue_date: entry.issue_date || '',
      expiration_date: entry.expiration_date || '',
      credential_url: entry.credential_url || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formValues.name || !formValues.institution) {
      toast.error('Nome e instituicao sao obrigatorios');
      return;
    }

    setIsSaving(true);
    try {
      if (editingEntry) {
        await updateExternalCert(editingEntry.id, formValues);
        toast.success('Certificado atualizado!');
      } else {
        if (!curriculumId) {
          toast.error('Erro: curriculo nao encontrado');
          return;
        }
        await addExternalCert(curriculumId, formValues);
        toast.success('Certificado adicionado!');
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (error) {
      toast.error('Erro ao salvar certificado');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este certificado?')) return;

    try {
      await deleteExternalCert(id);
      toast.success('Certificado removido!');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao excluir certificado');
      console.error(error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  return (
    <div>
      {/* Platform Certificates */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
          <FaCertificate className="text-[hsl(var(--primary))]" />
          Certificados MAEXTRIA
        </h4>

        {isLoading ? (
          <div className="text-center py-4 text-[hsl(var(--muted-foreground))]">
            Carregando...
          </div>
        ) : platformCerts.length === 0 ? (
          <div className="bg-[hsl(var(--muted)/0.3)] rounded-lg p-4 text-center text-[hsl(var(--muted-foreground))]">
            <p className="text-sm">Voce ainda nao possui certificados pagos na plataforma.</p>
            <p className="text-xs mt-1">Complete cursos e adquira certificados para exibi-los aqui.</p>
          </div>
        ) : (
          <div>
            {platformCerts.map((cert) => (
              <EntryCard
                key={cert.id}
                title={cert.course_title}
                subtitle={`Instrutor: ${cert.teacher_name}`}
                period={`Emitido em ${formatDate(cert.issued_at)}`}
                badge="MAEXTRIA"
                readOnly
              />
            ))}
          </div>
        )}
      </div>

      {/* External Certificates */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-[hsl(var(--foreground))] flex items-center gap-2">
            <FaExternalLinkAlt className="text-[hsl(var(--muted-foreground))]" />
            Certificados Externos
          </h4>
          <button
            onClick={openAddModal}
            className="btn-accent px-3 py-1.5 flex items-center gap-2 text-sm"
          >
            <FaPlus size={12} />
            Adicionar
          </button>
        </div>

        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
          Adicione certificados obtidos em outras plataformas ou instituicoes.
        </p>

        {externalCerts.length === 0 ? (
          <div className="text-center py-4 text-[hsl(var(--muted-foreground))]">
            Nenhum certificado externo adicionado.
          </div>
        ) : (
          <div>
            {externalCerts.map((cert) => (
              <EntryCard
                key={cert.id}
                title={cert.name}
                subtitle={cert.institution}
                period={cert.issue_date ? `Emitido em ${cert.issue_date}` : undefined}
                badge={cert.credential_url ? 'Com link' : undefined}
                onEdit={() => openEditModal(cert)}
                onDelete={() => handleDelete(cert.id)}
              />
            ))}
          </div>
        )}
      </div>

      <EntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Editar Certificado' : 'Adicionar Certificado'}
        fields={fields}
        values={formValues}
        onChange={(name, value) => setFormValues({ ...formValues, [name]: value })}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
