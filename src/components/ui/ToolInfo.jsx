import { useState, useEffect, useRef } from 'react';
import { Info, X } from 'lucide-react';

export default function ToolInfo({ tool, icon: ToolIcon }) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!tool) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-surfaceMuted/50 transition-all duration-200 opacity-60 hover:opacity-100"
        aria-label="Informações sobre a ferramenta"
      >
        <Info size={16} className="text-textSecondary group-hover:text-brandPrimary transition-colors" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200"
            style={{ animation: 'fadeIn 200ms ease-out' }}
          />

          <div
            ref={drawerRef}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-surfaceDark border-l border-borderSubtle z-50 shadow-2xl"
            style={{ animation: 'slideInFromRight 200ms ease-out' }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between p-6 border-b border-borderSubtle">
                <div className="flex items-center gap-3">
                  {ToolIcon && (
                    <div className="w-10 h-10 rounded-lg bg-brandPrimary/10 flex items-center justify-center">
                      <ToolIcon size={20} className="text-brandPrimary" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-textPrimary">{tool.title}</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -m-2 text-textSecondary hover:text-textPrimary hover:bg-surfaceMuted/50 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <section>
                  <h3 className="text-sm font-semibold text-brandPrimary uppercase tracking-wider mb-2">
                    O que é
                  </h3>
                  <p className="text-textSecondary leading-relaxed">
                    {tool.whatIs}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-brandPrimary uppercase tracking-wider mb-2">
                    Para que usar
                  </h3>
                  <p className="text-textSecondary leading-relaxed">
                    {tool.whenToUse}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-brandPrimary uppercase tracking-wider mb-2">
                    Tecnologia
                  </h3>
                  <ul className="space-y-2">
                    {tool.technology.map((tech, index) => (
                      <li key={index} className="flex items-start gap-2 text-textSecondary">
                        <span className="text-brandPrimary mt-1">•</span>
                        <span className="leading-relaxed">{tech}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {tool.notes && (
                  <section>
                    <h3 className="text-sm font-semibold text-brandPrimary uppercase tracking-wider mb-2">
                      Observações
                    </h3>
                    <div className="space-y-2">
                      {tool.notes.map((note, index) => (
                        <p key={index} className="text-textSecondary text-sm leading-relaxed">
                          {note}
                        </p>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes slideInFromRight {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
          `}</style>
        </>
      )}
    </>
  );
}
