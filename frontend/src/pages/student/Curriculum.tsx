import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaBullseye,
  FaGraduationCap,
  FaBriefcase,
  FaCertificate,
  FaTools,
  FaLanguage,
  FaInfoCircle,
  FaFilePdf,
  FaArrowLeft,
  FaSpinner
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import AccordionSection from '../../components/curriculum/AccordionSection';
import PersonalDataSection from '../../components/curriculum/sections/PersonalDataSection';
import ObjectiveSection from '../../components/curriculum/sections/ObjectiveSection';
import EducationSection from '../../components/curriculum/sections/EducationSection';
import ExperienceSection from '../../components/curriculum/sections/ExperienceSection';
import CertificationsSection from '../../components/curriculum/sections/CertificationsSection';
import SkillsSection from '../../components/curriculum/sections/SkillsSection';
import LanguagesSection from '../../components/curriculum/sections/LanguagesSection';
import AdditionalInfoSection from '../../components/curriculum/sections/AdditionalInfoSection';
import type { Curriculum } from '../../types';

export default function StudentCurriculum() {
  const navigate = useNavigate();
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadCurriculum();
  }, []);

  const loadCurriculum = async () => {
    try {
      const response = await api.get('/curriculum');
      setCurriculum(response.data);
    } catch (error) {
      toast.error('Erro ao carregar curriculo');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/curriculum/export/pdf', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'curriculo.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar PDF');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <FaSpinner className="animate-spin text-4xl text-[hsl(var(--primary))]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/student')}
              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <FaArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Meu Curriculo</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Monte seu curriculo profissional
              </p>
            </div>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="btn-accent px-4 py-2 flex items-center gap-2"
          >
            {isExporting ? (
              <FaSpinner className="animate-spin" size={16} />
            ) : (
              <FaFilePdf size={16} />
            )}
            {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>

        {/* Accordion Sections */}
        <AccordionSection
          title="Dados Pessoais"
          icon={<FaUser size={18} />}
          defaultOpen={true}
        >
          <PersonalDataSection user={curriculum?.user} />
        </AccordionSection>

        <AccordionSection
          title="Objetivo Profissional"
          icon={<FaBullseye size={18} />}
          defaultOpen={!curriculum?.professional_objective}
        >
          <ObjectiveSection
            initialValue={curriculum?.professional_objective}
            onUpdate={loadCurriculum}
          />
        </AccordionSection>

        <AccordionSection
          title="Formacao Academica"
          icon={<FaGraduationCap size={18} />}
          badge={curriculum?.education.length || 0}
        >
          <EducationSection
            entries={curriculum?.education || []}
            onUpdate={loadCurriculum}
          />
        </AccordionSection>

        <AccordionSection
          title="Experiencia Profissional"
          icon={<FaBriefcase size={18} />}
          badge={curriculum?.experience.length || 0}
        >
          <ExperienceSection
            entries={curriculum?.experience || []}
            onUpdate={loadCurriculum}
          />
        </AccordionSection>

        <AccordionSection
          title="Cursos e Certificacoes"
          icon={<FaCertificate size={18} />}
          badge={curriculum?.external_certs.length || 0}
        >
          <CertificationsSection
            externalCerts={curriculum?.external_certs || []}
            onUpdate={loadCurriculum}
          />
        </AccordionSection>

        <AccordionSection
          title="Habilidades"
          icon={<FaTools size={18} />}
          badge={curriculum?.skills.length || 0}
        >
          <SkillsSection
            entries={curriculum?.skills || []}
            onUpdate={loadCurriculum}
          />
        </AccordionSection>

        <AccordionSection
          title="Idiomas"
          icon={<FaLanguage size={18} />}
          badge={curriculum?.languages.length || 0}
        >
          <LanguagesSection
            entries={curriculum?.languages || []}
            onUpdate={loadCurriculum}
          />
        </AccordionSection>

        <AccordionSection
          title="Informacoes Adicionais"
          icon={<FaInfoCircle size={18} />}
        >
          <AdditionalInfoSection
            initialValue={curriculum?.additional_info}
            onUpdate={loadCurriculum}
          />
        </AccordionSection>

        {/* Footer info */}
        <div className="text-center mt-8 text-sm text-[hsl(var(--muted-foreground))]">
          <p>Seu curriculo e salvo automaticamente a cada alteracao.</p>
          <p className="mt-1">
            Ultima atualizacao: {curriculum?.updated_at
              ? new Date(curriculum.updated_at).toLocaleString('pt-BR')
              : 'Nunca'}
          </p>
        </div>
      </div>
    </Layout>
  );
}
