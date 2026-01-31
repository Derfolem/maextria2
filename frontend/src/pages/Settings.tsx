import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaPhoneAlt, FaMapMarkedAlt, FaTrash } from 'react-icons/fa';
import api from '../lib/api';
import { formatCpf, formatPhone, isValidCpf, normalizeCpf, normalizePhone } from '../lib/validators';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cpf, setCpf] = useState(user?.cpf || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [cpfTouched, setCpfTouched] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

  const requiresFullProfile = Boolean(user && user.role !== 'admin');
  const forcedByQuery = useMemo(() => new URLSearchParams(location.search).get('complete') === '1', [location.search]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setProfileLoading(false);
        return;
      }
      try {
        if (USE_LOCAL_AUTH) {
          const response = await api.get('/users/me');
          setName(response.data.name || '');
          setEmail(response.data.email || '');
          setCpf(response.data.cpf ? formatCpf(response.data.cpf) : '');
          setPhone(response.data.phone ? formatPhone(response.data.phone) : '');
          setAddress(response.data.address || '');
        } else {
          const { data, error } = await supabase
            .from('usuarios')
            .select('nome_completo, cpf, telefone, endereco')
            .eq('id', user.id)
            .maybeSingle();
          if (error) throw error;
          setName(data?.nome_completo || user.name || '');
          setCpf(data?.cpf ? formatCpf(data.cpf) : '');
          setPhone(data?.telefone ? formatPhone(data.telefone) : '');
          setAddress(data?.endereco || '');
        }
      } catch (error: any) {
        toast.error(error?.message || 'Erro ao carregar perfil');
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [USE_LOCAL_AUTH, user?.id, user?.name]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      if (requiresFullProfile) {
        const normalizedCpf = normalizeCpf(cpf);
        const normalizedPhone = normalizePhone(phone);
        if (!isValidCpf(normalizedCpf)) {
          setCpfTouched(true);
          throw new Error('CPF inválido.');
        }
        if (!normalizedPhone || normalizedPhone.length < 10) {
          throw new Error('Informe um telefone válido.');
        }
        if (!address.trim()) {
          throw new Error('Informe o endereço completo.');
        }
      }

      if (USE_LOCAL_AUTH) {
        const normalizedCpf = normalizeCpf(cpf);
        await api.put('/users/me', {
          name,
          cpf: requiresFullProfile ? normalizedCpf : undefined,
          phone: requiresFullProfile ? normalizePhone(phone) : undefined,
          address: requiresFullProfile ? address.trim() : undefined,
        });
      } else {
        const normalizedCpf = normalizeCpf(cpf);
        const { error: profileError } = await supabase
          .from('usuarios')
          .update({
            nome_completo: name,
            cpf: requiresFullProfile ? normalizedCpf : undefined,
            telefone: requiresFullProfile ? normalizePhone(phone) : undefined,
            endereco: requiresFullProfile ? address.trim() : undefined,
          })
          .eq('id', user.id);
        if (profileError) {
          throw profileError;
        }
      }

      if (!USE_LOCAL_AUTH && email && email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) {
          throw emailError;
        }
      }

      toast.success('Perfil atualizado com sucesso!');
      useAuthStore.getState().loadUser();
      if (forcedByQuery) {
        navigate('/settings', { replace: true });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?.email) {
        throw new Error('Usuário não autenticado.');
      }

      if (USE_LOCAL_AUTH) {
        await api.put('/users/me/password', { currentPassword, newPassword });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (signInError) {
          throw new Error('Senha atual incorreta.');
        }

        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) {
          throw passwordError;
        }
      }

      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmation = window.prompt('Digite EXCLUIR para confirmar a exclusão da conta.');
    if (confirmation !== 'EXCLUIR') {
      toast.error('Exclusão cancelada.');
      return;
    }
    setDeleteLoading(true);
    try {
      if (USE_LOCAL_AUTH) {
        await api.delete('/users/me');
      } else {
        const { data, error } = await supabase.functions.invoke('delete-user-self');
        if (error || !data?.success) {
          throw new Error(error?.message || 'Não foi possível excluir a conta.');
        }
      }
      toast.success('Conta excluída com sucesso.');
      useAuthStore.getState().logout();
      navigate('/');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir conta');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 gradient-text">Configurações da Conta</h1>

      {requiresFullProfile && (forcedByQuery || user?.profile_completed === false) && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          Complete seu cadastro para continuar usando a plataforma. Todos os campos abaixo são obrigatórios.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Informações do Perfil</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  required
                  disabled={profileLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  required
                  disabled={USE_LOCAL_AUTH || profileLoading}
                />
              </div>
            </div>

            {requiresFullProfile && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <div className="relative">
                    <FaIdCard className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpf(e.target.value))}
                      onBlur={() => setCpfTouched(true)}
                      className={`input-field pl-10 ${cpfTouched && !isValidCpf(cpf) ? 'border-red-400 focus:border-red-500' : ''}`}
                      placeholder="000.000.000-00"
                      required
                      disabled={profileLoading}
                    />
                  </div>
                  {cpfTouched && !isValidCpf(cpf) && (
                    <p className="mt-2 text-xs text-red-600">Informe um CPF válido.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <FaPhoneAlt className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      className="input-field pl-10"
                      placeholder="(00) 00000-0000"
                      required
                      disabled={profileLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço completo
                  </label>
                  <div className="relative">
                    <FaMapMarkedAlt className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Rua, número, bairro, cidade - UF"
                      required
                      disabled={profileLoading}
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading || profileLoading} className="btn-primary w-full">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Alterar Senha</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha Atual
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>
        </div>

        <div className="card md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Informações da Conta</h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Tipo:</strong> {user?.role === 'student' ? 'Aluno' : user?.role === 'teacher' ? 'Professor' : 'Administrador'}</p>
            <p><strong>Membro desde:</strong> {new Date(user?.created_at || '').toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="card md:col-span-2 border border-red-200">
          <h2 className="text-xl font-semibold mb-4 text-red-700">Excluir Conta</h2>
          <p className="text-sm text-red-700 mb-4">
            Esta ação é definitiva. Todos os seus dados e acessos serão removidos.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="btn-outline border-red-400 text-red-600 hover:bg-red-600 hover:text-white w-full flex items-center justify-center gap-2"
            disabled={deleteLoading}
          >
            <FaTrash />
            {deleteLoading ? 'Excluindo...' : 'Excluir minha conta'}
          </button>
        </div>
      </div>
    </div>
  );
}
