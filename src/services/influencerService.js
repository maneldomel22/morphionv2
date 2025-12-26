import { supabase } from '../lib/supabase';

export const influencerService = {
  async createInfluencer(data) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data: influencer, error } = await supabase
      .from('influencers')
      .insert({
        user_id: session.user.id,
        name: data.name,
        username: data.username,
        image_url: data.image_url || '',
        age: data.age,
        style: data.style,
        mode: data.mode || 'safe',
        identity_profile: data.identity_profile
      })
      .select()
      .single();

    if (error) throw error;
    return influencer;
  },

  async getInfluencers() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('influencers')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getInfluencerById(id) {
    const { data, error } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateInfluencer(id, updates) {
    const { data, error } = await supabase
      .from('influencers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteInfluencer(id) {
    const { error } = await supabase
      .from('influencers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getInfluencersWithPostCount() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data: influencers, error: influencersError } = await supabase
      .from('influencers')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (influencersError) throw influencersError;

    const influencersWithCounts = await Promise.all(
      (influencers || []).map(async (influencer) => {
        const { count, error: countError } = await supabase
          .from('influencer_posts')
          .select('*', { count: 'exact', head: true })
          .eq('influencer_id', influencer.id);

        if (countError) {
          console.error('Error counting posts:', countError);
          return { ...influencer, post_count: 0 };
        }

        return { ...influencer, post_count: count || 0 };
      })
    );

    return influencersWithCounts;
  },

  async getInfluencerPosts(influencerId) {
    const { data, error } = await supabase
      .from('influencer_posts')
      .select('*')
      .eq('influencer_id', influencerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deletePost(postId) {
    const { error } = await supabase
      .from('influencer_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }
};
