import { useState, useEffect, useRef } from 'react';
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
  FaSpinner,
  FaEye,
  FaTimes,
  FaImage
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuthStore } from '../../lib/store';
import { getCurriculum, getPlatformCerts } from '../../lib/curriculumApi';
import AccordionSection from '../../components/curriculum/AccordionSection';
import PersonalDataSection from '../../components/curriculum/sections/PersonalDataSection';
import ObjectiveSection from '../../components/curriculum/sections/ObjectiveSection';
import EducationSection from '../../components/curriculum/sections/EducationSection';
import ExperienceSection from '../../components/curriculum/sections/ExperienceSection';
import CertificationsSection from '../../components/curriculum/sections/CertificationsSection';
import SkillsSection from '../../components/curriculum/sections/SkillsSection';
import LanguagesSection from '../../components/curriculum/sections/LanguagesSection';
import AdditionalInfoSection from '../../components/curriculum/sections/AdditionalInfoSection';
import CurriculumPreview, { LayoutType } from '../../components/curriculum/CurriculumPreview';
import type { Curriculum, PlatformCertificate } from '../../types';

const LAYOUT_OPTIONS: { value: LayoutType; label: string; description: string }[] = [
  { value: 'simple', label: 'Simples', description: 'Layout limpo e tradicional' },
  { value: 'professional', label: 'Profissional', description: 'Layout moderno com sidebar' },
  { value: 'professional-photo', label: 'Profissional c/ Foto', description: 'Layout moderno com foto' },
];

export default function StudentCurriculum() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const previewRef = useRef<HTMLDivElement>(null);

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [platformCerts, setPlatformCerts] = useState<PlatformCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('professional');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      loadCurriculum();
      loadPlatformCerts();
    }
  }, [user?.id]);

  const loadCurriculum = async () => {
    if (!user?.id) return;
    try {
      const data = await getCurriculum(String(user.id));
      setCurriculum(data);
    } catch (error) {
      toast.error('Erro ao carregar curriculo');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlatformCerts = async () => {
    if (!user?.id) return;
    try {
      const certs = await getPlatformCerts(String(user.id));
      setPlatformCerts(certs);
    } catch (error) {
      console.error('Error loading platform certs:', error);
    }
  };

  const handleExportPdf = async () => {
    if (!previewRef.current || !curriculum) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`curriculo-${curriculum.user?.name?.replace(/\s+/g, '-').toLowerCase() || 'meu'}.pdf`);

      toast.success('PDF exportado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao exportar PDF');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-4xl text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/student/dashboard')}
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
            onClick={() => setShowPreview(true)}
            className="btn-accent px-4 py-2 flex items-center gap-2"
          >
            <FaEye size={16} />
            Visualizar / Exportar
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
            curriculumId={curriculum?.id}
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
            curriculumId={curriculum?.id}
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
            curriculumId={curriculum?.id}
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
            curriculumId={curriculum?.id}
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
            curriculumId={curriculum?.id}
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

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && curriculum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 overflow-auto"
          >
            <div className="min-h-screen py-8 px-4">
              {/* Modal Header */}
              <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-white">Visualizacao do Curriculo</h2>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-white hover:text-gray-300 transition-colors"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              {/* Layout Options */}
              <div className="max-w-4xl mx-auto mb-6">
                <div className="bg-[hsl(var(--card))] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Escolha o Layout</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {LAYOUT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedLayout(option.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedLayout === option.value
                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
                            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]'
                        }`}
                      >
                        <div className="font-medium text-sm text-[hsl(var(--foreground))]">{option.label}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{option.description}</div>
                      </button>
                    ))}
                  </div>

                  {/* Photo Upload for professional-photo layout */}
                  {selectedLayout === 'professional-photo' && (
                    <div className="mt-4 flex items-center gap-4">
                      <label className="flex items-center gap-2 btn-outline px-4 py-2 cursor-pointer">
                        <FaImage size={14} />
                        {photoUrl ? 'Trocar Foto' : 'Adicionar Foto'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {photoUrl && (
                        <img src={photoUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                      )}
                    </div>
                  )}

                  {/* Export Button */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleExportPdf}
                      disabled={isExporting}
                      className="btn-accent px-6 py-2 flex items-center gap-2"
                    >
                      {isExporting ? (
                        <FaSpinner className="animate-spin" size={16} />
                      ) : (
                        <FaFilePdf size={16} />
                      )}
                      {isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex justify-center">
                <div className="shadow-2xl">
                  <CurriculumPreview
                    ref={previewRef}
                    curriculum={curriculum}
                    platformCerts={platformCerts}
                    layout={selectedLayout}
                    photoUrl={photoUrl}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
