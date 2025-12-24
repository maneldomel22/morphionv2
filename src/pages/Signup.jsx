import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatPhoneNumber } from '../lib/phoneFormatter';
import { Loader2, User, Phone } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !firstName || !lastName || !phone) {
      setError('Preencha todos os campos');
      return;
    }

    if (!email.includes('@')) {
      setError('Email inválido');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            credits: 10
          });

        if (profileError && profileError.code !== '23505') {
          console.error('Erro ao criar perfil:', profileError);
        }

        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Erro no signup:', err);
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
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
              Comece a criar conteúdo{' '}
              <span className="text-[rgb(var(--brand-primary))]">realista</span> hoje
            </h1>

            <p className="text-lg text-[rgb(var(--text-secondary))] mb-10 leading-relaxed">
              Junte-se a milhares de criadores que já usam Morphion para gerar vídeos e imagens incríveis.
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
            <h2 className="text-3xl font-bold mb-2 tracking-tight">Criar nova conta</h2>
            <p className="text-[rgb(var(--text-secondary))]">Preencha os dados para começar</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nome"
                  required
                  className="w-full px-4 py-3.5 bg-[rgba(var(--surface-muted),0.4)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.15)] transition-all"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sobrenome"
                  required
                  className="w-full px-4 py-3.5 bg-[rgba(var(--surface-muted),0.4)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.15)] transition-all"
                />
              </div>
            </div>

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
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Telefone"
                required
                maxLength="15"
                className="w-full px-4 py-3.5 bg-[rgba(var(--surface-muted),0.4)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.15)] transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha (mínimo 6 caracteres)"
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
                  <span>Criando conta...</span>
                </>
              ) : (
                <span>Criar conta</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3.5 border border-[rgba(var(--border-default),var(--border-default-opacity))] hover:border-[rgba(var(--border-hover),var(--border-hover-opacity))] text-[rgb(var(--text-primary))] font-medium rounded-xl transition-all active:scale-[0.98]"
            >
              Já tenho conta
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
            Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  );
}
