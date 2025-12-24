import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { AlertCircle } from 'lucide-react';

console.log('[AdminLogin] Module loaded - VERSION 2.0');

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAdminAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    console.log('[AdminLogin] Submit started with email:', email);
    setError('');
    setLoading(true);

    try {
      console.log('[AdminLogin] Calling signIn...');
      await signIn(email, password);
      console.log('[AdminLogin] SignIn successful, navigating...');
      navigate('/admin');
      console.log('[AdminLogin] Navigate called');
    } catch (err) {
      console.error('[AdminLogin] Error during login:', err);
      setError('Credenciais inválidas ou você não tem permissão de administrador');
    } finally {
      console.log('[AdminLogin] Login process complete');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0D12] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#121621] rounded-2xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Morphion Admin</h1>
            <p className="text-gray-400">Painel Administrativo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="admin@morphion.ai"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
