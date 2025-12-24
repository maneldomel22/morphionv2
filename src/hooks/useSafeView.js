import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSafeView() {
  const [safeViewEnabled, setSafeViewEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSafeViewPreference();
  }, []);

  async function loadSafeViewPreference() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('safe_view_enabled')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          setSafeViewEnabled(data.safe_view_enabled ?? true);
        }
      }
    } catch (error) {
      console.error('Error loading safe view preference:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateSafeView(enabled) {
    const previousValue = safeViewEnabled;
    setSafeViewEnabled(enabled);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ safe_view_enabled: enabled })
          .eq('id', user.id);

        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error updating safe view preference:', error);
      setSafeViewEnabled(previousValue);
      return false;
    }
  }

  return { safeViewEnabled, updateSafeView, loading };
}
