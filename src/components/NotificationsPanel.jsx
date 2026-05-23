import React from 'react';
import { MdCheck, MdInfo, MdWarning, MdNotificationsActive } from 'react-icons/md';
import { useNotificaciones } from '../hooks/useNotificaciones';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { notificaciones, marcarComoLeida, unreadCount } = useNotificaciones();

  if (!isOpen) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getIcon = (tipo) => {
    if (tipo === 'ALERTA') return <MdWarning className="text-red-400" size={20} />;
    if (tipo === 'ACCION') return <MdNotificationsActive className="text-purple-400" size={20} />;
    return <MdInfo className="text-blue-400" size={20} />;
  };

  return (
    <>
      <div className="fixed inset-0 z-[1040]" onClick={onClose}></div>
      <div className="absolute top-16 right-4 w-80 max-w-[calc(100vw-2rem)] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-[1050] overflow-hidden animate-fadeIn">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/90 backdrop-blur-md">
          <h3 className="font-semibold text-white">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow-lg shadow-blue-500/20">
              {unreadCount} nuevas
            </span>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notificaciones.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No tienes notificaciones por ahora.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {notificaciones.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => !n.leida && marcarComoLeida(n.id)}
                  className={`p-4 transition-colors cursor-pointer flex gap-3 ${n.leida ? 'opacity-60 bg-slate-800' : 'bg-slate-700/30 hover:bg-slate-700/50'}`}
                >
                  <div className="mt-0.5">
                    {getIcon(n.tipo)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${n.leida ? 'text-slate-300' : 'text-white font-medium'}`}>
                      {n.mensaje}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(n.fecha)}
                    </p>
                  </div>
                  {!n.leida && (
                    <div className="flex-shrink-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPanel;
