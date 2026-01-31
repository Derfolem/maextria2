import { useEffect, useState } from 'react';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { FaTrash, FaSearch, FaUserShield, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { useAuthStore } from '../../lib/store';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [aiAccessMap, setAiAccessMap] = useState<Record<string, { granted_until: string | null; granted_by_admin: boolean }>>({});
  const [aiUpdating, setAiUpdating] = useState<Record<string, boolean>>({});
  const adminUser = useAuthStore((state) => state.user);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('usuarios')
        .select('id, nome_completo, email, criado_em')
        .order('criado_em', { ascending: false });
      if (error) throw error;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = (rolesError || !rolesData)
        ? {}
        : rolesData.reduce((acc: Record<string, string[]>, row) => {
            const key = String(row.user_id);
            acc[key] = acc[key] || [];
            acc[key].push(row.role);
            return acc;
          }, {});

      const { data: aiAccessData } = await supabase
        .from('ai_course_access')
        .select('usuario_id, granted_until, granted_by_admin');

      const aiAccessLookup = (aiAccessData || []).reduce((acc: Record<string, { granted_until: string | null; granted_by_admin: boolean }>, row: any) => {
        acc[String(row.usuario_id)] = {
          granted_until: row.granted_until,
          granted_by_admin: Boolean(row.granted_by_admin),
        };
        return acc;
      }, {});
      setAiAccessMap(aiAccessLookup);

      const mapped: User[] = (usersData || []).map((user) => {
        const roleList = rolesMap[String(user.id)] || [];
        const resolvedRole = roleList.includes('admin')
          ? 'admin'
          : roleList.includes('teacher')
            ? 'teacher'
            : 'student';

        return {
        id: user.id,
        name: user.nome_completo,
        email: user.email,
          role: resolvedRole as User['role'],
        created_at: user.criado_em,
        };
      });

      setUsers(mapped);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string | number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: String(userId),
      });
      if (error) throw error;
      toast.success('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir usuário');
    }
  };

  const changeUserRole = async (userId: string | number, newRole: string) => {
    try {
      const { error } = await supabase.rpc('admin_set_user_role', {
        target_user_id: String(userId),
        target_role: newRole,
      });
      if (error) throw error;

      toast.success('Tipo de usuário alterado com sucesso!');
      loadUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao alterar tipo');
    }
  };

  const isAiAccessActive = (userId: string | number) => {
    const access = aiAccessMap[String(userId)];
    if (!access) return false;
    if (access.granted_by_admin) return true;
    if (!access.granted_until) return false;
    return new Date(access.granted_until) > new Date();
  };

  const grantAiAccess = async (userId: string | number) => {
    setAiUpdating((prev) => ({ ...prev, [String(userId)]: true }));
    try {
      const { error } = await supabase
        .from('ai_course_access')
        .upsert({
          usuario_id: String(userId),
          granted_until: null,
          granted_by_admin: true,
          granted_by: adminUser?.id ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'usuario_id' });
      if (error) throw error;
      toast.success('Acesso IA liberado.');
      await loadUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao liberar IA.');
    } finally {
      setAiUpdating((prev) => ({ ...prev, [String(userId)]: false }));
    }
  };

  const revokeAiAccess = async (userId: string | number) => {
    setAiUpdating((prev) => ({ ...prev, [String(userId)]: true }));
    try {
      const { error } = await supabase
        .from('ai_course_access')
        .delete()
        .eq('usuario_id', String(userId));
      if (error) throw error;
      toast.success('Acesso IA revogado.');
      await loadUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao revogar IA.');
    } finally {
      setAiUpdating((prev) => ({ ...prev, [String(userId)]: false }));
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-[hsl(var(--accent))]" />;
      case 'teacher':
        return <FaChalkboardTeacher className="text-[hsl(var(--primary))]" />;
      case 'student':
        return <FaUserGraduate className="text-[hsl(var(--secondary))]" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Usuarios</p>
          <h1 className="headline-font text-4xl md:text-5xl">Gestao de perfis</h1>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <FaSearch className="absolute left-4 top-3 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="input-field pl-12 w-full"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Todos os tipos</option>
            <option value="student">Alunos</option>
            <option value="teacher">Professores</option>
            <option value="admin">Administradores</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
              <tr className="text-left uppercase tracking-[0.2em] text-[11px] text-[hsl(var(--muted-foreground))]">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3 min-w-[180px]">IA Cursos</th>
                <th className="px-6 py-3">Cadastro</th>
                <th className="px-6 py-3 min-w-[220px]">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[hsl(var(--muted))]">
                  <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {getRoleIcon(user.role)}
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[hsl(var(--muted-foreground))]">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => changeUserRole(user.id, e.target.value)}
                      className="input-field text-sm py-1"
                    >
                      <option value="student">Aluno</option>
                      <option value="teacher">Professor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.role === 'teacher' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          {isAiAccessActive(user.id)
                            ? 'Ativo'
                            : 'Bloqueado'}
                        </span>
                        {isAiAccessActive(user.id) ? (
                          <button
                            type="button"
                            onClick={() => revokeAiAccess(user.id)}
                            className="btn-outline text-xs px-3 py-2 whitespace-nowrap"
                            disabled={aiUpdating[String(user.id)]}
                          >
                            Revogar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => grantAiAccess(user.id)}
                            className="btn-accent text-xs px-3 py-2 whitespace-nowrap"
                            disabled={aiUpdating[String(user.id)]}
                          >
                            Liberar
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[hsl(var(--muted-foreground))]">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[hsl(var(--muted-foreground))]">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {user.role === 'student' && (
                        <button
                          onClick={() => changeUserRole(user.id, 'teacher')}
                          className="btn-accent text-xs px-3 py-2 whitespace-nowrap"
                        >
                          Aprovar professor
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Excluir usuario"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
            Nenhum usuario encontrado
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
        Total: {filteredUsers.length} usuario(s)
      </div>
    </div>
  );
}
