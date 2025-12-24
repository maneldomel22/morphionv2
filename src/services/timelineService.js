import { supabase } from '../lib/supabase';

const translateError = (error) => {
  const errorMap = {
    'size invalid': 'Erro ao ajustar resolução do vídeo',
    'aspect invalid': 'Formato de vídeo não suportado',
    'timeout': 'Servidor ocupado. Tente novamente em alguns minutos',
    'Project not found': 'Projeto não encontrado',
    'User not authenticated': 'Usuário não autenticado',
    'Failed to start render': 'Falha ao iniciar renderização',
    'Render timeout': 'Tempo limite de renderização excedido',
    'Render failed': 'Falha na renderização do vídeo'
  };

  const message = error?.message || error;
  return errorMap[message] || message;
};

export const timelineService = {
  async getProjects() {
    const { data, error } = await supabase
      .from('timeline_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProject(id) {
    const { data, error } = await supabase
      .from('timeline_projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createProject(project) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('timeline_projects')
      .insert({
        user_id: user.id,
        title: project.title || 'Untitled Project',
        timeline_data: project.timeline_data,
        duration: project.duration || 0,
        width: project.width || 1920,
        height: project.height || 1080,
        fps: project.fps || 30,
        thumbnail_url: project.thumbnail_url
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id, updates) {
    const { data, error } = await supabase
      .from('timeline_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id) {
    const { error } = await supabase
      .from('timeline_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async saveTimeline(projectId, timeline) {
    const duration = Math.max(...timeline.tracks.map(t => t.end), timeline.duration);

    const { data, error } = await supabase
      .from('timeline_projects')
      .update({
        timeline_data: timeline,
        duration,
        width: timeline.width,
        height: timeline.height,
        fps: timeline.fps
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const renderJobService = {
  async createRenderJob(projectId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('render_jobs')
      .insert({
        project_id: projectId,
        user_id: user.id,
        status: 'queued',
        progress: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRenderJob(id) {
    const { data, error } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getRenderJobsByProject(projectId) {
    const { data, error } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateRenderJob(id, updates) {
    const { data, error } = await supabase
      .from('render_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async startRender(projectId) {
    const job = await this.createRenderJob(projectId);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/render-video`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobId: job.id,
          projectId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start render');
      }

      return job;
    } catch (error) {
      const translatedError = translateError(error);
      await this.updateRenderJob(job.id, {
        status: 'failed',
        error_message: translatedError
      });
      throw new Error(translatedError);
    }
  },

  async pollRenderJob(jobId, onProgress) {
    const maxAttempts = 300;
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;

        if (attempts > maxAttempts) {
          clearInterval(interval);
          reject(new Error(translateError('Render timeout')));
          return;
        }

        try {
          const job = await this.getRenderJob(jobId);

          if (onProgress) {
            onProgress(job);
          }

          if (job.status === 'completed') {
            clearInterval(interval);
            resolve(job);
          } else if (job.status === 'failed') {
            clearInterval(interval);
            reject(new Error(translateError(job.error_message || 'Render failed')));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 2000);
    });
  }
};
