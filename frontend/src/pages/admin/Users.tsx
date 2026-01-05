import { useEffect, useState } from 'react';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { FaTrash, FaSearch, FaUserShield, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

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
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', String(userId));
      if (error) throw error;
      toast.success('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir usuário');
    }
  };

  const changeUserRole = async (userId: string | number, newRole: string) => {
    try {
      const rolesToClear = ['admin', 'teacher'];
      const { error: clearError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', String(userId))
        .in('role', rolesToClear);
      if (clearError) throw clearError;

      if (newRole === 'admin' || newRole === 'teacher') {
        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: String(userId), role: newRole }, { onConflict: 'user_id,role' });
        if (error && error.code !== '23505' && error.status !== 409) {
          throw error;
        }
      }

      toast.success('Tipo de usuário alterado com sucesso!');
      loadUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao alterar tipo');
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
                <th className="px-6 py-3">Cadastro</th>
                <th className="px-6 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[hsl(var(--muted))]">
                  <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
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
                  <td className="px-6 py-4 whitespace-nowrap text-[hsl(var(--muted-foreground))]">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {user.role === 'student' && (
                        <button
                          onClick={() => changeUserRole(user.id, 'teacher')}
                          className="btn-accent text-xs"
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
