import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Zap, Users, Target } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    }
    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[rgb(var(--background))]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--gradient-start))] via-[rgb(var(--gradient-mid))] to-[rgb(var(--gradient-end))]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(var(--brand-primary),0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(var(--brand-secondary),0.06),transparent_50%)]"></div>

        <div className="relative z-10 flex flex-col justify-center px-16 max-w-2xl animate-fadeIn">
          <div className="mb-16">
            <div className="flex items-center gap-2.5 mb-20">
              <img src="/icon.png" alt="Morphion" className="w-9 h-9" />
              <span className="text-xl font-semibold tracking-tight">Morphion</span>
            </div>

            <h1 className="text-5xl font-bold mb-4 leading-[1.15] tracking-tight">
              Crie vídeos e imagens que parecem{' '}
              <span className="text-[rgb(var(--brand-primary))]">reais</span> em segundos
            </h1>

            <p className="text-lg text-[rgb(var(--text-secondary))] mb-10 leading-relaxed">
              A plataforma nº 1 em realismo para UGC, influencers virtuais e criativos de alta conversão.
            </p>

            <div className="flex flex-wrap gap-2.5 mb-16">
              {[
                { icon: Zap, text: 'Influencers virtuais realistas' },
                { icon: Users, text: 'Vídeos UGC sem prompt' },
                { icon: Target, text: 'Geração em massa' }
              ].map((item, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-[rgba(var(--surface-muted),0.4)] backdrop-blur-sm border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-full text-sm text-[rgb(var(--text-secondary))]"
                >
                  <item.icon className="w-3.5 h-3.5 text-[rgb(var(--brand-primary))]" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px] animate-scaleIn">
          <div className="lg:hidden flex items-center gap-2.5 mb-12 justify-center">
            <img src="/icon.png" alt="Morphion" className="w-9 h-9" />
            <span className="text-xl font-semibold tracking-tight">Morphion</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 tracking-tight">Bem-vindo de volta</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-4 py-3.5 bg-[rgba(var(--surface-muted),0.4)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.15)] transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                required
                className="w-full px-4 py-3.5 bg-[rgba(var(--surface-muted),0.4)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.15)] transition-all"
              />
            </div>

            {error && (
              <div className="p-3.5 bg-[rgba(var(--error),0.1)] border border-[rgba(var(--error),0.2)] rounded-xl animate-fadeIn">
                <p className="text-sm text-[rgb(var(--error))]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-[0_8px_30px_rgba(var(--brand-primary),0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="w-full py-3.5 border border-[rgba(var(--border-default),var(--border-default-opacity))] hover:border-[rgba(var(--border-hover),var(--border-hover-opacity))] text-[rgb(var(--text-primary))] font-medium rounded-xl transition-all active:scale-[0.98]"
            >
              Criar conta
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
            Termos de Serviço · Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  );
}
