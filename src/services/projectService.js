import { supabase } from '../lib/supabase';

export const projectService = {
  async createProject(projectData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        user_id: user.id,
        name: projectData.name || `Project - ${new Date().toLocaleDateString()}`,
        mode: projectData.mode || 'guided',
        avatar_data: projectData.selectedAvatar || {},
        creative_style: projectData.creativeStyle || {},
        dialogue: projectData.dialogue || '',
        format_settings: {
          aspectRatio: projectData.aspectRatio,
          duration: projectData.duration,
          storyboardMode: projectData.storyboardMode
        },
        product_data: projectData.productData || null,
        scene_settings: {
          location: projectData.location,
          lighting: projectData.lighting
        },
        style_settings: {
          framing: projectData.framing,
          cameraAngle: projectData.cameraAngle,
          movement: projectData.movement,
          depthOfField: projectData.depthOfField
        },
        storyboard: projectData.scenes || null,
        status: 'ready'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProjects() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProjectById(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProject(id, updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  }
};
