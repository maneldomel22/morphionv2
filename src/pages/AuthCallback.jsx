import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Confirmando seu email...');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');

        if (type === 'signup') {
          const { data, error } = await supabase.auth.getSession();

          if (error) throw error;

          if (data.session) {
            setStatus('success');
            setMessage('Email confirmado com sucesso!');

            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            throw new Error('Sessão não encontrada');
          }
        } else {
          throw new Error('Tipo de confirmação inválido');
        }
      } catch (error) {
        console.error('Erro na confirmação:', error);
        setStatus('error');
        setMessage('Erro ao confirmar email. O link pode ter expirado.');

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--surface))] p-8">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[rgba(var(--brand-primary),0.1)] rounded-full mb-6">
              <Loader2 className="w-8 h-8 text-[rgb(var(--brand-primary))] animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{message}</h1>
            <p className="text-[rgb(var(--text-secondary))]">Aguarde um momento...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[rgba(var(--success),0.1)] rounded-full mb-6 animate-scaleIn">
              <CheckCircle2 className="w-8 h-8 text-[rgb(var(--success))]" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-[rgb(var(--success))]">{message}</h1>
            <p className="text-[rgb(var(--text-secondary))]">Redirecionando para o dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[rgba(var(--error),0.1)] rounded-full mb-6 animate-scaleIn">
              <XCircle className="w-8 h-8 text-[rgb(var(--error))]" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-[rgb(var(--error))]">{message}</h1>
            <p className="text-[rgb(var(--text-secondary))]">Redirecionando para o login...</p>
          </>
        )}
      </div>
    </div>
  );
}
