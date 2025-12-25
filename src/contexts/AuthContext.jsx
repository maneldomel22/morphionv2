import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          if (!session.user.email_confirmed_at && !session.user.confirmed_at) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
          } else {
            setUser(session.user);
            const profileData = await authService.getProfile(session.user.id);
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          if (!session.user.email_confirmed_at && !session.user.confirmed_at) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            return;
          }

          setUser(session.user);
          try {
            const profileData = await authService.getProfile(session.user.id);
            setProfile(profileData);
          } catch (error) {
            console.error('Error loading profile:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          if (!session.user.email_confirmed_at && !session.user.confirmed_at) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            return;
          }
          setUser(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (data.user) {
      if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
        await supabase.auth.signOut();
        const notConfirmedError = new Error('Email not confirmed');
        notConfirmedError.code = 'email_not_confirmed';
        throw notConfirmedError;
      }

      const profileData = await authService.getProfile(data.user.id);
      setUser(data.user);
      setProfile(profileData);
    }

    return data;
  };

  const signUp = async (email, password, firstName, lastName, phone) => {
    const { data, error } = await supabase.auth.signUp({
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

    if (error) throw error;

    if (data.user) {
      const profileData = await authService.getProfile(data.user.id);
      setUser(data.user);
      setProfile(profileData);
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    setProfile(null);
  };

  const resendConfirmation = async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });

    if (error) throw error;
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resendConfirmation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
