import { supabase } from '../../lib/supabase';

export const adminService = {
  async getOverviewStats() {
    const PRICE_TO_MONTHLY_VALUE = {
      'price_1ScWyDKTMfsEL5TJRLQjgB7z': 5900,   // Starter - R$ 59
      'price_1ScWyiKTMfsEL5TJiGf4nGaZ': 14700,  // Creator - R$ 147
      'price_1ScWzMKTMfsEL5TJcVktB0qq': 27900,  // Pro - R$ 279
      'price_1SRKxLKTMfsEL5TJwMTW4NOg': 19700,  // Starter Antigo - R$ 197
      'price_1SRL0dKTMfsEL5TJ7wQQb8eR': 29700,  // Creator Antigo - R$ 297
    };

    const [usersResult, videosResult, imagesResult, subsResult] = await Promise.all([
      supabase.from('profiles').select('id, credits', { count: 'exact', head: false }),
      supabase.from('video_tasks').select('id', { count: 'exact', head: true }),
      supabase.from('image_generations').select('id', { count: 'exact', head: true }),
      supabase.from('stripe_subscriptions')
        .select('price_id, payment_method_last4')
        .eq('status', 'active')
        .is('deleted_at', null)
    ]);

    const totalCredits = usersResult.data?.reduce((sum, user) => sum + (user.credits || 0), 0) || 0;

    const monthlyRevenue = subsResult.data?.reduce((sum, sub) => {
      const value = PRICE_TO_MONTHLY_VALUE[sub.price_id] || 0;
      return sum + value;
    }, 0) || 0;

    return {
      totalUsers: usersResult.count || 0,
      totalCredits,
      totalVideos: videosResult.count || 0,
      totalImages: imagesResult.count || 0,
      totalRevenue: monthlyRevenue / 100
    };
  },

  async getSignupsLast30Days() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    const signupsByDay = {};
    data.forEach(profile => {
      const date = new Date(profile.created_at).toISOString().split('T')[0];
      signupsByDay[date] = (signupsByDay[date] || 0) + 1;
    });

    return Object.entries(signupsByDay).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));
  },

  async getCreditsUsageLast30Days() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('credits_history')
      .select(`
        *,
        profiles:user_id (
          email
        )
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const activityByDay = {};
    data.forEach(record => {
      const date = new Date(record.created_at).toISOString().split('T')[0];
      if (!activityByDay[date]) {
        activityByDay[date] = {
          added: 0,
          used: 0,
          transactions: []
        };
      }

      if (record.amount > 0) {
        activityByDay[date].added += record.amount;
      } else {
        activityByDay[date].used += Math.abs(record.amount);
      }

      activityByDay[date].transactions.push({
        id: record.id,
        user_id: record.user_id,
        email: record.profiles?.email,
        amount: record.amount,
        balance_after: record.balance_after,
        type: record.type,
        description: record.description,
        metadata: record.metadata,
        created_at: record.created_at
      });
    });

    return Object.entries(activityByDay).map(([date, data]) => ({
      date,
      added: data.added,
      used: data.used,
      total: data.added - data.used,
      transactions: data.transactions
    })).sort((a, b) => b.date.localeCompare(a.date));
  },

  async getUsers(filters = {}) {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.email) {
      query = query.ilike('email', `%${filters.email}%`);
    }

    if (filters.plan) {
      query = query.eq('plan', filters.plan);
    }

    if (filters.maxCredits !== undefined && filters.maxCredits !== '' && !isNaN(filters.maxCredits)) {
      query = query.lte('credits', parseInt(filters.maxCredits));
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getUserDetails(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getUserVideos(userId) {
    const { data, error } = await supabase
      .from('video_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserImages(userId) {
    const { data, error } = await supabase
      .from('image_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserChats(userId) {
    const { data, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserLipSyncTasks(userId) {
    const { data, error } = await supabase
      .from('lipsync_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserTranscriptions(userId) {
    const { data, error } = await supabase
      .from('transcription_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addUserCredits(userId, amount, note) {
    const { error } = await supabase.rpc('add_user_credits', {
      target_user_id: userId,
      credit_amount: amount,
      admin_note: note
    });

    if (error) throw error;
  },

  async updateUserPlan(userId, plan) {
    const planCredits = {
      'junior': 500,
      'starter': 750,
      'creator': 4000,
      'pro': 8000,
      'admin': 999999
    };

    const credits = planCredits[plan] || 0;

    const { error } = await supabase
      .from('profiles')
      .update({ plan, credits })
      .eq('id', userId);

    if (error) throw error;
  },

  async deleteUser(userId) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },

  async getSystemMessages() {
    const { data, error } = await supabase
      .from('system_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createSystemMessage(message) {
    const { data, error } = await supabase
      .from('system_messages')
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSystemMessage(id, updates) {
    const { data, error } = await supabase
      .from('system_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSystemMessage(id) {
    const { error } = await supabase
      .from('system_messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getSystemSettings() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) throw error;

    const settings = {};
    data.forEach(setting => {
      settings[setting.key] = setting.value;
    });

    return settings;
  },

  async updateSystemSetting(key, value) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) throw error;
  },

  async resetUserPassword(userId, newPassword) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          new_password: newPassword,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao redefinir senha');
    }

    return result;
  },

  async forceLogout(userId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-force-logout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao forçar logout');
    }

    return result;
  },

  async getPendingVideos(filter = 'pending') {
    let query = supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async checkAllVideosStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-all-pending-videos`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao verificar vídeos');
    }

    return {
      checked: result.checked || 0,
      updated: result.results?.filter(r => r.status === 'ready' || r.status === 'failed').length || 0,
    };
  },

  async checkVideoStatus(taskId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-video-status?taskId=${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao verificar vídeo');
    }

    return result;
  },

  async updateVideoTaskId(videoId, taskId) {
    const { error } = await supabase
      .from('videos')
      .update({
        kie_task_id: taskId,
        status: 'queued',
      })
      .eq('id', videoId);

    if (error) throw error;
  }
};
