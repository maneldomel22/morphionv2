import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Lock, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setValidToken(true);
        } else {
          setError('Link de recuperação inválido ou expirado');
        }
      } catch (err) {
        setError('Erro ao validar link de recuperação');
      } finally {
        setCheckingToken(false);
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!password || password.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres');
      }

      if (password !== confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--surface))]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[rgb(var(--brand-primary))]" />
          <p className="text-[rgb(var(--text-secondary))]">Validando link...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--surface))] p-8">
        <div className="w-full max-w-md">
          <div className="p-6 bg-[rgba(var(--error),0.1)] border border-[rgba(var(--error),0.2)] rounded-xl mb-6">
            <p className="text-sm text-[rgb(var(--error))]">{error}</p>
          </div>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-[0_8px_30px_rgba(var(--brand-primary),0.25)] transition-all active:scale-[0.98]"
          >
            Solicitar novo link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[rgb(var(--surface))]">
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
              Redefina sua{' '}
              <span className="text-[rgb(var(--brand-primary))]">senha</span>
            </h1>

            <p className="text-lg text-[rgb(var(--text-secondary))] mb-10 leading-relaxed">
              Escolha uma nova senha segura para sua conta.
            </p>
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
            <h2 className="text-3xl font-bold mb-2 tracking-tight">Nova senha</h2>
            <p className="text-[rgb(var(--text-secondary))]">
              Digite sua nova senha abaixo
            </p>
          </div>

          {success ? (
            <div className="space-y-5">
              <div className="p-6 bg-[rgba(var(--success),0.1)] border border-[rgba(var(--success),0.2)] rounded-xl animate-fadeIn">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[rgb(var(--success))] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[rgb(var(--success))] font-medium mb-1">
                      Senha redefinida com sucesso!
                    </p>
                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                      Você será redirecionado para o dashboard...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nova senha"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-[rgba(var(--surface-muted),0.4)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.15)] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-[rgba(var(--surface-muted),0.4)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.15)] transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-[rgba(var(--error),0.1)] border border-[rgba(var(--error),0.2)] rounded-xl animate-fadeIn">
                  <p className="text-sm text-[rgb(var(--error))]">{error}</p>
                </div>
              )}

              <div className="p-3 bg-[rgba(var(--surface-muted),0.4)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl">
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  A senha deve ter no mínimo 6 caracteres
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-[0_8px_30px_rgba(var(--brand-primary),0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Redefinindo senha...</span>
                  </>
                ) : (
                  <span>Redefinir senha</span>
                )}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
            Lembrou sua senha?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[rgb(var(--brand-primary))] hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
