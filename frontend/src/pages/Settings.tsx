import { useState } from 'react';
import { useAuthStore } from '../lib/store';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

export default function Settings() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/user/profile', { name, email });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/user/password', { current_password: currentPassword, new_password: newPassword });
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 gradient-text">Configurações da Conta</h1>

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
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
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
      </div>
    </div>
  );
}
