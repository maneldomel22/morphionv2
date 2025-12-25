import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Mail, RefreshCw } from 'lucide-react';

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email não encontrado. Por favor, faça o cadastro novamente.');
      return;
    }

    setResending(true);
    setError('');
    setMessage('');

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (resendError) throw resendError;

      setMessage('Email de confirmação reenviado com sucesso!');
    } catch (err) {
      console.error('Erro ao reenviar email:', err);
      setError('Erro ao reenviar email. Tente novamente.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[rgba(var(--brand-primary),0.1)] rounded-full mb-6">
            <Mail className="w-8 h-8 text-[rgb(var(--brand-primary))]" />
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">Confirme seu email</h1>
          <p className="text-[rgb(var(--text-secondary))] leading-relaxed">
            Enviamos um email de confirmação para:
          </p>
          {email && (
            <p className="text-[rgb(var(--brand-primary))] font-medium mt-2">
              {email}
            </p>
          )}
        </div>

        <div className="bg-[rgba(var(--surface-muted),0.4)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-3">Próximos passos:</h2>
          <ol className="space-y-2 text-sm text-[rgb(var(--text-secondary))]">
            <li className="flex gap-2">
              <span className="text-[rgb(var(--brand-primary))] font-semibold">1.</span>
              <span>Verifique sua caixa de entrada</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[rgb(var(--brand-primary))] font-semibold">2.</span>
              <span>Clique no link de confirmação</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[rgb(var(--brand-primary))] font-semibold">3.</span>
              <span>Você será redirecionado automaticamente</span>
            </li>
          </ol>
        </div>

        {message && (
          <div className="p-3.5 bg-[rgba(var(--success),0.1)] border border-[rgba(var(--success),0.2)] rounded-xl mb-4 animate-fadeIn">
            <p className="text-sm text-[rgb(var(--success))]">{message}</p>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-[rgba(var(--error),0.1)] border border-[rgba(var(--error),0.2)] rounded-xl mb-4 animate-fadeIn">
            <p className="text-sm text-[rgb(var(--error))]">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-[0_8px_30px_rgba(var(--brand-primary),0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {resending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Reenviando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Reenviar email</span>
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 border border-[rgba(var(--border-default),var(--border-default-opacity))] hover:border-[rgba(var(--border-hover),var(--border-hover-opacity))] text-[rgb(var(--text-primary))] font-medium rounded-xl transition-all active:scale-[0.98]"
          >
            Voltar para o login
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
          Não recebeu o email? Verifique sua pasta de spam ou lixo eletrônico.
        </p>
      </div>
    </div>
  );
}
