import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Video,
  User,
  Scissors,
  Image,
  Mic,
  MessageSquare,
  FileText,
  FolderOpen,
  Sparkles,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  X
} from 'lucide-react';

export default function Sidebar({ mobileOpen = false, onMobileClose = () => {} }) {
  const [collapsed, setCollapsed] = useState(false);

  const allNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/library', icon: FolderOpen, label: 'Biblioteca' },
    { to: '/sora', icon: Video, label: 'Criar UGC (Sora 2)' },
    { to: '/influencer', icon: User, label: 'Modo Influencer' },
    { to: '/images', icon: Image, label: 'Imagens' },
    { to: '/voice-clone', icon: Mic, label: 'Clonagem de Voz' },
    { to: '/lipsync', icon: MessageSquare, label: 'Lip Sync' },
    { to: '/transcription', icon: FileText, label: 'Transcrição' },
    { to: '/morphy', icon: Sparkles, label: 'Morphy AI' },
    { to: '/scene-editor', icon: Scissors, label: 'Editor de Cenas', devOnly: true },
    { to: '/metrics', icon: BarChart3, label: 'Métricas', devOnly: true }
  ];

  const mainNavItems = allNavItems.filter(item => !item.devOnly || import.meta.env.DEV);

  const bottomNavItems = [
    { to: '/plans', icon: CreditCard, label: 'Planos' },
    { to: '/profile', icon: Settings, label: 'Perfil' }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } h-screen bg-gradient-to-b from-surface to-background border-r flex flex-col transition-all duration-300 ease-in-out overflow-hidden
        fixed md:static top-0 left-0 z-50 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
      <div className="p-3 sm:p-4 md:p-6 flex items-center justify-between border-b min-h-[60px] sm:min-h-[65px] md:min-h-[73px]">
        <div className={`flex items-center gap-2 sm:gap-3 transition-all duration-300 ${
          collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
        }`}>
          <img src="/icon.png" alt="Morphion" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" />
          <h1 className="text-base sm:text-lg md:text-xl font-semibold tracking-tight text-textPrimary whitespace-nowrap">
            Morphion
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {collapsed && (
            <img src="/icon.png" alt="Morphion" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 transition-opacity duration-300" />
          )}
          {/* Close button for mobile */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-2 rounded-lg transition-all duration-300 active:scale-90 text-textTertiary hover:bg-brandPrimary/10"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
          {/* Collapse button for desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden md:block p-2 rounded-lg transition-all duration-300 active:scale-90 flex-shrink-0 text-textTertiary hover:bg-brandPrimary/10 ${
              collapsed ? 'ml-0' : 'ml-auto'
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2 sm:p-3 space-y-1 overflow-y-auto">
        {mainNavItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `fade-in-up flex items-center py-2.5 sm:py-3 rounded-xl transition-all duration-500 group relative ${
                collapsed ? 'justify-center px-3' : 'px-3 sm:px-4'
              } ${
                isActive
                  ? 'bg-brandPrimary/10 text-textPrimary border border-brandPrimary/20 shadow-lg shadow-glow'
                  : 'text-textTertiary hover:text-textPrimary hover:bg-surface/50'
              }`
            }
            style={{ animationDelay: `${index * 30}ms` }}
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-brandPrimary to-brandSecondary rounded-r-full shadow-lg shadow-glow transition-all duration-300" />
                )}
                <div className={`flex items-center ${collapsed ? 'w-auto' : 'w-5'} flex-shrink-0`}>
                  <item.icon size={20} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
                </div>
                <span className={`font-medium text-sm tracking-wide whitespace-nowrap transition-all duration-300 ${
                  collapsed ? 'opacity-0 w-0 overflow-hidden ml-0' : 'opacity-100 ml-3'
                }`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 sm:p-3 space-y-1 border-t">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center py-2.5 sm:py-3 rounded-xl transition-all duration-500 group ${
                collapsed ? 'justify-center px-3' : 'px-3 sm:px-4'
              } ${
                isActive
                  ? 'bg-brandPrimary/10 text-textPrimary border border-brandPrimary/20'
                  : 'text-textTertiary hover:text-textPrimary hover:bg-surface/50'
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <div className={`flex items-center ${collapsed ? 'w-auto' : 'w-5'} flex-shrink-0`}>
              <item.icon size={20} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className={`font-medium text-sm tracking-wide whitespace-nowrap transition-all duration-300 ${
              collapsed ? 'opacity-0 w-0 overflow-hidden ml-0' : 'opacity-100 ml-3'
            }`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </aside>
    </>
  );
}
