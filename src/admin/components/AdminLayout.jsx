import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Video, MessageSquare, Settings, LogOut, CreditCard } from 'lucide-react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function AdminLayout() {
  const { signOut, user } = useAdminAuth();

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/admin/users', icon: Users, label: 'Usuários' },
    { to: '/admin/videos', icon: Video, label: 'Vídeos' },
    { to: '/admin/stripe', icon: CreditCard, label: 'Stripe' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Mensagens do Sistema' },
    { to: '/admin/settings', icon: Settings, label: 'Configurações' }
  ];

  return (
    <div className="min-h-screen bg-[#0B0D12] flex">
      <aside className="w-64 bg-[#121621] border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Morphion Admin</h1>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-[#1a1f2e] hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#1a1f2e] hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
