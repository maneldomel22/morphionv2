import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    'sm': 'max-w-md',
    'md': 'max-w-2xl',
    'lg': 'max-w-4xl',
    'xl': 'max-w-6xl',
    'full': 'max-w-[95vw]'
  };

  const widthClass = maxWidth || sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-surface border rounded-xl sm:rounded-2xl p-4 sm:p-6 ${widthClass} w-full shadow-2xl my-4 sm:my-8 relative max-h-[95vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center mb-4 sm:mb-6 sticky top-0 bg-surface z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4 border-b">
            <h3 className="text-lg sm:text-xl font-semibold text-textPrimary pr-2">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors text-textTertiary hover:text-textPrimary hover:bg-brandPrimary/10 flex-shrink-0"
              aria-label="Close modal"
            >
              <X size={18} sm:size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-6 right-3 sm:right-6 p-2 rounded-lg transition-colors text-textTertiary hover:text-textPrimary hover:bg-brandPrimary/10 z-10"
            aria-label="Close modal"
          >
            <X size={18} sm:size={20} />
          </button>
        )}
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
