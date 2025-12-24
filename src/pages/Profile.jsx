import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircle2, AlertCircle, Loader2, Sparkles, Eye, EyeOff, Shield } from 'lucide-react';
import { useSafeView } from '../hooks/useSafeView';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [privacyMessage, setPrivacyMessage] = useState({ type: '', text: '' });
  const { safeViewEnabled, updateSafeView, loading: safeViewLoading } = useSafeView();
  const [updatingSafeView, setUpdatingSafeView] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        // Se não tiver first_name e last_name, tenta popular
        let firstName = data?.first_name || '';
        let lastName = data?.last_name || '';

        if (data && (!firstName || !lastName)) {
          // Primeiro tenta do full_name
          if (data.full_name) {
            const names = data.full_name.trim().split(' ');
            firstName = names[0] || '';
            lastName = names.slice(1).join(' ') || '';
          }
          // Se não tiver full_name, extrai do email
          else if (data.email) {
            const emailName = data.email.split('@')[0];
            // Remove números e caracteres especiais, capitaliza
            firstName = emailName
              .replace(/[0-9_.]/g, ' ')
              .trim()
              .split(' ')[0];
            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
          }

          // Só atualiza se conseguiu extrair algum nome
          if (firstName) {
            await supabase
              .from('profiles')
              .update({
                first_name: firstName,
                last_name: lastName
              })
              .eq('id', user.id);
          }
        }

        setProfile(data);
        setFirstName(firstName);
        setLastName(lastName);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSafeViewToggle = async () => {
    setUpdatingSafeView(true);
    const success = await updateSafeView(!safeViewEnabled);
    if (success) {
      setPrivacyMessage({
        type: 'success',
        text: safeViewEnabled
          ? 'Safe View desativado. Conteúdo sensível será exibido sem filtro.'
          : 'Safe View ativado. Conteúdo sensível será protegido.'
      });
      setTimeout(() => setPrivacyMessage({ type: '', text: '' }), 3000);
    } else {
      setPrivacyMessage({
        type: 'error',
        text: 'Erro ao atualizar preferência. Tente novamente.'
      });
    }
    setUpdatingSafeView(false);
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-textPrimary mb-2 tracking-tight">Perfil</h1>
      <p className="text-textSecondary mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">Gerencie suas informações e preferências</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="glass-effect">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-textSecondary">Créditos Disponíveis</p>
              <p className="text-2xl font-bold text-textPrimary">{profile?.credits || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(var(--brand-secondary),0.15)] border border-[rgba(var(--brand-secondary),0.3)] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[rgb(var(--brand-secondary))]" />
            </div>
            <div>
              <p className="text-sm text-textSecondary">Plano Atual</p>
              <p className="text-xl font-bold text-textPrimary">Básico</p>
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(var(--brand-accent),0.15)] border border-[rgba(var(--brand-accent),0.3)] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[rgb(var(--brand-accent))]" />
            </div>
            <div>
              <p className="text-sm text-textSecondary">Status</p>
              <p className="text-xl font-bold text-[rgb(var(--success))]">Ativo</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <h3 className="text-lg font-semibold mb-6 text-textPrimary">Informações Pessoais</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">Nome</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.2)] transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">Sobrenome</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Seu sobrenome"
                  className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.2)] transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-surfaceMuted/10 border rounded-xl text-textSecondary cursor-not-allowed"
              />
              <p className="text-xs text-textTertiary mt-1">O email não pode ser alterado</p>
            </div>

            {message.text && (
              <div className={`flex items-center gap-2 p-4 rounded-xl animate-fadeIn ${
                message.type === 'success'
                  ? 'bg-[rgba(var(--success),0.1)] border border-[rgba(var(--success),0.3)]'
                  : 'bg-[rgba(var(--error),0.1)] border border-[rgba(var(--error),0.3)]'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-[rgb(var(--success))] flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[rgb(var(--error))] flex-shrink-0" />
                )}
                <span className={`text-sm ${
                  message.type === 'success' ? 'text-[rgb(var(--success))]' : 'text-[rgb(var(--error))]'
                }`}>
                  {message.text}
                </span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Alterações</span>
              )}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-textPrimary">Privacidade e Segurança</h3>
              <p className="text-sm text-textSecondary mt-1">Controle como o conteúdo sensível é exibido</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-surfaceMuted/30 rounded-xl border border-borderColor">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  {safeViewEnabled ? (
                    <Eye className="w-5 h-5 text-green-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-orange-500" />
                  )}
                  <h4 className="font-semibold text-textPrimary">Safe View (Visão Segura)</h4>
                </div>
                <p className="text-sm text-textSecondary">
                  {safeViewEnabled
                    ? 'Conteúdo sensível está protegido com filtro de desfoque. Você precisa revelar manualmente cada conteúdo.'
                    : 'Conteúdo sensível será exibido sem filtros. Use com cautela em ambientes públicos.'
                  }
                </p>
                {!safeViewEnabled && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Aviso: Conteúdo explícito será visível imediatamente</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSafeViewToggle}
                disabled={safeViewLoading || updatingSafeView}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 flex-shrink-0 ${
                  safeViewEnabled
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                } ${(safeViewLoading || updatingSafeView) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    safeViewEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
                {updatingSafeView && (
                  <Loader2 className="absolute inset-0 m-auto w-4 h-4 text-white animate-spin" />
                )}
              </button>
            </div>

            {privacyMessage.text && (
              <div className={`flex items-center gap-2 p-4 rounded-xl animate-fadeIn ${
                privacyMessage.type === 'success'
                  ? 'bg-[rgba(var(--success),0.1)] border border-[rgba(var(--success),0.3)]'
                  : 'bg-[rgba(var(--error),0.1)] border border-[rgba(var(--error),0.3)]'
              }`}>
                {privacyMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-[rgb(var(--success))] flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[rgb(var(--error))] flex-shrink-0" />
                )}
                <span className={`text-sm ${
                  privacyMessage.type === 'success' ? 'text-[rgb(var(--success))]' : 'text-[rgb(var(--error))]'
                }`}>
                  {privacyMessage.text}
                </span>
              </div>
            )}

            <div className="text-xs text-textTertiary bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
              <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">Como funciona:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Com Safe View ativado, conteúdo 18+ aparece com desfoque</li>
                <li>Você pode revelar temporariamente cada conteúdo individualmente</li>
                <li>Com Safe View desativado, todo conteúdo é exibido diretamente</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
