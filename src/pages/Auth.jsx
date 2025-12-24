import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/authService';
import { formatPhoneNumber } from '../lib/phoneFormatter';
import { Sparkles, Mail, Lock, User, Loader2, AlertCircle, Phone } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const isLogin = mode === 'login';

  const validateForm = () => {
    console.log('=== VALIDATING FORM ===');

    if (!email || !password) {
      console.log('Validation failed: email or password empty');
      setError('Preencha todos os campos');
      return false;
    }

    if (!email.includes('@')) {
      console.log('Validation failed: invalid email');
      setError('Email inválido');
      return false;
    }

    if (password.length < 6) {
      console.log('Validation failed: password too short');
      setError('A senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (!isLogin && !firstName.trim()) {
      console.log('Validation failed: firstName empty');
      setError('Digite seu nome');
      return false;
    }

    if (!isLogin && !lastName.trim()) {
      console.log('Validation failed: lastName empty');
      setError('Digite seu sobrenome');
      return false;
    }

    if (!isLogin && !phone.trim()) {
      console.log('Validation failed: phone empty');
      setError('Digite seu telefone');
      return false;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    console.log('Phone digits count:', phoneDigits.length);

    if (!isLogin && phoneDigits.length < 10) {
      console.log('Validation failed: phone too short');
      setError('Telefone inválido');
      return false;
    }

    console.log('Validation passed!');
    return true;
  };

  const handleSubmit = async (e) => {
    console.log('=== FORM SUBMITTED ===');
    e.preventDefault();
    setError('');

    console.log('Form data:', { email, password, firstName, lastName, phone, isLogin });

    const isValid = validateForm();
    console.log('Form is valid:', isValid);

    if (!isValid) {
      console.log('Form validation failed');
      return;
    }

    console.log('Setting loading to true');
    setLoading(true);

    try {
      if (isLogin) {
        console.log('Calling signIn...');
        await signIn(email, password);
      } else {
        console.log('Starting signup process...');
        const result = await signUp(email, password, firstName, lastName, phone);
        console.log('Signup result:', result);
      }
      console.log('Navigating to dashboard...');
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup/Login error:', err);
      setError(getErrorMessage(err));
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--brand-primary))] via-[rgb(var(--brand-secondary))] to-[rgb(var(--brand-accent))] opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(124,110,255,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(77,163,255,0.12),transparent_50%)]"></div>

        <div className="relative z-10 flex flex-col justify-center px-16 max-w-2xl">
          <div className="mb-8 animate-fadeIn">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-effect border border-[rgba(var(--brand-primary),0.3)] mb-8">
              <Sparkles className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
              <span className="text-sm font-medium text-textSecondary">
                IA Generativa de Última Geração
              </span>
            </div>
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight animate-fadeInUp">
            Crie vídeos e imagens que parecem reais{' '}
            <span className="bg-gradient-to-r from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-secondary))] bg-clip-text text-transparent">
              em segundos
            </span>
          </h1>

          <p className="text-xl text-textSecondary mb-12 leading-relaxed animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            O Morphion transforma suas ideias em criativos prontos para anúncios, campanhas e social media usando as tecnologias mais avançadas do mercado.
          </p>

          <div className="grid grid-cols-3 gap-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
            {[
              { label: 'Vídeos HD', value: '100K+' },
              { label: 'Usuários', value: '50K+' },
              { label: 'Satisfação', value: '99%' }
            ].map((stat, i) => (
              <div key={i} className="glass-effect rounded-2xl p-6 border border-[rgba(var(--border-default),var(--border-default-opacity))]">
                <div className="text-3xl font-bold text-[rgb(var(--brand-primary))] mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-textSecondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="glass-effect rounded-3xl p-10 border border-[rgba(var(--border-default),var(--border-default-opacity))] shadow-2xl animate-scaleIn">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Morphion</span>
              </div>

              <div className="flex gap-1 p-1 bg-[rgb(var(--surface-muted))] rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => isLogin || switchMode()}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${
                    isLogin
                      ? 'bg-[rgb(var(--surface-elevated))] text-textPrimary shadow-lg'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => !isLogin || switchMode()}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${
                    !isLogin
                      ? 'bg-[rgb(var(--surface-elevated))] text-textPrimary shadow-lg'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  Criar Conta
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="transition-all duration-200">
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Nome
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textTertiary" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Digite seu nome"
                        className="w-full pl-12 pr-4 py-3.5 bg-[rgba(var(--surface-muted),0.3)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-textPrimary placeholder-textTertiary focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.2)] transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="transition-all duration-200">
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Sobrenome
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textTertiary" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Digite seu sobrenome"
                        className="w-full pl-12 pr-4 py-3.5 bg-[rgba(var(--surface-muted),0.3)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-textPrimary placeholder-textTertiary focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.2)] transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="transition-all duration-200">
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textTertiary" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                        placeholder="+55 83 9 99746991"
                        className="w-full pl-12 pr-4 py-3.5 bg-[rgba(var(--surface-muted),0.3)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-textPrimary placeholder-textTertiary focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.2)] transition-all duration-200"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textTertiary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-[rgba(var(--surface-muted),0.3)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-textPrimary placeholder-textTertiary focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.2)] transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textTertiary" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-12 pr-4 py-3.5 bg-[rgba(var(--surface-muted),0.3)] border border-[rgba(var(--border-default),var(--border-default-opacity))] rounded-xl text-textPrimary placeholder-textTertiary focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.2)] transition-all duration-200"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-[rgba(var(--error),0.1)] border border-[rgba(var(--error),0.3)] rounded-xl animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-[rgb(var(--error))] flex-shrink-0" />
                  <span className="text-sm text-[rgb(var(--error))]">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl glow-on-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isLogin ? 'Entrando...' : 'Criando conta...'}</span>
                  </>
                ) : (
                  <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-textSecondary">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-[rgb(var(--brand-primary))] hover:text-[rgb(var(--brand-primary-hover))] font-medium transition-colors"
                >
                  {isLogin ? 'Criar conta' : 'Fazer login'}
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-textTertiary mt-6">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  );
}
