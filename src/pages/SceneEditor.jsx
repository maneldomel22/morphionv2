import { useEffect, useState } from 'react';
import { Save, Download, FolderOpen, Loader2, Film, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import VideoPreview from '../components/editor/VideoPreview';
import TimelinePanel from '../components/editor/TimelinePanel';
import EditorSidebar from '../components/editor/EditorSidebar';
import PropertiesPanel from '../components/editor/PropertiesPanel';
import { useEditorStore } from '../stores/editorStore';
import { timelineService, renderJobService } from '../services/timelineService';

export default function SceneEditor() {
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const {
    timeline,
    project,
    setProject,
    loadProject,
    renderJob,
    setRenderJob
  } = useEditorStore();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await timelineService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleNewProject = async () => {
    try {
      const newProject = await timelineService.createProject({
        title: `Projeto ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        timeline_data: timeline,
        duration: timeline.duration,
        width: timeline.width,
        height: timeline.height,
        fps: timeline.fps
      });
      setProject(newProject);
      await loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Erro ao criar projeto');
    }
  };

  const handleSaveProject = async () => {
    if (!project) {
      await handleNewProject();
      return;
    }

    setSaving(true);
    try {
      const updated = await timelineService.saveTimeline(project.id, timeline);
      setProject(updated);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Erro ao salvar projeto');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadProject = async (projectId) => {
    try {
      const loadedProject = await timelineService.getProject(projectId);
      if (loadedProject) {
        loadProject(loadedProject);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Erro ao carregar projeto');
    }
  };

  const handleRenderVideo = async () => {
    if (!project) {
      alert('Salve o projeto antes de renderizar');
      return;
    }

    if (timeline.tracks.length === 0) {
      alert('Adicione pelo menos um elemento à timeline antes de renderizar');
      return;
    }

    setRendering(true);
    setRenderProgress(0);

    try {
      const job = await renderJobService.startRender(project.id);
      setRenderJob(job);

      await renderJobService.pollRenderJob(job.id, (updatedJob) => {
        setRenderProgress(updatedJob.progress);
        setRenderJob(updatedJob);
      });

      alert('Renderização concluída!');
    } catch (error) {
      console.error('Error rendering video:', error);
      alert(`Erro ao renderizar: ${error.message}`);
    } finally {
      setRendering(false);
      setRenderProgress(0);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-borderSubtle bg-surfaceDark">
        <div className="flex items-center gap-3">
          <Film size={28} className="text-brandPrimary" />
          <div>
            <h1 className="text-2xl font-bold text-textPrimary tracking-tight">Editor de Vídeo</h1>
            <p className="text-xs text-textSecondary">
              {project ? project.title : 'Novo Projeto'} • {timeline.tracks.length} elementos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-surfaceMuted rounded-lg border border-borderSubtle">
            <span className="text-xs text-textSecondary font-medium">Proporção:</span>
            <select
              value={`${timeline.width}x${timeline.height}`}
              onChange={(e) => {
                const [width, height] = e.target.value.split('x').map(Number);
                useEditorStore.setState(state => ({
                  timeline: { ...state.timeline, width, height }
                }));
              }}
              className="px-2 py-1 bg-surfaceDark border border-borderSubtle rounded text-xs text-textPrimary cursor-pointer hover:bg-surfaceDark/70 transition-colors focus:outline-none focus:border-brandPrimary"
            >
              <option value="1080x1920">9:16 (Stories)</option>
              <option value="1920x1080">16:9 (YouTube)</option>
              <option value="1080x1080">1:1 (Feed)</option>
            </select>
          </div>

          <Button
            onClick={handleNewProject}
            variant="secondary"
            className="text-sm"
          >
            <Plus size={16} />
            Novo
          </Button>

          <div className="relative">
            <select
              onChange={(e) => e.target.value && handleLoadProject(e.target.value)}
              className="px-4 py-2 bg-surfaceMuted border border-borderSubtle rounded-lg text-sm text-textPrimary hover:bg-surfaceMuted/70 transition-colors appearance-none pr-10 cursor-pointer"
              value={project?.id || ''}
            >
              <option value="" disabled>Carregar Projeto</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <FolderOpen size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none" />
          </div>

          <Button
            onClick={handleSaveProject}
            variant="secondary"
            disabled={saving}
            className="text-sm"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>

          <Button
            onClick={handleRenderVideo}
            disabled={rendering || !project || timeline.tracks.length === 0}
            className="text-sm"
          >
            {rendering ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {rendering ? `${renderProgress}%` : 'Renderizar'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 bg-surfaceDark w-full">
        <div className="w-[300px] border-r border-borderSubtle flex-shrink-0 overflow-y-auto">
          <EditorSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 w-full">
          <div className="flex-1 min-h-0 border-b border-borderSubtle w-full">
            <VideoPreview />
          </div>

          <div className="h-80 flex-shrink-0 w-full">
            <TimelinePanel />
          </div>
        </div>

        <div className="w-[320px] border-l border-borderSubtle flex-shrink-0 overflow-y-auto">
          <PropertiesPanel />
        </div>
      </div>

      {rendering && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-surfaceDark border border-borderSubtle rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <Loader2 size={48} className="animate-spin text-brandPrimary" />
            </div>
            <h3 className="text-lg font-bold text-textPrimary text-center mb-2">
              Renderizando Vídeo
            </h3>
            <p className="text-sm text-textSecondary text-center mb-4">
              Processando {timeline.tracks.flatMap(t => t.clips).filter(c => c.type === 'video').length} vídeos e {timeline.tracks.flatMap(t => t.clips).filter(c => c.type === 'text').length} textos...
            </p>
            <div className="w-full bg-surfaceMuted rounded-full h-2.5 mb-2 overflow-hidden">
              <div
                className="bg-brandPrimary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
            <p className="text-xs text-textSecondary text-center font-mono">{renderProgress}%</p>
            <p className="text-xs text-yellow-400/70 text-center mt-4 italic">
              Nota: Renderização real em desenvolvimento. Por enquanto, o vídeo original será retornado.
            </p>
          </div>
        </div>
      )}

      {renderJob?.output_url && (
        <div className="absolute bottom-4 right-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl shadow-2xl backdrop-blur-sm max-w-md">
          <p className="text-green-400 text-sm mb-2 font-semibold">Vídeo renderizado com sucesso!</p>
          <div className="flex gap-2">
            <a
              href={renderJob.output_url}
              download={`video-${project?.title || 'render'}.mp4`}
              className="px-4 py-2 bg-brandPrimary hover:bg-brandPrimary/90 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <Download size={16} />
              Baixar Vídeo
            </a>
            <a
              href={renderJob.output_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-surfaceMuted hover:bg-surfaceMuted/70 text-textPrimary rounded-lg text-sm font-medium transition-colors"
            >
              Visualizar
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
