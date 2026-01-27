import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { FaPlus, FaSave, FaTrash, FaCheck } from 'react-icons/fa';

type CertificateTemplate = {
  id: string;
  nome: string;
  titulo: string;
  subtitulo: string;
  linha_curso: string;
  descricao: string;
  local_emissao: string;
  assinatura_label: string;
  legal_texto: string;
  label_carga_horaria: string;
  label_modalidade: string;
  label_data: string;
  label_codigo: string;
  modalidade_texto: string;
  ativo: boolean;
  criado_em: string;
};

type TemplateForm = Omit<CertificateTemplate, 'id' | 'ativo' | 'criado_em'> & {
  id?: string;
  ativo?: boolean;
};

const defaultForm: TemplateForm = {
  nome: 'Padrao MAEXTRIA',
  titulo: 'CERTIFICADO DE CONCLUSAO',
  subtitulo: 'Certificamos que',
  linha_curso: 'concluiu com exito o curso',
  descricao:
    'promovido pela plataforma MAEXTRIA, com carga horaria total de {{carga_horaria}} horas, realizado na modalidade {{modalidade}}, com foco em aplicacao pratica, desenvolvimento profissional e formacao continuada.',
  local_emissao: 'Rio de Janeiro - RJ',
  assinatura_label: 'Diretoria Academica - MAEXTRIA',
  legal_texto:
    'Cursos livres realizados na modalidade Educacao a Distancia, conforme legislacao brasileira vigente, incluindo o Decreto no 9.057/2017 e normas aplicaveis a formacao continuada. Conteudo alinhado as boas praticas da ABED - Associacao Brasileira de Educacao a Distancia.',
  label_carga_horaria: 'Carga horaria',
  label_modalidade: 'Modalidade',
  label_data: 'Data de conclusao',
  label_codigo: 'Codigo de validacao',
  modalidade_texto: 'Online (EAD)',
};

const placeholderList = [
  { token: '{{aluno}}', label: 'Nome do aluno' },
  { token: '{{cpf}}', label: 'CPF do aluno' },
  { token: '{{curso}}', label: 'Nome do curso' },
  { token: '{{carga_horaria}}', label: 'Carga horaria (horas)' },
  { token: '{{data_extenso}}', label: 'Data por extenso' },
  { token: '{{data_curta}}', label: 'Data curta' },
  { token: '{{codigo_validacao}}', label: 'Codigo de validacao' },
  { token: '{{modalidade}}', label: 'Modalidade' },
  { token: '{{nota}}', label: 'Nota final' },
  { token: '{{url_validacao}}', label: 'URL de validacao' },
];

export default function CertificateTemplates() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingActive, setSettingActive] = useState(false);
  const [form, setForm] = useState<TemplateForm>(defaultForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      const rows = (data || []) as CertificateTemplate[];
      setTemplates(rows);
      const active = rows.find((row) => row.ativo) || rows[0];
      if (active) {
        setSelectedId(active.id);
        setForm(mapToForm(active));
      } else {
        setSelectedId(null);
        setForm(defaultForm);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar modelos.');
    } finally {
      setLoading(false);
    }
  };

  const mapToForm = (template: CertificateTemplate): TemplateForm => ({
    id: template.id,
    ativo: template.ativo,
    nome: template.nome,
    titulo: template.titulo,
    subtitulo: template.subtitulo,
    linha_curso: template.linha_curso,
    descricao: template.descricao,
    local_emissao: template.local_emissao,
    assinatura_label: template.assinatura_label,
    legal_texto: template.legal_texto,
    label_carga_horaria: template.label_carga_horaria,
    label_modalidade: template.label_modalidade,
    label_data: template.label_data,
    label_codigo: template.label_codigo,
    modalidade_texto: template.modalidade_texto,
  });

  const handleSelect = (template: CertificateTemplate) => {
    setSelectedId(template.id);
    setForm(mapToForm(template));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateNew = () => {
    setSelectedId(null);
    setForm({ ...defaultForm, nome: 'Novo modelo' });
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error('Informe um nome para o modelo.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        titulo: form.titulo.trim(),
        subtitulo: form.subtitulo.trim(),
        linha_curso: form.linha_curso.trim(),
        descricao: form.descricao.trim(),
        local_emissao: form.local_emissao.trim(),
        assinatura_label: form.assinatura_label.trim(),
        legal_texto: form.legal_texto.trim(),
        label_carga_horaria: form.label_carga_horaria.trim(),
        label_modalidade: form.label_modalidade.trim(),
        label_data: form.label_data.trim(),
        label_codigo: form.label_codigo.trim(),
        modalidade_texto: form.modalidade_texto.trim(),
      };

      if (form.id) {
        const { error } = await supabase
          .from('certificate_templates')
          .update(payload)
          .eq('id', form.id);
        if (error) throw error;
        toast.success('Modelo atualizado!');
      } else {
        const { data, error } = await supabase
          .from('certificate_templates')
          .insert(payload)
          .select('*')
          .single();
        if (error) throw error;
        toast.success('Modelo criado!');
        if (data?.id) {
          setSelectedId(data.id);
          setForm(mapToForm(data as CertificateTemplate));
        }
      }
      await loadTemplates();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar modelo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;
    const confirmed = confirm('Tem certeza que deseja excluir este modelo?');
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from('certificate_templates')
        .delete()
        .eq('id', form.id);
      if (error) throw error;
      toast.success('Modelo excluido!');
      setSelectedId(null);
      setForm(defaultForm);
      await loadTemplates();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir modelo.');
    }
  };

  const handleSetActive = async () => {
    if (!form.id) return;
    setSettingActive(true);
    try {
      const { error: resetError } = await supabase
        .from('certificate_templates')
        .update({ ativo: false })
        .neq('id', form.id);
      if (resetError) throw resetError;
      const { error } = await supabase
        .from('certificate_templates')
        .update({ ativo: true })
        .eq('id', form.id);
      if (error) throw error;
      toast.success('Modelo ativo atualizado!');
      await loadTemplates();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao ativar modelo.');
    } finally {
      setSettingActive(false);
    }
  };

  const preview = useMemo(() => {
    const sample = {
      aluno: 'Maria Costa',
      cpf: '000.000.000-00',
      curso: 'Formacao em Produto Digital',
      carga_horaria: '24',
      data_extenso: '10 de janeiro de 2026',
      data_curta: '10/01/2026',
      codigo_validacao: 'MX-2026-0001',
      modalidade: form.modalidade_texto || 'Online (EAD)',
      nota: '93%',
      url_validacao: 'https://maextria.com.br/verificar-certificado?codigo=MX-2026-0001',
    };

    const applyTemplate = (value: string) =>
      Object.entries(sample).reduce(
        (acc, [key, replacement]) => acc.split(`{{${key}}}`).join(replacement),
        value
      );

    return {
      titulo: applyTemplate(form.titulo),
      subtitulo: applyTemplate(form.subtitulo),
      linhaCurso: applyTemplate(form.linha_curso),
      descricao: applyTemplate(form.descricao),
      localEmissao: applyTemplate(form.local_emissao),
      assinatura: applyTemplate(form.assinatura_label),
      legal: applyTemplate(form.legal_texto),
      labelCarga: applyTemplate(form.label_carga_horaria),
      labelModalidade: applyTemplate(form.label_modalidade),
      labelData: applyTemplate(form.label_data),
      labelCodigo: applyTemplate(form.label_codigo),
      modalidade: applyTemplate(form.modalidade_texto),
      nomeAluno: sample.aluno,
      cpfAluno: sample.cpf,
      curso: sample.curso,
      carga: sample.carga_horaria,
      dataCurta: sample.data_curta,
      codigo: sample.codigo_validacao,
    };
  }, [form]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Certificados</p>
          <h1 className="headline-font text-4xl md:text-5xl">Modelos de certificado</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-3 max-w-xl">
            Crie modelos reutilizaveis e defina qual deve ser aplicado na emissao do PDF para alunos.
          </p>
        </div>
        <button type="button" className="btn-secondary flex items-center gap-2" onClick={handleCreateNew}>
          <FaPlus />
          Novo modelo
        </button>
      </div>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Modelos cadastrados</h2>
            <div className="space-y-3">
              {templates.length === 0 ? (
                <p className="text-[hsl(var(--muted-foreground))]">Nenhum modelo cadastrado.</p>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelect(template)}
                    className={`w-full text-left p-4 rounded-lg border transition ${
                      selectedId === template.id
                        ? 'border-[hsl(var(--primary))] bg-white/5'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{template.nome}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          Criado em {new Date(template.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {template.ativo && (
                        <span className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--secondary))]">
                          Ativo
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Placeholders disponiveis</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Use estes tokens em qualquer campo para preencher automaticamente no PDF.
            </p>
            <div className="flex flex-wrap gap-2">
              {placeholderList.map((item) => (
                <span
                  key={item.token}
                  className="text-xs border border-[hsl(var(--border))] px-3 py-1 rounded-full"
                >
                  {item.token} · {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Editar modelo</h2>
              {form.ativo ? (
                <span className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--secondary))]">Ativo</span>
              ) : null}
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Nome do modelo</label>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  className="input-field mt-2"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Titulo principal</label>
                  <input
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subtitulo</label>
                  <input
                    name="subtitulo"
                    value={form.subtitulo}
                    onChange={handleChange}
                    className="input-field mt-2"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Linha do curso</label>
                  <input
                    name="linha_curso"
                    value={form.linha_curso}
                    onChange={handleChange}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Modalidade (valor)</label>
                  <input
                    name="modalidade_texto"
                    value={form.modalidade_texto}
                    onChange={handleChange}
                    className="input-field mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Descricao principal</label>
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  className="input-field mt-2 min-h-[120px]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Local de emissao</label>
                  <input
                    name="local_emissao"
                    value={form.local_emissao}
                    onChange={handleChange}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Assinatura</label>
                  <input
                    name="assinatura_label"
                    value={form.assinatura_label}
                    onChange={handleChange}
                    className="input-field mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Texto legal / rodape</label>
                <textarea
                  name="legal_texto"
                  value={form.legal_texto}
                  onChange={handleChange}
                  className="input-field mt-2 min-h-[120px]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Label: carga horaria</label>
                  <input
                    name="label_carga_horaria"
                    value={form.label_carga_horaria}
                    onChange={handleChange}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Label: modalidade</label>
                  <input
                    name="label_modalidade"
                    value={form.label_modalidade}
                    onChange={handleChange}
                    className="input-field mt-2"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Label: data de conclusao</label>
                  <input
                    name="label_data"
                    value={form.label_data}
                    onChange={handleChange}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Label: codigo</label>
                  <input
                    name="label_codigo"
                    value={form.label_codigo}
                    onChange={handleChange}
                    className="input-field mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                type="button"
                className="btn-primary flex items-center gap-2"
                onClick={handleSave}
                disabled={saving}
              >
                <FaSave />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                className="btn-outline flex items-center gap-2"
                onClick={handleSetActive}
                disabled={settingActive || !form.id}
              >
                <FaCheck />
                {settingActive ? 'Ativando...' : 'Definir como ativo'}
              </button>
              <button
                type="button"
                className="btn-outline flex items-center gap-2"
                onClick={handleDelete}
                disabled={!form.id}
              >
                <FaTrash />
                Excluir
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Preview rapido</h2>
            <div className="border border-[hsl(var(--border))] rounded-xl p-6 space-y-4 bg-[hsl(var(--background))]/40">
              <div className="text-center space-y-2">
                <p className="text-sm tracking-[0.2em] text-[hsl(var(--muted-foreground))]">MAEXTRIA</p>
                <h3 className="headline-font text-2xl text-[hsl(var(--secondary))]">{preview.titulo}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{preview.subtitulo}</p>
                <p className="text-xl font-semibold text-[hsl(var(--foreground))]">{preview.nomeAluno}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">CPF: {preview.cpfAluno}</p>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{preview.linhaCurso}</p>
                <p className="text-lg font-semibold text-[hsl(var(--secondary))]">{preview.curso}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{preview.descricao}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="border border-[hsl(var(--border))] rounded-lg p-3">
                  <p className="text-[hsl(var(--muted-foreground))]">{preview.labelCarga}</p>
                  <p className="font-semibold">{preview.carga} horas</p>
                </div>
                <div className="border border-[hsl(var(--border))] rounded-lg p-3">
                  <p className="text-[hsl(var(--muted-foreground))]">{preview.labelModalidade}</p>
                  <p className="font-semibold">{preview.modalidade}</p>
                </div>
                <div className="border border-[hsl(var(--border))] rounded-lg p-3">
                  <p className="text-[hsl(var(--muted-foreground))]">{preview.labelData}</p>
                  <p className="font-semibold">{preview.dataCurta}</p>
                </div>
                <div className="border border-[hsl(var(--border))] rounded-lg p-3">
                  <p className="text-[hsl(var(--muted-foreground))]">{preview.labelCodigo}</p>
                  <p className="font-semibold">{preview.codigo}</p>
                </div>
              </div>

              <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-2">
                <p>{preview.legal}</p>
                <div className="flex items-center justify-between text-[hsl(var(--foreground))]">
                  <span>{preview.localEmissao}</span>
                  <span>{preview.assinatura}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
