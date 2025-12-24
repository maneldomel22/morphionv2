import { useState, useEffect } from 'react';
import { X, UserPlus, Copy, Check, Link2, Trash2, Users } from 'lucide-react';
import Modal from '../ui/Modal';
import {
  shareFolder,
  getFolderShares,
  removeShare,
  generateShareLink
} from '../../services/folderShareService';

export default function ShareFolderModal({ isOpen, onClose, folder }) {
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shares, setShares] = useState([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (isOpen && folder) {
      loadShares();
    }
  }, [isOpen, folder]);

  const loadShares = async () => {
    setIsLoadingShares(true);
    const folderShares = await getFolderShares(folder.id);
    setShares(folderShares);
    setIsLoadingShares(false);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Digite um e-mail válido');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Digite um e-mail válido');
      return;
    }

    setIsSharing(true);

    const result = await shareFolder(folder.id, email.trim());

    setIsSharing(false);

    if (result.success) {
      setSuccess(`Pasta compartilhada com ${email}`);
      setEmail('');
      await loadShares();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error);
    }
  };

  const handleRemoveShare = async (shareId) => {
    if (!confirm('Deseja remover o acesso deste usuário?')) {
      return;
    }

    const result = await removeShare(shareId);

    if (result.success) {
      await loadShares();
      setSuccess('Acesso removido com sucesso');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error);
    }
  };

  const handleCopyLink = () => {
    const link = generateShareLink(folder.id);
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (!folder) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: folder.color + '20' }}
          >
            <Users size={24} style={{ color: folder.color }} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-textPrimary">Compartilhar Pasta</h2>
            <p className="text-sm text-textSecondary">{folder.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surfaceMuted/30 rounded-lg transition-colors"
          >
            <X size={20} className="text-textSecondary" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleShare} className="mb-6">
          <label className="block text-sm text-textSecondary mb-2">
            Compartilhar com
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              className="flex-1 px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-brandPrimary transition-colors"
              disabled={isSharing}
            />
            <button
              type="submit"
              disabled={isSharing || !email.trim()}
              className="px-6 py-3 bg-brandPrimary hover:bg-brandPrimary/90 disabled:bg-surfaceMuted/30 disabled:text-textSecondary/50 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <UserPlus size={18} />
              {isSharing ? 'Compartilhando...' : 'Compartilhar'}
            </button>
          </div>
          <p className="mt-2 text-xs text-textSecondary">
            O usuário precisará estar cadastrado no Morphion para ter acesso
          </p>
        </form>

        <div className="mb-6">
          <label className="block text-sm text-textSecondary mb-2">
            Link de compartilhamento
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary text-sm truncate">
              {generateShareLink(folder.id)}
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-3 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 rounded-xl transition-colors flex items-center gap-2"
            >
              {linkCopied ? (
                <>
                  <Check size={18} className="text-green-400" />
                  <span className="text-green-400 text-sm">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={18} className="text-textSecondary" />
                  <span className="text-textSecondary text-sm">Copiar</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-textSecondary">
            Compartilhe este link com usuários cadastrados. O acesso é controlado por login.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={16} className="text-textSecondary" />
            <h3 className="text-sm font-semibold text-textPrimary">
              Pessoas com acesso ({shares.length})
            </h3>
          </div>

          {isLoadingShares ? (
            <div className="text-center py-8 text-textSecondary">
              Carregando...
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-8 text-textSecondary">
              Nenhum usuário com acesso ainda
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 bg-surfaceMuted/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brandPrimary/20 rounded-full flex items-center justify-center">
                      <Users size={16} className="text-brandPrimary" />
                    </div>
                    <div>
                      <p className="text-sm text-textPrimary font-medium">
                        {share.shared_with_email}
                      </p>
                      <p className="text-xs text-textSecondary">
                        Compartilhado em {new Date(share.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveShare(share.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                    title="Remover acesso"
                  >
                    <Trash2 size={16} className="text-textSecondary group-hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
