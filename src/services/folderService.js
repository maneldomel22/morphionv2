import { supabase } from '../lib/supabase';

export const folderService = {
  async getFolders() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('video_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createFolder(name, color = '#9A5AE3') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('video_folders')
      .insert({
        user_id: user.id,
        name: name.trim(),
        color
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async renameFolder(folderId, newName) {
    const { data, error } = await supabase
      .from('video_folders')
      .update({
        name: newName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFolder(folderId) {
    const { error: videosError } = await supabase
      .from('videos')
      .update({ folder_id: null })
      .eq('folder_id', folderId);

    if (videosError) throw videosError;

    const { error } = await supabase
      .from('video_folders')
      .delete()
      .eq('id', folderId);

    if (error) throw error;
  },

  async moveVideoToFolder(videoId, folderId) {
    const { data, error } = await supabase
      .from('videos')
      .update({ folder_id: folderId })
      .eq('id', videoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getVideosInFolder(folderId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const query = supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (folderId === null) {
      query.is('folder_id', null);
    } else {
      query.eq('folder_id', folderId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
};
