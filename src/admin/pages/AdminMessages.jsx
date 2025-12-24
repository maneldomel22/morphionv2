import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { adminService } from '../services/adminService';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);
    try {
      const data = await adminService.getSystemMessages();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(id, currentStatus) {
    try {
      await adminService.updateSystemMessage(id, { is_active: !currentStatus });
      await loadMessages();
    } catch (error) {
      console.error('Error toggling message:', error);
      alert('Erro ao alterar status da mensagem');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja deletar esta mensagem?')) {
      return;
    }

    try {
      await adminService.deleteSystemMessage(id);
      await loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Erro ao deletar mensagem');
    }
  }

  function openCreateModal() {
    setEditingMessage(null);
    setShowCreateModal(true);
  }

  function openEditModal(message) {
    setEditingMessage(message);
    setShowCreateModal(true);
  }

  const typeColors = {
    info: 'bg-blue-600/20 text-blue-400 border-blue-600/50',
    warning: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50',
    error: 'bg-red-600/20 text-red-400 border-red-600/50',
    success: 'bg-green-600/20 text-green-400 border-green-600/50'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mensagens do Sistema</h1>
          <p className="text-gray-400">Gerenciar mensagens exibidas no app</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Mensagem
        </button>
      </div>

      {loading ? (
        <div className="bg-[#121621] rounded-2xl p-8 border border-gray-800 text-center text-gray-400">
          Carregando...
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-[#121621] rounded-2xl p-8 border border-gray-800 text-center text-gray-400">
          Nenhuma mensagem cadastrada
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`bg-[#121621] rounded-2xl p-6 border ${typeColors[message.type]} transition-all`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[message.type]}`}>
                      {message.type}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      message.is_active
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {message.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p className="text-white text-lg">{message.message}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Criada em {new Date(message.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(message.id, message.is_active)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1f2e] rounded-lg transition-colors"
                    title={message.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {message.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => openEditModal(message)}
                    className="p-2 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(message.id)}
                    className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <MessageModal
          message={editingMessage}
          onClose={() => {
            setShowCreateModal(false);
            setEditingMessage(null);
          }}
          onSave={loadMessages}
        />
      )}
    </div>
  );
}

function MessageModal({ message, onClose, onSave }) {
  const [formData, setFormData] = useState({
    message: message?.message || '',
    type: message?.type || 'info',
    is_active: message?.is_active !== undefined ? message.is_active : true
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      if (message) {
        await adminService.updateSystemMessage(message.id, formData);
      } else {
        await adminService.createSystemMessage(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving message:', error);
      alert('Erro ao salvar mensagem');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#121621] rounded-2xl border border-gray-800 w-full max-w-2xl">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">
            {message ? 'Editar Mensagem' : 'Nova Mensagem'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mensagem
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Digite a mensagem..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="info">Info (azul)</option>
              <option value="warning">Warning (amarelo)</option>
              <option value="error">Error (vermelho)</option>
              <option value="success">Success (verde)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-[#1a1f2e] border-gray-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">
              Ativar mensagem imediatamente
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-[#1a1f2e] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
