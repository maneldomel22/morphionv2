import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { adminService } from '../services/adminService';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    system_name: '',
    maintenance_mode: 'false',
    maintenance_message: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await adminService.getSystemSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        adminService.updateSystemSetting('system_name', settings.system_name),
        adminService.updateSystemSetting('maintenance_mode', settings.maintenance_mode),
        adminService.updateSystemSetting('maintenance_message', settings.maintenance_message)
      ]);
      alert('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  function handleChange(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-gray-400">Configurações gerais do sistema</p>
      </div>

      <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Sistema
          </label>
          <input
            type="text"
            value={settings.system_name}
            onChange={(e) => handleChange('system_name', e.target.value)}
            className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Morphion"
          />
          <p className="text-sm text-gray-500 mt-2">Nome exibido no sistema</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Modo Manutenção
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="maintenance"
                value="false"
                checked={settings.maintenance_mode === 'false'}
                onChange={(e) => handleChange('maintenance_mode', e.target.value)}
                className="w-4 h-4 text-blue-600 bg-[#1a1f2e] border-gray-700 focus:ring-blue-500"
              />
              <span className="text-white">Desativado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="maintenance"
                value="true"
                checked={settings.maintenance_mode === 'true'}
                onChange={(e) => handleChange('maintenance_mode', e.target.value)}
                className="w-4 h-4 text-blue-600 bg-[#1a1f2e] border-gray-700 focus:ring-blue-500"
              />
              <span className="text-white">Ativado</span>
            </label>
          </div>
          {settings.maintenance_mode === 'true' && (
            <div className="mt-4 p-4 bg-yellow-600/10 border border-yellow-600/50 rounded-lg">
              <p className="text-sm text-yellow-400">
                Atenção: Com o modo manutenção ativo, usuários não poderão acessar o sistema
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mensagem de Manutenção
          </label>
          <textarea
            value={settings.maintenance_message}
            onChange={(e) => handleChange('maintenance_message', e.target.value)}
            rows={4}
            className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Mensagem exibida durante a manutenção..."
          />
          <p className="text-sm text-gray-500 mt-2">
            Esta mensagem será exibida aos usuários quando o modo manutenção estiver ativo
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>

      <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Informações do Sistema</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 px-3 bg-[#1a1f2e] rounded-lg">
            <span className="text-gray-400">Versão</span>
            <span className="text-white font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-[#1a1f2e] rounded-lg">
            <span className="text-gray-400">Ambiente</span>
            <span className="text-white font-medium">Production</span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-[#1a1f2e] rounded-lg">
            <span className="text-gray-400">Database</span>
            <span className="text-white font-medium">Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
