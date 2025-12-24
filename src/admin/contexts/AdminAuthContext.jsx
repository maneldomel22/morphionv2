import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const AdminAuthContext = createContext();

const ADMIN_STORAGE_KEY = 'morphion-admin-status';

console.log('[AdminAuth] Module loaded at:', new Date().toISOString());
console.log('[AdminAuth] VERSION: 4.0 - Fixed session persistence + localStorage cache');

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const cached = localStorage.getItem(ADMIN_STORAGE_KEY);
      return cached === 'true';
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('[AdminAuth] Loading timeout - forcing loading to false');
      setLoading(false);
    }, 3000);

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AdminAuth] Auth state change:', event, session?.user?.id);

      if (event === 'SIGNED_OUT') {
        console.log('[AdminAuth] User signed out');
        setUser(null);
        setIsAdmin(false);
        clearAdminCache();
        setLoading(false);
      } else if (session?.user) {
        console.log('[AdminAuth] User session detected');
        setUser(session.user);

        const cachedStatus = getCachedAdminStatus();
        if (cachedStatus) {
          console.log('[AdminAuth] Using cached admin status for fast load');
          setIsAdmin(true);
          setLoading(false);
          checkAdminStatus(session.user.id);
        } else {
          await checkAdminStatus(session.user.id);
          setLoading(false);
        }
      } else {
        console.log('[AdminAuth] No session');
        setUser(null);
        setIsAdmin(false);
        clearAdminCache();
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      console.log('[AdminAuth] Checking user...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AdminAuth] Current session:', session?.user?.id);

      if (session?.user) {
        setUser(session.user);

        const cachedStatus = getCachedAdminStatus();
        if (cachedStatus) {
          console.log('[AdminAuth] Using cached admin status for instant load');
          setIsAdmin(true);
          setLoading(false);
          checkAdminStatus(session.user.id);
        } else {
          await checkAdminStatus(session.user.id);
          setLoading(false);
        }
      } else {
        console.log('[AdminAuth] No session found');
        setUser(null);
        setIsAdmin(false);
        clearAdminCache();
        setLoading(false);
      }
    } catch (error) {
      console.error('[AdminAuth] Error checking user:', error);
      setUser(null);
      setIsAdmin(false);
      clearAdminCache();
      setLoading(false);
    }
  }

  async function checkAdminStatus(userId) {
    try {
      console.log('[AdminAuth] Checking admin status for user:', userId);
      const startTime = Date.now();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Admin check timeout')), 2000);
      });

      const queryPromise = supabase
        .from('admins')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      const result = await Promise.race([queryPromise, timeoutPromise]);

      const elapsed = Date.now() - startTime;
      console.log('[AdminAuth] Query completed in', elapsed, 'ms');

      if (result.error) {
        console.error('[AdminAuth] Query error:', result.error);
        const cachedStatus = getCachedAdminStatus();
        console.log('[AdminAuth] Using cached admin status:', cachedStatus);
        setIsAdmin(cachedStatus);
        return;
      }

      const isAdminUser = !!result.data;
      console.log('[AdminAuth] Is admin:', isAdminUser);

      setIsAdmin(isAdminUser);

      if (isAdminUser) {
        cacheAdminStatus(true);
      } else {
        clearAdminCache();
      }
    } catch (error) {
      console.error('[AdminAuth] Error checking admin status:', error);
      const cachedStatus = getCachedAdminStatus();
      console.log('[AdminAuth] Error occurred, using cached status:', cachedStatus);
      setIsAdmin(cachedStatus);
    }
  }

  function cacheAdminStatus(status) {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, status.toString());
      console.log('[AdminAuth] Cached admin status:', status);
    } catch (error) {
      console.error('[AdminAuth] Error caching admin status:', error);
    }
  }

  function getCachedAdminStatus() {
    try {
      const cached = localStorage.getItem(ADMIN_STORAGE_KEY);
      return cached === 'true';
    } catch {
      return false;
    }
  }

  function clearAdminCache() {
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      console.log('[AdminAuth] Cleared admin cache');
    } catch (error) {
      console.error('[AdminAuth] Error clearing admin cache:', error);
    }
  }

  async function signIn(email, password) {
    console.log('[AdminAuth] signIn called with email:', email);

    try {
      console.log('[AdminAuth] Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('[AdminAuth] signInWithPassword result:', { data: data?.user?.id, error });

      if (error) {
        console.error('[AdminAuth] Auth error:', error);
        throw error;
      }

      console.log('[AdminAuth] Auth successful, setting user and checking admin status...');
      setUser(data.user);
      await checkAdminStatus(data.user.id);
      console.log('[AdminAuth] Admin status check complete');

      return data;
    } catch (error) {
      console.error('[AdminAuth] signIn error:', error);
      throw error;
    }
  }

  async function signOut() {
    console.log('[AdminAuth] Signing out...');
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    clearAdminCache();
    console.log('[AdminAuth] Sign out complete');
  }

  return (
    <AdminAuthContext.Provider value={{
      user,
      isAdmin,
      loading,
      signIn,
      signOut
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
