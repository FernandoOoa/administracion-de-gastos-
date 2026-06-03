import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUsuarios } from '../hooks/useUsuarios';
import { Navigate, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdPerson, MdLock, MdLockOpen } from 'react-icons/md';
import ConfirmModal from '../components/ConfirmModal';

const UsuariosAdmin = () => {
  const { userRole, currentUser } = useAuth();
  const { usuarios, loading, cambiarRol, cambiarBloqueo } = useUsuarios();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  const showDialog = (config) => {
    setDialogConfig({
      isOpen: true,
      ...config
    });
  };

  const closeDialog = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  if (userRole !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  const handleRoleChange = async (uid, newRole) => {
    setUpdatingId(uid);
    await cambiarRol(uid, newRole);
    setUpdatingId(null);
  };

  const handleBlockChange = (uid, currentBlockedStatus) => {
    if (uid === currentUser.uid) {
      showDialog({
        title: 'Acción No Permitida',
        message: 'No puedes bloquearte a ti mismo.',
        type: 'danger'
      });
      return;
    }
    const newBlockedStatus = !currentBlockedStatus;
    const confirmMsg = newBlockedStatus
      ? "¿Estás seguro de que deseas bloquear a este usuario? Perderá acceso inmediato al sistema."
      : "¿Estás seguro de que deseas desbloquear a este usuario?";
      
    showDialog({
      title: newBlockedStatus ? 'Bloquear Usuario' : 'Desbloquear Usuario',
      message: confirmMsg,
      type: newBlockedStatus ? 'danger' : 'warning',
      onConfirm: async () => {
        setUpdatingId(uid);
        await cambiarBloqueo(uid, newBlockedStatus);
        setUpdatingId(null);
      }
    });
  };

  return (
    <div className="page-container pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/perfil')}
          className="p-2 bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-xl font-bold">Administrar Usuarios</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {usuarios.map(user => (
            <div key={user.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <MdPerson size={20} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-200">{user.nombre || 'Sin nombre'}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-end">
                <div className="relative">
                  <select
                    value={user.rol || 'BASE'}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updatingId === user.id}
                    className={`bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm font-medium appearance-none w-full sm:w-auto outline-none transition-colors pr-8
                      ${user.rol === 'ADMIN' ? 'text-purple-400 border-purple-500/50' : ''}
                      ${user.rol === 'TESORERA' ? 'text-amber-400 border-amber-500/50' : ''}
                      ${user.rol === 'GESTOR' ? 'text-blue-400 border-blue-500/50' : ''}
                      ${user.rol === 'BASE' || !user.rol ? 'text-slate-400' : ''}
                    `}
                  >
                    <option value="BASE">BASE</option>
                    <option value="GESTOR">GESTOR</option>
                    <option value="TESORERA">TESORERA</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  {updatingId === user.id && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin pointer-events-none"></div>
                  )}
                </div>

                {user.id !== currentUser.uid && (
                  <button
                    onClick={() => handleBlockChange(user.id, !!user.bloqueado)}
                    disabled={updatingId === user.id}
                    className={`p-2 rounded-lg border transition-all flex items-center justify-center
                      ${user.bloqueado 
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                        : 'bg-slate-900 border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    title={user.bloqueado ? "Desbloquear usuario" : "Bloquear usuario"}
                  >
                    {user.bloqueado ? <MdLock size={18} /> : <MdLockOpen size={18} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal {...dialogConfig} onClose={closeDialog} />
    </div>
  );
};

export default UsuariosAdmin;
