import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Sparkles, Sun, Moon, Settings, LogOut, Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

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
        if (data && (!data.first_name || !data.last_name)) {
          let firstName = '';
          let lastName = '';

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

            data.first_name = firstName;
            data.last_name = lastName;
          }
        }

        setProfile(data);
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="glass-effect border-b px-3 sm:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-20 fade-in">
      <div className="flex justify-between items-center gap-2 sm:gap-4">
        {/* Menu hamburger para mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 active:scale-95 bg-gradient-to-br from-brandPrimary/15 to-brandSecondary/10 border text-textSecondary"
          aria-label="Open menu"
        >
          <Menu size={18} strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <div className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-brandPrimary/8 border rounded-full hover:bg-brandPrimary/12 transition-all duration-300 cursor-pointer group">
            <Sparkles size={14} sm:size={16} strokeWidth={2} className="text-textSecondary group-hover:text-textPrimary transition-colors" />
            <span className="text-xs sm:text-sm font-medium tracking-wide text-textPrimary">
              {profile?.credits || 0} <span className="hidden xs:inline">créditos</span>
            </span>
          </div>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 active:scale-95 bg-gradient-to-br from-brandPrimary/15 to-brandSecondary/10 border text-textSecondary"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={18} strokeWidth={2} />
          ) : (
            <Moon size={18} strokeWidth={2} />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 active:scale-95 bg-gradient-to-br from-brandPrimary/15 to-brandSecondary/10 border text-textSecondary"
            aria-label="User profile"
          >
            <User size={18} strokeWidth={2} />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowDropdown(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 sm:w-64 max-w-[calc(100vw-2rem)] bg-surface backdrop-blur-xl rounded-2xl border border-[rgba(var(--border-default),var(--border-default-opacity))] shadow-2xl overflow-hidden z-40 animate-fadeIn">
                <div className="p-4 border-b border-[rgba(var(--border-default),var(--border-default-opacity))]">
                  <p className="text-sm font-medium text-textPrimary truncate">
                    {profile?.first_name && profile?.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-textTertiary truncate mt-1">
                    {profile?.email}
                  </p>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-textSecondary hover:text-textPrimary hover:bg-[rgba(var(--brand-primary),0.1)] rounded-xl transition-all duration-200"
                  >
                    <Settings size={16} />
                    <span>Configurações</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[rgb(var(--error))] hover:bg-[rgba(var(--error),0.1)] rounded-xl transition-all duration-200"
                  >
                    <LogOut size={16} />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
