import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isEditor = location.pathname === '/scene-editor';

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setLoading(false);
      }
    }
    checkSession();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-textSecondary">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className={`flex-1 ${isEditor ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {isEditor ? (
            <Outlet />
          ) : (
            <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
