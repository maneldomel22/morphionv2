import { useState, useEffect } from 'react';
import { Video, RefreshCw, Edit2, Check, X, ExternalLink, AlertCircle } from 'lucide-react';
import { adminService } from '../services/adminService';

export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskIdInput, setTaskIdInput] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadVideos();
  }, [filter]);

  async function loadVideos() {
    try {
      setLoading(true);
      const data = await adminService.getPendingVideos(filter);
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkAllVideos() {
    try {
      setChecking(true);
      const result = await adminService.checkAllVideosStatus();
      alert(`Verificação concluída!\n\nAtualizados: ${result.updated}\nTotal verificado: ${result.checked}`);
      await loadVideos();
    } catch (error) {
      console.error('Error checking videos:', error);
      alert('Erro ao verificar vídeos: ' + error.message);
    } finally {
      setChecking(false);
    }
  }

  async function updateTaskId(videoId) {
    if (!taskIdInput.trim()) {
      alert('Por favor, insira um task_id');
      return;
    }

    try {
      await adminService.updateVideoTaskId(videoId, taskIdInput.trim());
      alert('Task ID atualizado com sucesso!');
      setEditingTaskId(null);
      setTaskIdInput('');
      await loadVideos();
    } catch (error) {
      console.error('Error updating task ID:', error);
      alert('Erro ao atualizar task_id: ' + error.message);
    }
  }

  async function checkSingleVideo(videoId, taskId) {
    if (!taskId) {
      alert('Este vídeo não tem task_id para verificar');
      return;
    }

    try {
      const result = await adminService.checkVideoStatus(taskId);
      alert(`Status no KIE: ${result.kieState}\n\nVídeo atualizado com sucesso!`);
      await loadVideos();
    } catch (error) {
      console.error('Error checking video:', error);
      alert('Erro ao verificar vídeo: ' + error.message);
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-500/20 text-yellow-400',
      'queued': 'bg-blue-500/20 text-blue-400',
      'processing': 'bg-purple-500/20 text-purple-400',
      'ready': 'bg-green-500/20 text-green-400',
      'failed': 'bg-red-500/20 text-red-400',
      'error': 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Gerenciamento de Vídeos</h1>
        </div>
        <button
          onClick={checkAllVideos}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Verificando...' : 'Verificar Todos no KIE'}
        </button>
      </div>

      <div className="flex gap-2">
        {['pending', 'queued', 'processing', 'failed', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === status
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {videos.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum vídeo encontrado</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Modelo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Task ID (KIE)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Criado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {videos.map((video) => (
                <tr key={video.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                    {video.id.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white max-w-xs truncate">
                    {video.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(video.status)}`}>
                      {video.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {video.video_model || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {editingTaskId === video.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={taskIdInput}
                          onChange={(e) => setTaskIdInput(e.target.value)}
                          placeholder="Task ID do KIE"
                          className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm text-white w-48"
                        />
                        <button
                          onClick={() => updateTaskId(video.id)}
                          className="p-1 text-green-400 hover:bg-green-400/10 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTaskId(null);
                            setTaskIdInput('');
                          }}
                          className="p-1 text-red-400 hover:bg-red-400/10 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-mono">
                          {video.kie_task_id ? video.kie_task_id.substring(0, 16) + '...' : '-'}
                        </span>
                        {!video.kie_task_id && (
                          <button
                            onClick={() => {
                              setEditingTaskId(video.id);
                              setTaskIdInput('');
                            }}
                            className="p-1 text-blue-400 hover:bg-blue-400/10 rounded"
                            title="Adicionar Task ID"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(video.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {video.kie_task_id && (
                        <>
                          <button
                            onClick={() => checkSingleVideo(video.id, video.kie_task_id)}
                            className="p-2 text-purple-400 hover:bg-purple-400/10 rounded"
                            title="Verificar status no KIE"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <a
                            href={`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${video.kie_task_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-400 hover:bg-blue-400/10 rounded"
                            title="Ver no KIE"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </>
                      )}
                      {!video.kie_task_id && (
                        <div className="flex items-center gap-1 text-yellow-400 text-xs">
                          <AlertCircle className="w-4 h-4" />
                          <span>Sem task_id</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
