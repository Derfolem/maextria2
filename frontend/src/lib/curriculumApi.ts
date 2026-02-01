// Curriculum API - uses Supabase in production, local API in development
import { supabase } from './supabase';
import api from './api';
import type {
  Curriculum,
  EducationEntry,
  ExperienceEntry,
  ExternalCertEntry,
  SkillEntry,
  LanguageEntry,
  PlatformCertificate
} from '../types';

const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

// Get full curriculum
export async function getCurriculum(userId: string): Promise<Curriculum | null> {
  if (USE_LOCAL_AUTH) {
    const response = await api.get('/curriculum');
    return response.data;
  }

  // Supabase: get or create curriculum
  let { data: curriculum } = await supabase
    .from('curriculos')
    .select('*')
    .eq('usuario_id', userId)
    .single();

  if (!curriculum) {
    const { data: newCurriculum } = await supabase
      .from('curriculos')
      .insert({ usuario_id: userId })
      .select()
      .single();
    curriculum = newCurriculum;
  }

  if (!curriculum) return null;

  // Get related data
  const [educationRes, experienceRes, externalCertsRes, skillsRes, languagesRes] = await Promise.all([
    supabase.from('curriculo_formacao').select('*').eq('curriculo_id', curriculum.id).order('ordem'),
    supabase.from('curriculo_experiencia').select('*').eq('curriculo_id', curriculum.id).order('ordem'),
    supabase.from('curriculo_certificados_externos').select('*').eq('curriculo_id', curriculum.id).order('ordem'),
    supabase.from('curriculo_habilidades').select('*').eq('curriculo_id', curriculum.id).order('ordem'),
    supabase.from('curriculo_idiomas').select('*').eq('curriculo_id', curriculum.id).order('ordem'),
  ]);

  // Get user profile
  const { data: userData } = await supabase
    .from('usuarios')
    .select('id, nome_completo, email, cpf, telefone, endereco')
    .eq('id', userId)
    .single();

  return {
    id: curriculum.id,
    student_id: curriculum.usuario_id,
    professional_objective: curriculum.objetivo_profissional,
    additional_info: curriculum.informacoes_adicionais,
    created_at: new Date(curriculum.criado_em).getTime(),
    updated_at: new Date(curriculum.atualizado_em).getTime(),
    user: userData ? {
      id: userData.id,
      name: userData.nome_completo,
      email: userData.email,
      cpf: userData.cpf,
      phone: userData.telefone,
      address: userData.endereco,
    } : undefined,
    education: (educationRes.data || []).map(mapEducation),
    experience: (experienceRes.data || []).map(mapExperience),
    external_certs: (externalCertsRes.data || []).map(mapExternalCert),
    skills: (skillsRes.data || []).map(mapSkill),
    languages: (languagesRes.data || []).map(mapLanguage),
  };
}

// Update main curriculum (objective and additional info)
export async function updateCurriculum(userId: string, data: { professional_objective?: string; additional_info?: string }) {
  if (USE_LOCAL_AUTH) {
    return api.put('/curriculum', data);
  }

  return supabase
    .from('curriculos')
    .update({
      objetivo_profissional: data.professional_objective,
      informacoes_adicionais: data.additional_info,
      atualizado_em: new Date().toISOString(),
    })
    .eq('usuario_id', userId);
}

// ==================== EDUCATION ====================

export async function addEducation(curriculumId: string, data: Partial<EducationEntry>) {
  if (USE_LOCAL_AUTH) {
    return api.post('/curriculum/education', data);
  }

  return supabase.from('curriculo_formacao').insert({
    curriculo_id: curriculumId,
    instituicao: data.institution,
    grau: data.degree,
    area_estudo: data.field_of_study,
    data_inicio: data.start_date,
    data_fim: data.end_date,
    em_andamento: data.is_current === 1,
    descricao: data.description,
  }).select().single();
}

export async function updateEducation(id: string, data: Partial<EducationEntry>) {
  if (USE_LOCAL_AUTH) {
    return api.put(`/curriculum/education/${id}`, data);
  }

  return supabase.from('curriculo_formacao').update({
    instituicao: data.institution,
    grau: data.degree,
    area_estudo: data.field_of_study,
    data_inicio: data.start_date,
    data_fim: data.end_date,
    em_andamento: data.is_current === 1,
    descricao: data.description,
  }).eq('id', id);
}

export async function deleteEducation(id: string) {
  if (USE_LOCAL_AUTH) {
    return api.delete(`/curriculum/education/${id}`);
  }
  return supabase.from('curriculo_formacao').delete().eq('id', id);
}

// ==================== EXPERIENCE ====================

export async function addExperience(curriculumId: string, data: Partial<ExperienceEntry>) {
  if (USE_LOCAL_AUTH) {
    return api.post('/curriculum/experience', data);
  }

  return supabase.from('curriculo_experiencia').insert({
    curriculo_id: curriculumId,
    empresa: data.company,
    cargo: data.position,
    localizacao: data.location,
    data_inicio: data.start_date,
    data_fim: data.end_date,
    atual: data.is_current === 1,
    descricao: data.description,
  }).select().single();
}

export async function updateExperience(id: string, data: Partial<ExperienceEntry>) {
  if (USE_LOCAL_AUTH) {
    return api.put(`/curriculum/experience/${id}`, data);
  }

  return supabase.from('curriculo_experiencia').update({
    empresa: data.company,
    cargo: data.position,
    localizacao: data.location,
    data_inicio: data.start_date,
    data_fim: data.end_date,
    atual: data.is_current === 1,
    descricao: data.description,
  }).eq('id', id);
}

export async function deleteExperience(id: string) {
  if (USE_LOCAL_AUTH) {
    return api.delete(`/curriculum/experience/${id}`);
  }
  return supabase.from('curriculo_experiencia').delete().eq('id', id);
}

// ==================== EXTERNAL CERTS ====================

export async function addExternalCert(curriculumId: string, data: Partial<ExternalCertEntry>) {
  if (USE_LOCAL_AUTH) {
    return api.post('/curriculum/external-certs', data);
  }

  return supabase.from('curriculo_certificados_externos').insert({
    curriculo_id: curriculumId,
    nome: data.name,
    instituicao: data.institution,
    data_emissao: data.issue_date,
    data_validade: data.expiration_date,
    url_credencial: data.credential_url,
  }).select().single();
}

export async function updateExternalCert(id: string, data: Partial<ExternalCertEntry>) {
  if (USE_LOCAL_AUTH) {
    return api.put(`/curriculum/external-certs/${id}`, data);
  }

  return supabase.from('curriculo_certificados_externos').update({
    nome: data.name,
    instituicao: data.institution,
    data_emissao: data.issue_date,
    data_validade: data.expiration_date,
    url_credencial: data.credential_url,
  }).eq('id', id);
}

export async function deleteExternalCert(id: string) {
  if (USE_LOCAL_AUTH) {
    return api.delete(`/curriculum/external-certs/${id}`);
  }
  return supabase.from('curriculo_certificados_externos').delete().eq('id', id);
}

// ==================== SKILLS ====================

export async function addSkill(curriculumId: string, data: Partial<SkillEntry>) {
  if (USE_LOCAL_AUTH) {
    return api.post('/curriculum/skills', data);
  }

  const levelMap: Record<string, string> = {
    basic: 'basico',
    intermediate: 'intermediario',
    advanced: 'avancado',
    expert: 'expert',
  };

  return supabase.from('curriculo_habilidades').insert({
    curriculo_id: curriculumId,
    nome: data.name,
    nivel: levelMap[data.level || 'intermediate'] || 'intermediario',
  }).select().single();
}

export async function updateSkill(id: string, data: Partial<SkillEntry>) {
  if (USE_LOCAL_AUTH) {
    return api.put(`/curriculum/skills/${id}`, data);
  }

  const levelMap: Record<string, string> = {
    basic: 'basico',
    intermediate: 'intermediario',
    advanced: 'avancado',
    expert: 'expert',
  };

  return supabase.from('curriculo_habilidades').update({
    nome: data.name,
    nivel: data.level ? levelMap[data.level] : undefined,
  }).eq('id', id);
}

export async function deleteSkill(id: string) {
  if (USE_LOCAL_AUTH) {
    return api.delete(`/curriculum/skills/${id}`);
  }
  return supabase.from('curriculo_habilidades').delete().eq('id', id);
}

// ==================== LANGUAGES ====================

export async function addLanguage(curriculumId: string, data: Partial<LanguageEntry>) {
  if (USE_LOCAL_AUTH) {
    return api.post('/curriculum/languages', data);
  }

  const proficiencyMap: Record<string, string> = {
    basic: 'basico',
    intermediate: 'intermediario',
    advanced: 'avancado',
    fluent: 'fluente',
    native: 'nativo',
  };

  return supabase.from('curriculo_idiomas').insert({
    curriculo_id: curriculumId,
    idioma: data.language,
    proficiencia: proficiencyMap[data.proficiency || 'intermediate'] || 'intermediario',
  }).select().single();
}

export async function updateLanguage(id: string, data: Partial<LanguageEntry>) {
  if (USE_LOCAL_AUTH) {
    return api.put(`/curriculum/languages/${id}`, data);
  }

  const proficiencyMap: Record<string, string> = {
    basic: 'basico',
    intermediate: 'intermediario',
    advanced: 'avancado',
    fluent: 'fluente',
    native: 'nativo',
  };

  return supabase.from('curriculo_idiomas').update({
    idioma: data.language,
    proficiencia: data.proficiency ? proficiencyMap[data.proficiency] : undefined,
  }).eq('id', id);
}

export async function deleteLanguage(id: string) {
  if (USE_LOCAL_AUTH) {
    return api.delete(`/curriculum/languages/${id}`);
  }
  return supabase.from('curriculo_idiomas').delete().eq('id', id);
}

// ==================== PLATFORM CERTS ====================

export async function getPlatformCerts(userId: string): Promise<PlatformCertificate[]> {
  if (USE_LOCAL_AUTH) {
    const response = await api.get('/curriculum/platform-certs');
    return response.data;
  }

  const { data } = await supabase
    .from('certificados')
    .select('id, emitido_em, cursos(titulo, carga_horaria_horas)')
    .eq('usuario_id', userId)
    .eq('pago', true)
    .order('emitido_em', { ascending: false });

  return (data || []).map((cert: any) => ({
    id: cert.id,
    course_title: cert.cursos?.titulo || 'Curso',
    teacher_name: 'MAEXTRIA',
    duration_hours: cert.cursos?.carga_horaria_horas,
    issued_at: new Date(cert.emitido_em).getTime(),
  }));
}

// ==================== PDF EXPORT ====================

export async function exportCurriculumPdf(_userId: string) {
  if (USE_LOCAL_AUTH) {
    const response = await api.get('/curriculum/export/pdf', { responseType: 'blob' });
    return response.data;
  }

  // For Supabase, we need to generate PDF client-side or use an edge function
  // For now, throw an error indicating this feature requires setup
  throw new Error('PDF export requires server-side processing. Contact administrator.');
}

// ==================== MAPPERS ====================

function mapEducation(row: any): EducationEntry {
  return {
    id: row.id,
    curriculum_id: row.curriculo_id,
    institution: row.instituicao,
    degree: row.grau,
    field_of_study: row.area_estudo,
    start_date: row.data_inicio,
    end_date: row.data_fim,
    is_current: row.em_andamento ? 1 : 0,
    description: row.descricao,
    order_index: row.ordem || 0,
    created_at: new Date(row.criado_em).getTime(),
  };
}

function mapExperience(row: any): ExperienceEntry {
  return {
    id: row.id,
    curriculum_id: row.curriculo_id,
    company: row.empresa,
    position: row.cargo,
    location: row.localizacao,
    start_date: row.data_inicio,
    end_date: row.data_fim,
    is_current: row.atual ? 1 : 0,
    description: row.descricao,
    order_index: row.ordem || 0,
    created_at: new Date(row.criado_em).getTime(),
  };
}

function mapExternalCert(row: any): ExternalCertEntry {
  return {
    id: row.id,
    curriculum_id: row.curriculo_id,
    name: row.nome,
    institution: row.instituicao,
    issue_date: row.data_emissao,
    expiration_date: row.data_validade,
    credential_url: row.url_credencial,
    order_index: row.ordem || 0,
    created_at: new Date(row.criado_em).getTime(),
  };
}

function mapSkill(row: any): SkillEntry {
  const levelMap: Record<string, 'basic' | 'intermediate' | 'advanced' | 'expert'> = {
    basico: 'basic',
    intermediario: 'intermediate',
    avancado: 'advanced',
    expert: 'expert',
  };

  return {
    id: row.id,
    curriculum_id: row.curriculo_id,
    name: row.nome,
    level: levelMap[row.nivel] || 'intermediate',
    order_index: row.ordem || 0,
    created_at: new Date(row.criado_em).getTime(),
  };
}

function mapLanguage(row: any): LanguageEntry {
  const proficiencyMap: Record<string, 'basic' | 'intermediate' | 'advanced' | 'fluent' | 'native'> = {
    basico: 'basic',
    intermediario: 'intermediate',
    avancado: 'advanced',
    fluente: 'fluent',
    nativo: 'native',
  };

  return {
    id: row.id,
    curriculum_id: row.curriculo_id,
    language: row.idioma,
    proficiency: proficiencyMap[row.proficiencia] || 'intermediate',
    order_index: row.ordem || 0,
    created_at: new Date(row.criado_em).getTime(),
  };
}
