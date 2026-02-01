import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard, FaExternalLinkAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import type { CurriculumUser } from '../../../types';

interface PersonalDataSectionProps {
  user?: CurriculumUser;
}

export default function PersonalDataSection({ user }: PersonalDataSectionProps) {
  if (!user) {
    return (
      <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
        Carregando dados...
      </div>
    );
  }

  const fields = [
    { icon: <FaUser />, label: 'Nome', value: user.name },
    { icon: <FaEnvelope />, label: 'Email', value: user.email },
    { icon: <FaIdCard />, label: 'CPF', value: user.cpf || 'Nao informado' },
    { icon: <FaPhone />, label: 'Telefone', value: user.phone || 'Nao informado' },
    { icon: <FaMapMarkerAlt />, label: 'Endereco', value: user.address || 'Nao informado' },
  ];

  const missingFields = fields.filter(f => f.value === 'Nao informado').length;

  return (
    <div>
      {missingFields > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-yellow-600">
            Voce tem {missingFields} campo(s) nao preenchido(s). Complete seu perfil para um curriculo mais completo.
          </p>
          <Link
            to="/profile"
            className="text-sm text-yellow-600 hover:text-yellow-500 flex items-center gap-1"
          >
            Editar Perfil <FaExternalLinkAlt size={10} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg"
          >
            <span className="text-[hsl(var(--primary))]">{field.icon}</span>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{field.label}</p>
              <p className={`text-sm ${field.value === 'Nao informado' ? 'text-[hsl(var(--muted-foreground))] italic' : 'text-[hsl(var(--foreground))]'}`}>
                {field.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-4">
        * Estes dados sao carregados automaticamente do seu perfil. Para edita-los, acesse a pagina de perfil.
      </p>
    </div>
  );
}
