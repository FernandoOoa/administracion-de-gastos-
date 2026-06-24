import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdLogout, MdAdminPanelSettings, MdPerson, MdNotifications, MdFileDownload } from 'react-icons/md';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const Perfil = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const exportarAExcel = async () => {
    setExporting(true);
    try {
      // 1. Obtener los datos de Firestore
      const transSnap = await getDocs(query(collection(db, 'transacciones'), orderBy('fecha', 'desc')));
      const apartadosSnap = await getDocs(collection(db, 'apartados'));
      
      let usersMap = {};
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.docs.forEach(doc => {
          usersMap[doc.id] = doc.data().nombre || doc.data().email || 'Sin nombre';
        });
      } catch (e) {
        console.warn("No se pudieron leer los usuarios (sin permisos).", e);
      }

      const apartadosMap = {};
      apartadosSnap.docs.forEach(doc => {
        apartadosMap[doc.id] = doc.data().nombre || 'Desconocido';
      });

      // 2. Construir las filas del archivo CSV
      const headers = [
        'ID Transaccion',
        'Fecha Movimiento',
        'Fecha Registro',
        'Tipo',
        'Monto',
        'Concepto',
        'Apartado / Origen',
        'Apartado Destino',
        'Registrado Por',
        'Estado Custodia',
        'Recepcion Tesoreria'
      ];

      const rows = [headers];

      transSnap.docs.forEach(docSnap => {
        const t = docSnap.data();
        
        const parseDate = (d) => {
          if (!d) return '';
          const date = d.seconds ? new Date(d.seconds * 1000) : new Date(d);
          return date.toLocaleString('es-MX');
        };

        const parseDateOnly = (d) => {
          if (!d) return '';
          const date = d.seconds ? new Date(d.seconds * 1000) : new Date(d);
          return date.toLocaleDateString('es-MX');
        };

        const custodioLabel = (estado) => {
          switch (estado) {
            case 'POR_ENTREGAR': return 'En custodia';
            case 'ESPERANDO_CONFIRMACION': return 'Enviado (Espera)';
            case 'EN_TESORERIA': return 'En Tesoreria';
            default: return estado || '';
          }
        };

        rows.push([
          docSnap.id,
          parseDateOnly(t.fecha),
          parseDate(t.fecha_registro),
          t.tipo || '',
          t.monto || 0,
          (t.concepto || '').replace(/"/g, "'"),
          apartadosMap[t.apartado_id] || 'N/A',
          t.tipo === 'Transferencia' ? (apartadosMap[t.apartado_destino_id] || 'N/A') : '',
          usersMap[t.id_usuario_registro] || t.id_usuario_registro || 'Desconocido',
          custodioLabel(t.estado_custodia),
          parseDate(t.fecha_recepcion_tesoreria)
        ]);
      });

      // 3. Convertir a formato CSV agregando BOM UTF-8 para compatibilidad con caracteres en español
      const csvContent = "\uFEFF" + rows.map(e => e.map(val => {
        let strVal = String(val);
        if (strVal.includes(',') || strVal.includes('\n') || strVal.includes('"')) {
          strVal = `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(',')).join('\n');

      // 4. Disparar descarga del archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `movimientos_caja_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al exportar datos:", error);
      alert("Hubo un error al exportar los datos: " + (error.message || "Error desconocido"));
    } finally {
      setExporting(false);
    }
  };

  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const solicitarPermisoNotificaciones = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotifPermission(permission);
      } catch (err) {
        console.error("Error solicitando permisos de notificacion:", err);
      }
    }
  };

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

        {userRole === 'ADMIN' && (
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider mb-8 ${getRoleColor(userRole)}`}>
            ROL: {userRole}
          </div>
        )}

        {userRole === 'ADMIN' && (
          <button 
            onClick={() => navigate('/usuarios')}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            <MdAdminPanelSettings size={20} />
            <span>Administrar Permisos</span>
          </button>
        )}

        {/* Notificaciones del Navegador */}
        <div className="w-full mb-6">
          {notifPermission === 'default' && (
            <button 
              onClick={solicitarPermisoNotificaciones}
              className="w-full flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium py-3 px-4 rounded-xl border border-blue-500/30 transition-all active:scale-95 text-sm"
            >
              <MdNotifications size={20} />
              <span>Activar Notificaciones Web</span>
            </button>
          )}
          {notifPermission === 'granted' && (
            <div className="flex items-center justify-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 py-3 px-4 rounded-xl text-center w-full">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>Notificaciones del navegador activas</span>
            </div>
          )}
          {notifPermission === 'denied' && (
            <div className="flex items-center justify-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl text-center w-full">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Notificaciones bloqueadas por navegador</span>
            </div>
          )}
        </div>

        {/* Botón para Exportar Datos */}
        {userRole !== 'BASE' && (
          <button 
            onClick={exportarAExcel}
            disabled={exporting}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-emerald-650/15 transition-all active:scale-95"
          >
            {exporting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <MdFileDownload size={20} />
            )}
            <span>{exporting ? 'Exportando...' : 'Exportar Movimientos a Excel'}</span>
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
