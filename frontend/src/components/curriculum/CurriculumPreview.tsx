import { forwardRef } from 'react';
import type { Curriculum, PlatformCertificate } from '../../types';

export type LayoutType = 'simple' | 'professional' | 'professional-photo';

interface CurriculumPreviewProps {
  curriculum: Curriculum;
  platformCerts: PlatformCertificate[];
  layout: LayoutType;
  photoUrl?: string;
}

const levelLabels: Record<string, string> = {
  basic: 'Basico',
  intermediate: 'Intermediario',
  advanced: 'Avancado',
  expert: 'Expert',
  fluent: 'Fluente',
  native: 'Nativo',
};

const formatDate = (date?: string) => {
  if (!date) return '';
  return date;
};

const CurriculumPreview = forwardRef<HTMLDivElement, CurriculumPreviewProps>(
  ({ curriculum, platformCerts, layout, photoUrl }, ref) => {
    const user = curriculum.user;

    // Combine platform and external certs
    const allCerts = [
      ...platformCerts.map(c => ({
        name: c.course_title,
        institution: 'MAEXTRIA',
        date: new Date(c.issued_at).toLocaleDateString('pt-BR'),
      })),
      ...curriculum.external_certs.map(c => ({
        name: c.name,
        institution: c.institution,
        date: c.issue_date || '',
      })),
    ];

    if (layout === 'simple') {
      return (
        <div ref={ref} className="bg-white text-black p-8 min-h-[297mm] w-[210mm] mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
            <h1 className="text-2xl font-bold uppercase">{user?.name || 'Nome'}</h1>
            <div className="text-sm text-gray-600 mt-2">
              {user?.email && <span>{user.email}</span>}
              {user?.phone && <span> | {user.phone}</span>}
            </div>
            {user?.address && <div className="text-sm text-gray-600">{user.address}</div>}
          </div>

          {/* Objetivo */}
          {curriculum.professional_objective && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Objetivo Profissional</h2>
              <p className="text-sm">{curriculum.professional_objective}</p>
            </div>
          )}

          {/* Experiencia */}
          {curriculum.experience.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Experiencia Profissional</h2>
              {curriculum.experience.map((exp, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between">
                    <strong className="text-sm">{exp.position}</strong>
                    <span className="text-xs text-gray-600">
                      {formatDate(exp.start_date)} - {exp.is_current ? 'Atual' : formatDate(exp.end_date)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">{exp.company}{exp.location && ` - ${exp.location}`}</div>
                  {exp.description && <p className="text-xs text-gray-600 mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Formacao */}
          {curriculum.education.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Formacao Academica</h2>
              {curriculum.education.map((edu, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between">
                    <strong className="text-sm">{edu.degree}</strong>
                    <span className="text-xs text-gray-600">
                      {formatDate(edu.start_date)} - {edu.is_current ? 'Atual' : formatDate(edu.end_date)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">{edu.institution}</div>
                  {edu.field_of_study && <div className="text-xs text-gray-600">{edu.field_of_study}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Certificacoes */}
          {allCerts.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Cursos e Certificacoes</h2>
              <div className="text-sm">
                {allCerts.map((cert, i) => (
                  <div key={i} className="mb-1">
                    <span>{cert.name}</span>
                    <span className="text-gray-600"> - {cert.institution}</span>
                    {cert.date && <span className="text-gray-500 text-xs"> ({cert.date})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Habilidades */}
          {curriculum.skills.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Habilidades</h2>
              <p className="text-sm">
                {curriculum.skills.map(s => `${s.name} (${levelLabels[s.level] || s.level})`).join(', ')}
              </p>
            </div>
          )}

          {/* Idiomas */}
          {curriculum.languages.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Idiomas</h2>
              <p className="text-sm">
                {curriculum.languages.map(l => `${l.language} - ${levelLabels[l.proficiency] || l.proficiency}`).join(', ')}
              </p>
            </div>
          )}

          {/* Info Adicional */}
          {curriculum.additional_info && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Informacoes Adicionais</h2>
              <p className="text-sm">{curriculum.additional_info}</p>
            </div>
          )}
        </div>
      );
    }

    if (layout === 'professional' || layout === 'professional-photo') {
      return (
        <div ref={ref} className="bg-white text-black min-h-[297mm] w-[210mm] mx-auto flex" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Sidebar */}
          <div className="w-1/3 bg-slate-800 text-white p-6">
            {/* Photo */}
            {layout === 'professional-photo' && (
              <div className="mb-6 flex justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto" className="w-32 h-32 rounded-full object-cover border-4 border-white" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-600 flex items-center justify-center text-4xl font-bold">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            )}

            {/* Contato */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-300">Contato</h3>
              {user?.email && <p className="text-xs mb-1 break-all">{user.email}</p>}
              {user?.phone && <p className="text-xs mb-1">{user.phone}</p>}
              {user?.address && <p className="text-xs">{user.address}</p>}
            </div>

            {/* Habilidades */}
            {curriculum.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-300">Habilidades</h3>
                {curriculum.skills.map((skill, i) => (
                  <div key={i} className="mb-2">
                    <div className="text-xs mb-1">{skill.name}</div>
                    <div className="h-1.5 bg-slate-600 rounded">
                      <div
                        className="h-full bg-cyan-400 rounded"
                        style={{
                          width: skill.level === 'basic' ? '25%' :
                                 skill.level === 'intermediate' ? '50%' :
                                 skill.level === 'advanced' ? '75%' : '100%'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Idiomas */}
            {curriculum.languages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-300">Idiomas</h3>
                {curriculum.languages.map((lang, i) => (
                  <div key={i} className="mb-2">
                    <div className="text-xs mb-1">{lang.language}</div>
                    <div className="h-1.5 bg-slate-600 rounded">
                      <div
                        className="h-full bg-cyan-400 rounded"
                        style={{
                          width: lang.proficiency === 'basic' ? '20%' :
                                 lang.proficiency === 'intermediate' ? '40%' :
                                 lang.proficiency === 'advanced' ? '60%' :
                                 lang.proficiency === 'fluent' ? '80%' : '100%'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="w-2/3 p-6">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-slate-800">
              <h1 className="text-2xl font-bold text-slate-800">{user?.name || 'Nome'}</h1>
              {curriculum.professional_objective && (
                <p className="text-sm text-gray-600 mt-2">{curriculum.professional_objective}</p>
              )}
            </div>

            {/* Experiencia */}
            {curriculum.experience.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-bold uppercase text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                  Experiencia Profissional
                </h2>
                {curriculum.experience.map((exp, i) => (
                  <div key={i} className="mb-4 pl-4 border-l-2 border-gray-200">
                    <div className="flex justify-between items-start">
                      <strong className="text-sm text-slate-800">{exp.position}</strong>
                      <span className="text-xs text-gray-500">
                        {formatDate(exp.start_date)} - {exp.is_current ? 'Atual' : formatDate(exp.end_date)}
                      </span>
                    </div>
                    <div className="text-sm text-cyan-600">{exp.company}</div>
                    {exp.location && <div className="text-xs text-gray-500">{exp.location}</div>}
                    {exp.description && <p className="text-xs text-gray-600 mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Formacao */}
            {curriculum.education.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-bold uppercase text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                  Formacao Academica
                </h2>
                {curriculum.education.map((edu, i) => (
                  <div key={i} className="mb-3 pl-4 border-l-2 border-gray-200">
                    <div className="flex justify-between items-start">
                      <strong className="text-sm text-slate-800">{edu.degree}</strong>
                      <span className="text-xs text-gray-500">
                        {formatDate(edu.start_date)} - {edu.is_current ? 'Atual' : formatDate(edu.end_date)}
                      </span>
                    </div>
                    <div className="text-sm text-cyan-600">{edu.institution}</div>
                    {edu.field_of_study && <div className="text-xs text-gray-500">{edu.field_of_study}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Certificacoes */}
            {allCerts.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-bold uppercase text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                  Cursos e Certificacoes
                </h2>
                <div className="pl-4 border-l-2 border-gray-200">
                  {allCerts.map((cert, i) => (
                    <div key={i} className="mb-1 text-sm">
                      <span className="text-slate-800">{cert.name}</span>
                      <span className="text-gray-500"> - {cert.institution}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Adicional */}
            {curriculum.additional_info && (
              <div className="mb-5">
                <h2 className="text-sm font-bold uppercase text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                  Informacoes Adicionais
                </h2>
                <p className="text-xs text-gray-600 pl-4 border-l-2 border-gray-200">{curriculum.additional_info}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  }
);

CurriculumPreview.displayName = 'CurriculumPreview';

export default CurriculumPreview;
