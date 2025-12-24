import { useState, useEffect, useRef } from 'react';
import { X, Crown, Play, Lock, AlertTriangle, LogOut } from 'lucide-react';
import { adminService } from '../services/adminService';

function VideoPreviewCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'ready': 'bg-green-500/20 text-green-400',
      'success': 'bg-green-500/20 text-green-400',
      'failed': 'bg-red-500/20 text-red-400',
      'processing': 'bg-blue-500/20 text-blue-400',
      'queued': 'bg-yellow-500/20 text-yellow-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const hasVideo = (video.status === 'ready' || video.status === 'success') && video.video_url;

  return (
    <div className="bg-[#1a1f2e] rounded-xl overflow-hidden">
      <div className="aspect-[9/16] bg-black flex items-center justify-center overflow-hidden relative">
        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              src={video.video_url}
              className="w-full h-full object-contain"
              controls={isPlaying}
              preload="metadata"
              playsInline
              onPause={handlePause}
            />
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/40 transition-colors z-10"
                onClick={handlePlayClick}
              >
                <div className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110">
                  <Play size={40} className="text-black ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="text-5xl">
              {video.status === 'processing' ? '⏳' : video.status === 'queued' ? '⏰' : video.status === 'failed' ? '⚠️' : '📹'}
            </span>
            <div className="text-sm text-gray-400">
              {video.status === 'queued' ? 'Na fila...' : video.status === 'processing' ? 'Gerando vídeo...' : 'Sem vídeo'}
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3 z-20">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(video.status)}`}>
            {video.status}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h4 className="text-white font-medium text-sm truncate mb-1">{video.title || video.task_id}</h4>
        {video.dialogue && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{video.dialogue}</p>
        )}
        <p className="text-xs text-gray-500">
          {new Date(video.created_at).toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
}

export default function UserDetailsModal({ user, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [images, setImages] = useState([]);
  const [chats, setChats] = useState([]);
  const [lipSyncTasks, setLipSyncTasks] = useState([]);
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCredits, setEditingCredits] = useState(false);
  const [newCredits, setNewCredits] = useState(user.credits || 0);
  const [selectedPlan, setSelectedPlan] = useState(user.plan || 'free');
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [forceLogoutOnReset, setForceLogoutOnReset] = useState(false);
  const [forcingLogout, setForcingLogout] = useState(false);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  async function loadTabData(tab) {
    setLoading(true);
    try {
      switch (tab) {
        case 'videos':
          const videosData = await adminService.getUserVideos(user.id);
          setVideos(videosData);
          break;
        case 'images':
          const imagesData = await adminService.getUserImages(user.id);
          setImages(imagesData);
          break;
        case 'chats':
          const chatsData = await adminService.getUserChats(user.id);
          setChats(chatsData);
          break;
        case 'lipsync':
          const lipSyncData = await adminService.getUserLipSyncTasks(user.id);
          setLipSyncTasks(lipSyncData);
          break;
        case 'transcriptions':
          const transcriptionsData = await adminService.getUserTranscriptions(user.id);
          setTranscriptions(transcriptionsData);
          break;
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCredits() {
    const credits = parseInt(newCredits);
    if (isNaN(credits) || credits < 0) {
      alert('Por favor, insira um valor válido');
      return;
    }

    const difference = credits - (user.credits || 0);

    try {
      await adminService.addUserCredits(user.id, difference, 'Ajuste manual de créditos');
      alert('Créditos atualizados com sucesso');
      setEditingCredits(false);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating credits:', error);
      alert('Erro ao atualizar créditos');
    }
  }

  function handleCancelEditCredits() {
    setNewCredits(user.credits || 0);
    setEditingCredits(false);
  }

  async function handleChangePlan() {
    if (!confirm(`Alterar plano do usuário para ${selectedPlan}?`)) {
      return;
    }

    try {
      await adminService.updateUserPlan(user.id, selectedPlan);
      alert('Plano atualizado com sucesso');
      onUpdate();
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Erro ao atualizar plano');
    }
  }

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    const logoutMessage = forceLogoutOnReset ? '\n\nO usuário será deslogado de todas as sessões.' : '';
    if (!confirm(`Redefinir senha do usuário ${user.email}?\n\nNova senha: ${newPassword}${logoutMessage}`)) {
      return;
    }

    setResettingPassword(true);
    try {
      await adminService.resetUserPassword(user.id, newPassword);

      if (forceLogoutOnReset) {
        await adminService.forceLogout(user.id);
        alert('Senha redefinida com sucesso! O usuário foi deslogado de todas as sessões e agora pode fazer login com a nova senha.');
      } else {
        alert('Senha redefinida com sucesso! O usuário agora pode fazer login com a nova senha.');
      }

      setNewPassword('');
      setForceLogoutOnReset(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Erro ao redefinir senha: ' + error.message);
    } finally {
      setResettingPassword(false);
    }
  }

  async function handleForceLogout() {
    if (!confirm(`Deslogar ${user.email} de todas as sessões?\n\nO usuário precisará fazer login novamente.`)) {
      return;
    }

    setForcingLogout(true);
    try {
      await adminService.forceLogout(user.id);
      alert('Usuário deslogado com sucesso de todas as sessões!');
    } catch (error) {
      console.error('Error forcing logout:', error);
      alert('Erro ao forçar logout: ' + error.message);
    } finally {
      setForcingLogout(false);
    }
  }

  const tabs = [
    { id: 'videos', label: 'Vídeos' },
    { id: 'images', label: 'Imagens' },
    { id: 'chats', label: 'Chats' },
    { id: 'lipsync', label: 'Lip Sync' },
    { id: 'transcriptions', label: 'Transcrições' }
  ];

  const plans = ['free', 'junior', 'starter', 'creator', 'pro', 'admin'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#121621] rounded-2xl border border-gray-800 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Detalhes do Usuário</h2>
            <p className="text-sm text-gray-400 mt-1">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1f2e] rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">ID</label>
              <div className="text-sm text-white font-mono bg-[#1a1f2e] px-3 py-2 rounded-lg">{user.id}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Telefone</label>
              <div className="text-sm text-white bg-[#1a1f2e] px-3 py-2 rounded-lg">{user.phone || 'Não informado'}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Plano</label>
              <div className="text-sm text-white bg-[#1a1f2e] px-3 py-2 rounded-lg">{user.plan || 'free'}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Créditos</label>
              {editingCredits ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newCredits}
                    onChange={(e) => setNewCredits(parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveCredits();
                      } else if (e.key === 'Escape') {
                        handleCancelEditCredits();
                      }
                    }}
                    className="flex-1 text-sm text-white bg-[#1a1f2e] border border-blue-500 px-3 py-2 rounded-lg focus:outline-none"
                    autoFocus
                    min="0"
                  />
                  <button
                    onClick={handleSaveCredits}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={handleCancelEditCredits}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-sm text-white bg-[#1a1f2e] px-3 py-2 rounded-lg">
                    {user.credits?.toLocaleString() || 0}
                  </div>
                  <button
                    onClick={() => setEditingCredits(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm text-gray-400">Data de Cadastro</label>
              <div className="text-sm text-white bg-[#1a1f2e] px-3 py-2 rounded-lg">
                {new Date(user.created_at).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Alterar Plano
            </h3>
            <div className="flex gap-4">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="flex-1 bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {plans.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
              <button
                onClick={handleChangePlan}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Alterar
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Segurança
            </h3>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <p className="font-medium mb-1">Aviso de Segurança</p>
                <p className="text-yellow-300/80">
                  Por segurança, senhas são criptografadas e não podem ser visualizadas.
                  Você pode redefinir a senha do usuário abaixo.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400">Forçar Logout</label>
              </div>
              <div className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-3">
                  Deslogar o usuário de todas as sessões ativas. O usuário precisará fazer login novamente.
                </p>
                <button
                  onClick={handleForceLogout}
                  disabled={forcingLogout}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {forcingLogout ? 'Deslogando...' : 'Forçar Logout do Usuário'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-400">Redefinir Senha (mínimo 6 caracteres)</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="flex-1 bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  disabled={resettingPassword}
                />
                <button
                  onClick={handleResetPassword}
                  disabled={resettingPassword || !newPassword || newPassword.length < 6}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  {resettingPassword ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-sm text-red-400">A senha deve ter no mínimo 6 caracteres</p>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceLogoutOnReset}
                  onChange={(e) => setForceLogoutOnReset(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 bg-[#1a1f2e] text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  disabled={resettingPassword}
                />
                <span className="text-sm text-gray-300">
                  Deslogar usuário de todas as sessões ao redefinir senha
                </span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex gap-2 border-b border-gray-800">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Carregando...</div>
              ) : (
                <>
                  {activeTab === 'videos' && (
                    <div>
                      {videos.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Nenhum vídeo gerado</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {videos.map(video => (
                            <VideoPreviewCard key={video.id} video={video} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'images' && (
                    <div className="space-y-2">
                      {images.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Nenhuma imagem gerada</p>
                      ) : (
                        images.map(image => (
                          <div key={image.id} className="bg-[#1a1f2e] p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-medium">{image.task_id}</p>
                                <p className="text-sm text-gray-400 mt-1">Status: {image.state}</p>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(image.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'chats' && (
                    <div className="space-y-2">
                      {chats.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Nenhum chat encontrado</p>
                      ) : (
                        chats.map(chat => (
                          <div key={chat.id} className="bg-[#1a1f2e] p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-medium">{chat.title}</p>
                                <p className="text-sm text-gray-400 mt-1">Modo: {chat.mode} | Idioma: {chat.lang}</p>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(chat.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'lipsync' && (
                    <div className="space-y-2">
                      {lipSyncTasks.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Nenhuma tarefa de lip sync</p>
                      ) : (
                        lipSyncTasks.map(task => (
                          <div key={task.id} className="bg-[#1a1f2e] p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-medium">{task.task_id || 'Processando'}</p>
                                <p className="text-sm text-gray-400 mt-1">Status: {task.status}</p>
                                {task.result_video_url && (
                                  <a href={task.result_video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline mt-1 block">
                                    Ver resultado
                                  </a>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(task.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'transcriptions' && (
                    <div className="space-y-2">
                      {transcriptions.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Nenhuma transcrição</p>
                      ) : (
                        transcriptions.map(task => (
                          <div key={task.id} className="bg-[#1a1f2e] p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-medium">{task.assembly_id}</p>
                                <p className="text-sm text-gray-400 mt-1">Status: {task.status}</p>
                                {task.transcript_text && (
                                  <p className="text-sm text-gray-300 mt-2 line-clamp-2">{task.transcript_text}</p>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(task.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
