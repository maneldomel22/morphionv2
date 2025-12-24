import { supabase } from '../lib/supabase';

/**
 * Folder Sharing Service
 * Handles all folder sharing operations
 */

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .rpc('get_user_by_email', { user_email: email.trim() });

  if (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }

  // RPC returns an array, get first result
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Share a folder with a user
 * @param {string} folderId - Folder ID to share
 * @param {string} sharedWithEmail - Email of user to share with
 * @returns {Promise<Object>} Result object with success status and data/error
 */
export async function shareFolder(folderId, sharedWithEmail) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Get the folder to verify ownership
    const { data: folder, error: folderError } = await supabase
      .from('video_folders')
      .select('id, user_id, name')
      .eq('id', folderId)
      .maybeSingle();

    if (folderError || !folder) {
      return { success: false, error: 'Pasta não encontrada' };
    }

    if (folder.user_id !== user.id) {
      return { success: false, error: 'Você não tem permissão para compartilhar esta pasta' };
    }

    // Get user to share with
    const sharedWithUser = await getUserByEmail(sharedWithEmail);
    if (!sharedWithUser) {
      return { success: false, error: 'Usuário não encontrado com este e-mail' };
    }

    // Can't share with yourself
    if (sharedWithUser.id === user.id) {
      return { success: false, error: 'Você não pode compartilhar uma pasta com você mesmo' };
    }

    // Create the share
    const { data: share, error: shareError } = await supabase
      .from('folder_shares')
      .insert({
        folder_id: folderId,
        owner_id: user.id,
        shared_with: sharedWithUser.id
      })
      .select()
      .single();

    if (shareError) {
      if (shareError.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Esta pasta já está compartilhada com este usuário' };
      }
      console.error('Error creating share:', shareError);
      return { success: false, error: 'Erro ao compartilhar pasta' };
    }

    return {
      success: true,
      data: {
        ...share,
        shared_with_email: sharedWithUser.email,
        folder_name: folder.name
      }
    };
  } catch (error) {
    console.error('Error in shareFolder:', error);
    return { success: false, error: 'Erro ao compartilhar pasta' };
  }
}

/**
 * Get all shares for a folder (owner view)
 * @param {string} folderId - Folder ID
 * @returns {Promise<Array>} List of shares with user emails
 */
export async function getFolderShares(folderId) {
  try {
    const { data: shares, error } = await supabase
      .from('folder_shares')
      .select('id, folder_id, shared_with, created_at')
      .eq('folder_id', folderId);

    if (error) {
      console.error('Error fetching folder shares:', error);
      return [];
    }

    // Get user details for each share
    const sharesWithDetails = await Promise.all(
      shares.map(async (share) => {
        const { data: email } = await supabase
          .rpc('get_user_email_by_id', { user_id: share.shared_with });

        return {
          ...share,
          shared_with_email: email || 'Unknown'
        };
      })
    );

    return sharesWithDetails;
  } catch (error) {
    console.error('Error in getFolderShares:', error);
    return [];
  }
}

/**
 * Remove a share
 * @param {string} shareId - Share ID to remove
 * @returns {Promise<Object>} Result object with success status
 */
export async function removeShare(shareId) {
  try {
    const { error } = await supabase
      .from('folder_shares')
      .delete()
      .eq('id', shareId);

    if (error) {
      console.error('Error removing share:', error);
      return { success: false, error: 'Erro ao remover compartilhamento' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in removeShare:', error);
    return { success: false, error: 'Erro ao remover compartilhamento' };
  }
}

/**
 * Check if user has access to a folder
 * @param {string} folderId - Folder ID
 * @param {string} userId - User ID (optional, uses current user if not provided)
 * @returns {Promise<Object>} Result with hasAccess boolean and role
 */
export async function checkFolderAccess(folderId, userId = null) {
  try {
    let currentUserId = userId;

    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { hasAccess: false, role: null };
      }
      currentUserId = user.id;
    }

    // Check if user is owner
    const { data: folder, error: folderError } = await supabase
      .from('video_folders')
      .select('id, user_id, name, color')
      .eq('id', folderId)
      .maybeSingle();

    if (folderError || !folder) {
      return { hasAccess: false, role: null, folder: null };
    }

    if (folder.user_id === currentUserId) {
      return { hasAccess: true, role: 'owner', folder };
    }

    // Check if user has shared access
    const { data: share, error: shareError } = await supabase
      .from('folder_shares')
      .select('id')
      .eq('folder_id', folderId)
      .eq('shared_with', currentUserId)
      .maybeSingle();

    if (shareError) {
      console.error('Error checking share access:', shareError);
      return { hasAccess: false, role: null, folder: null };
    }

    if (share) {
      return { hasAccess: true, role: 'viewer', folder };
    }

    return { hasAccess: false, role: null, folder: null };
  } catch (error) {
    console.error('Error in checkFolderAccess:', error);
    return { hasAccess: false, role: null, folder: null };
  }
}

/**
 * Get folders shared with current user
 * @returns {Promise<Array>} List of folders shared with user
 */
export async function getSharedWithMeFolders() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data: shares, error } = await supabase
      .from('folder_shares')
      .select(`
        id,
        folder_id,
        created_at,
        video_folders (
          id,
          name,
          color,
          user_id
        )
      `)
      .eq('shared_with', user.id);

    if (error) {
      console.error('Error fetching shared folders:', error);
      return [];
    }

    // Get owner details for each folder
    const foldersWithOwner = await Promise.all(
      shares.map(async (share) => {
        const { data: ownerEmail } = await supabase
          .rpc('get_user_email_by_id', { user_id: share.video_folders.user_id });

        return {
          ...share.video_folders,
          shared_at: share.created_at,
          owner_email: ownerEmail || 'Unknown',
          is_shared: true
        };
      })
    );

    return foldersWithOwner;
  } catch (error) {
    console.error('Error in getSharedWithMeFolders:', error);
    return [];
  }
}

/**
 * Get videos from a folder (works for both owned and shared folders)
 * @param {string} folderId - Folder ID
 * @returns {Promise<Array>} List of videos in the folder
 */
export async function getFolderVideos(folderId) {
  try {
    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching folder videos:', error);
      return [];
    }

    return videos || [];
  } catch (error) {
    console.error('Error in getFolderVideos:', error);
    return [];
  }
}

/**
 * Generate shareable link for a folder
 * @param {string} folderId - Folder ID
 * @returns {string} Shareable URL
 */
export function generateShareLink(folderId) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/folders/${folderId}`;
}
