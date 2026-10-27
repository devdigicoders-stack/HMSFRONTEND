import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';

const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = '600px' }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-backdrop-custom fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/75 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-glass-container relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto flex flex-col"
        style={{ maxWidth: maxWidth || '600px', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-custom flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-teal-50/20 to-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] shrink-0" />
            <h5 className="m-0 font-bold text-base sm:text-lg text-slate-800 tracking-tight truncate">
              {title}
            </h5>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100/90 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-transparent hover:border-slate-200 shrink-0"
            aria-label="Close dialog"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-custom px-5 py-5 overflow-y-auto max-h-[calc(85vh-130px)] flex-1 text-slate-700">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer-custom px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default Modal;
