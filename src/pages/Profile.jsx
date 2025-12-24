import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        setProfile(data);
        setFullName(data?.full_name || '');
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
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
    } finally {
      setLoading(false);
    }
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

      <div className="max-w-2xl">
        <Card>
          <h3 className="text-lg font-semibold mb-6 text-textPrimary">Informações Pessoais</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Nome Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgba(var(--brand-primary),0.2)] transition-all duration-200"
              />
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
      </div>
    </div>
  );
}
