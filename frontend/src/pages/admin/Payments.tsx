import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

type UserRow = {
  userId: string;
  name: string;
  email: string;
  role: string;
  aiUsageUsd: number;
  aiPaymentsBrl: number;
  certPurchasesBrl: number;
  certSalesBrl: number;
  payingStudents: number;
};

type PaymentEntry = {
  id: string;
  type: 'ai_plan' | 'certificado';
  userId: string;
  name: string;
  email: string;
  amount: number;
  status: string;
  createdAt: string;
  detail: string;
};

export default function AdminPayments() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const resolveCourseOwnerId = (course: Record<string, any>) =>
    course.professor_id ?? course.teacher_id ?? course.autor_id ?? course.criado_por ?? course.user_id;

  const loadData = async () => {
    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const [
        { data: usersData },
        { data: rolesData },
        { data: usageData },
        { data: aiPayments },
        { data: transacoes },
        { data: cursos },
      ] = await Promise.all([
        supabase.from('usuarios').select('id, nome_completo, email'),
        supabase.from('user_roles').select('user_id, role'),
        supabase
          .from('ai_usage_periods')
          .select('usuario_id, total_usd, period_end')
          .gte('period_end', nowIso),
        supabase.from('ai_plan_payments').select('id, usuario_id, amount_brl, status, created_at, plan_code'),
        supabase
          .from('transacoes_pagamento')
          .select('id, usuario_id, curso_id, valor, status, criado_em')
          .eq('status', 'completo'),
        supabase.from('cursos').select('id, titulo, professor_id, teacher_id, autor_id, criado_por, user_id'),
      ]);

      const rolesMap = (rolesData || []).reduce((acc: Record<string, string[]>, row: any) => {
        const key = String(row.user_id);
        acc[key] = acc[key] || [];
        acc[key].push(row.role);
        return acc;
      }, {});

      const usageMap = (usageData || []).reduce((acc: Record<string, number>, row: any) => {
        const key = String(row.usuario_id);
        acc[key] = Math.max(acc[key] || 0, Number(row.total_usd || 0));
        return acc;
      }, {});

      const aiPaymentMap = (aiPayments || []).reduce((acc: Record<string, number>, row: any) => {
        if (row.status !== 'completo') return acc;
        const key = String(row.usuario_id);
        acc[key] = (acc[key] || 0) + Number(row.amount_brl || 0);
        return acc;
      }, {});

      const courseOwnerMap = (cursos || []).reduce((acc: Record<string, string>, course: any) => {
        acc[String(course.id)] = String(resolveCourseOwnerId(course) || '');
        return acc;
      }, {});

      const certPurchaseMap = (transacoes || []).reduce((acc: Record<string, number>, row: any) => {
        const key = String(row.usuario_id);
        acc[key] = (acc[key] || 0) + Number(row.valor || 0);
        return acc;
      }, {});

      const certSalesMap: Record<string, number> = {};
      const payingStudentsMap: Record<string, Set<string>> = {};
      (transacoes || []).forEach((row: any) => {
        const ownerId = courseOwnerMap[String(row.curso_id)];
        if (!ownerId) return;
        certSalesMap[ownerId] = (certSalesMap[ownerId] || 0) + Number(row.valor || 0);
        payingStudentsMap[ownerId] = payingStudentsMap[ownerId] || new Set<string>();
        payingStudentsMap[ownerId].add(String(row.usuario_id));
      });

      const userRows: UserRow[] = (usersData || []).map((user: any) => {
        const roleList = rolesMap[String(user.id)] || [];
        const resolvedRole = roleList.includes('admin')
          ? 'admin'
          : roleList.includes('teacher')
            ? 'teacher'
            : 'student';
        return {
          userId: String(user.id),
          name: user.nome_completo || 'Sem nome',
          email: user.email || '',
          role: resolvedRole,
          aiUsageUsd: usageMap[String(user.id)] || 0,
          aiPaymentsBrl: aiPaymentMap[String(user.id)] || 0,
          certPurchasesBrl: certPurchaseMap[String(user.id)] || 0,
          certSalesBrl: certSalesMap[String(user.id)] || 0,
          payingStudents: payingStudentsMap[String(user.id)]?.size || 0,
        };
      });

      const paymentEntries: PaymentEntry[] = [
        ...(aiPayments || []).map((row: any) => ({
          id: String(row.id),
          type: 'ai_plan' as const,
          userId: String(row.usuario_id),
          name: userRows.find((u) => u.userId === String(row.usuario_id))?.name || 'Usuario',
          email: userRows.find((u) => u.userId === String(row.usuario_id))?.email || '',
          amount: Number(row.amount_brl || 0),
          status: row.status || 'pendente',
          createdAt: row.created_at,
          detail: `Plano IA ${row.plan_code || ''}`.trim(),
        })),
        ...(transacoes || []).map((row: any) => ({
          id: String(row.id),
          type: 'certificado' as const,
          userId: String(row.usuario_id),
          name: userRows.find((u) => u.userId === String(row.usuario_id))?.name || 'Usuario',
          email: userRows.find((u) => u.userId === String(row.usuario_id))?.email || '',
          amount: Number(row.valor || 0),
          status: row.status || 'completo',
          createdAt: row.criado_em,
          detail: `Certificado ${row.curso_id || ''}`,
        })),
      ];

      setRows(userRows);
      setEntries(paymentEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar pagamentos.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.toLowerCase();
    return rows.filter((row) =>
      row.name.toLowerCase().includes(term) || row.email.toLowerCase().includes(term)
    );
  }, [rows, search]);

  const downloadCsv = () => {
    setExporting(true);
    try {
      const header = [
        'Usuario',
        'Email',
        'Perfil',
        'Consumo IA (USD)',
        'Pagamentos IA (BRL)',
        'Certificados comprados (BRL)',
        'Vendas certificados (BRL)',
        'Alunos pagantes',
      ];
      const lines = filteredRows.map((row) => [
        row.name,
        row.email,
        row.role,
        row.aiUsageUsd.toFixed(4),
        row.aiPaymentsBrl.toFixed(2),
        row.certPurchasesBrl.toFixed(2),
        row.certSalesBrl.toFixed(2),
        row.payingStudents.toString(),
      ]);
      const csv = [header, ...lines].map((line) => line.map((cell) => `"${cell}"`).join(';')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'extrato-usuarios.csv';
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const downloadPdf = () => {
    const html = `
      <html>
        <head><title>Extrato usuarios</title></head>
        <body>
          <h2>Extrato geral</h2>
          <table border="1" cellpadding="6" cellspacing="0">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Consumo IA (USD)</th>
                <th>Pagamentos IA (BRL)</th>
                <th>Certificados comprados (BRL)</th>
                <th>Vendas certificados (BRL)</th>
                <th>Alunos pagantes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRows
                .map(
                  (row) => `
                <tr>
                  <td>${row.name}</td>
                  <td>${row.email}</td>
                  <td>${row.role}</td>
                  <td>${row.aiUsageUsd.toFixed(4)}</td>
                  <td>${row.aiPaymentsBrl.toFixed(2)}</td>
                  <td>${row.certPurchasesBrl.toFixed(2)}</td>
                  <td>${row.certSalesBrl.toFixed(2)}</td>
                  <td>${row.payingStudents}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '_blank', 'noopener');
    if (!win) {
      toast.error('Nao foi possivel abrir a janela do PDF.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleDeleteUserData = async (userId: string) => {
    if (!confirm('Apagar dados de pagamentos e consumo deste usuario?')) return;
    setDeleting((prev) => ({ ...prev, [userId]: true }));
    try {
      await supabase.from('ai_usage_periods').delete().eq('usuario_id', userId);
      await supabase.from('ai_plan_payments').delete().eq('usuario_id', userId);
      await supabase.from('ai_plan_access').delete().eq('usuario_id', userId);
      await supabase.from('transacoes_pagamento').delete().eq('usuario_id', userId);
      toast.success('Dados apagados.');
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao apagar dados.');
    } finally {
      setDeleting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">
          Pagamentos e consumo
        </p>
        <h1 className="text-3xl font-bold">Extrato geral</h1>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar usuario por nome ou email"
            className="input-field flex-1 min-w-[240px]"
          />
          <div className="flex gap-2">
            <button type="button" className="btn-outline" onClick={downloadCsv} disabled={exporting}>
              {exporting ? 'Gerando...' : 'Baixar CSV'}
            </button>
            <button type="button" className="btn-outline" onClick={downloadPdf}>
              Baixar PDF
            </button>
            <button type="button" className="btn-accent" onClick={loadData}>
              Atualizar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredRows.map((row) => (
            <div key={row.userId} className="border border-[hsl(var(--border))] rounded-[12px] p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{row.email}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Perfil: {row.role}</p>
                </div>
                <div className="grid md:grid-cols-4 gap-3 text-sm min-w-[360px]">
                  <div>
                    <p className="font-semibold">Consumo IA</p>
                    <p className="text-[hsl(var(--muted-foreground))]">US$ {row.aiUsageUsd.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Pag. IA</p>
                    <p className="text-[hsl(var(--muted-foreground))]">R$ {row.aiPaymentsBrl.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Cert. comprados</p>
                    <p className="text-[hsl(var(--muted-foreground))]">R$ {row.certPurchasesBrl.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Vendas cert.</p>
                    <p className="text-[hsl(var(--muted-foreground))]">R$ {row.certSalesBrl.toFixed(2)}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Alunos: {row.payingStudents}</p>
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    className="text-sm text-red-600 underline underline-offset-2"
                    onClick={() => handleDeleteUserData(row.userId)}
                    disabled={deleting[row.userId]}
                  >
                    {deleting[row.userId] ? 'Apagando...' : 'Apagar dados'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Pagamentos registrados</h2>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={`${entry.type}-${entry.id}`} className="flex flex-wrap justify-between gap-3 border-b py-2">
              <div>
                <p className="font-semibold">{entry.name}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{entry.email}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{entry.detail}</p>
              </div>
              <div className="text-sm text-right">
                <p className="font-semibold">R$ {entry.amount.toFixed(2)}</p>
                <p className="text-[hsl(var(--muted-foreground))]">{entry.type === 'ai_plan' ? 'Plano IA' : 'Certificado'}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
