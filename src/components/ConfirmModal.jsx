import React from 'react';
import { MdWarning, MdInfo, MdCheckCircle, MdError, MdClose } from 'react-icons/md';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info', 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar' 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <MdError className="text-red-500" size={36} />;
      case 'warning':
        return <MdWarning className="text-amber-500" size={36} />;
      case 'success':
        return <MdCheckCircle className="text-green-500" size={36} />;
      default:
        return <MdInfo className="text-blue-500" size={36} />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'danger':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-blue-400';
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white focus:ring-amber-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-500 text-white focus:ring-green-500';
      default:
        return 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500';
    }
  };

  const isAlertOnly = !onConfirm;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Decorative corner lights */}
        <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-20 
          ${type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'}
        `}></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <MdClose size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            {getIcon()}
          </div>
          <div className="space-y-1">
            <h3 className={`text-lg font-bold ${getHeaderColor()}`}>
              {title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed px-2">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {!isAlertOnly ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl border border-slate-700/50 transition-all active:scale-95 text-sm"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 font-medium py-3 rounded-xl transition-all active:scale-95 text-sm shadow-lg ${getConfirmButtonStyles()}`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`w-full font-medium py-3 rounded-xl transition-all active:scale-95 text-sm shadow-lg ${getConfirmButtonStyles()}`}
            >
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
