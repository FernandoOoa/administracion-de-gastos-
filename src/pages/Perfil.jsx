import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdLogout, MdAdminPanelSettings, MdPerson } from 'react-icons/md';

const Perfil = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'text-purple-400 bg-purple-500/20';
      case 'TESORERA': return 'text-amber-400 bg-amber-500/20';
      case 'GESTOR': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <div className="page-container pb-24 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8 w-full text-left">Mi Perfil</h1>

      <div className="bg-slate-800/80 border border-slate-700 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center shadow-xl mb-6">
        <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4 overflow-hidden shadow-lg border-2 border-slate-600">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            <MdPerson size={48} className="text-slate-400" />
          )}
        </div>
        
        <h2 className="text-xl font-semibold text-white text-center">
          {currentUser?.displayName || 'Usuario'}
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          {currentUser?.email}
        </p>

        <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider mb-8 ${getRoleColor(userRole)}`}>
          ROL: {userRole}
        </div>

        {userRole === 'ADMIN' && (
          <button 
            onClick={() => navigate('/usuarios')}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            <MdAdminPanelSettings size={20} />
            <span>Administrar Permisos</span>
          </button>
        )}

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 font-medium py-3 px-4 rounded-xl transition-all active:scale-95"
        >
          <MdLogout size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Perfil;
