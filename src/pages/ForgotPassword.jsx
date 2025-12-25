import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!email || !email.includes('@')) {
        throw new Error('Email inválido');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
              Recupere o acesso à sua{' '}
              <span className="text-[rgb(var(--brand-primary))]">conta</span>
            </h1>

            <p className="text-lg text-[rgb(var(--text-secondary))] mb-10 leading-relaxed">
              Enviaremos um link seguro para você redefinir sua senha.
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

          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para login</span>
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 tracking-tight">Esqueci minha senha</h2>
            <p className="text-[rgb(var(--text-secondary))]">
              Digite seu email para receber as instruções de recuperação
            </p>
          </div>

          {success ? (
            <div className="space-y-5">
              <div className="p-6 bg-[rgba(var(--success),0.1)] border border-[rgba(var(--success),0.2)] rounded-xl animate-fadeIn">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[rgb(var(--success))] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[rgb(var(--success))] font-medium mb-1">
                      Email enviado com sucesso!
                    </p>
                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                      Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-[0_8px_30px_rgba(var(--brand-primary),0.25)] transition-all active:scale-[0.98]"
              >
                Voltar para login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-5">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className={`w-full px-4 py-3.5 bg-[rgba(var(--surface-muted),0.4)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.15)] transition-all ${email ? 'text-gradient-input' : 'text-[rgb(var(--text-primary))]'}`}
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
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar email de recuperação</span>
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
