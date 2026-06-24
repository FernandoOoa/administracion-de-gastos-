import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  MdClose, 
  MdCalendarToday, 
  MdPerson, 
  MdTrendingUp, 
  MdTrendingDown, 
  MdSwapHoriz, 
  MdVisibility, 
  MdVisibilityOff, 
  MdSavings, 
  MdShield,
  MdAccessTime
} from 'react-icons/md';

const DetalleMovimientoModal = ({ isOpen, onClose, movimiento, apartados = [], usuariosMap = {}, ocultarSaldos = false }) => {
  const [userName, setUserName] = useState('Cargando...');
  const [showMontoLocal, setShowMontoLocal] = useState(!ocultarSaldos);

  useEffect(() => {
    if (isOpen) {
      setShowMontoLocal(!ocultarSaldos);
    }
  }, [isOpen, ocultarSaldos]);

  useEffect(() => {
    if (!isOpen || !movimiento || !movimiento.id_usuario_registro) return;

    const userId = movimiento.id_usuario_registro;

    // Si ya existe en el mapa de usuarios global
    if (usuariosMap && usuariosMap[userId]) {
      setUserName(usuariosMap[userId]);
      return;
    }

    // De lo contrario, lo buscamos individualmente para evitar fallos por permisos globales
    const fetchUser = async () => {
      try {
        setUserName('Cargando...');
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const nombre = data.nombre || data.email || 'Sin nombre';
          setUserName(nombre);
        } else {
          setUserName('Usuario no encontrado');
        }
      } catch (err) {
        console.error("Error al obtener detalles del usuario:", err);
        setUserName(`Usuario (${userId.substring(0, 6)})`);
      }
    };

    fetchUser();
  }, [isOpen, movimiento, usuariosMap]);

  if (!isOpen || !movimiento) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  };

  const parseDate = (dateField) => {
    if (!dateField) return null;
    if (dateField.seconds) return new Date(dateField.seconds * 1000);
    if (dateField instanceof Date) return dateField;
    return new Date(dateField);
  };

  const formatDate = (dateField) => {
    const date = parseDate(dateField);
    if (!date) return 'No registrada';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatDateWithTime = (dateField) => {
    const date = parseDate(dateField);
    if (!date) return 'No registrada';
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTransactionIcon = (tipo) => {
    if (tipo === 'Entrada') return <MdTrendingUp className="text-blue-400" size={28} />;
    if (tipo === 'Salida') return <MdTrendingDown className="text-red-400" size={28} />;
    return <MdSwapHoriz className="text-purple-400" size={28} />;
  };

  const getTipoStyle = (tipo) => {
    if (tipo === 'Entrada') return {
      badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
      text: 'text-blue-400'
    };
    if (tipo === 'Salida') return {
      badge: 'bg-red-500/15 text-red-400 border border-red-500/20',
      text: 'text-red-400'
    };
    return {
      badge: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
      text: 'text-purple-400'
    };
  };

  const getCustodiaLabel = (estado) => {
    switch (estado) {
      case 'POR_ENTREGAR': return 'En custodia';
      case 'ESPERANDO_CONFIRMACION': return 'Enviado (Espera)';
      case 'EN_TESORERIA': return 'En Tesorería';
      default: return estado || 'Sin registrar';
    }
  };

  const getCustodiaBadgeStyle = (estado) => {
    switch (estado) {
      case 'POR_ENTREGAR': return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      case 'ESPERANDO_CONFIRMACION': return 'bg-purple-500/15 text-purple-400 border border-purple-500/20';
      case 'EN_TESORERIA': return 'bg-green-500/15 text-green-400 border border-green-500/20';
      default: return 'bg-slate-700/20 text-slate-400 border border-slate-700/30';
    }
  };

  const getApartadoNombre = (id) => {
    if (!id) return 'Ninguno';
    const ap = apartados.find(a => a.id === id);
    return ap ? ap.nombre : 'Apartado no encontrado';
  };

  const tipoStyle = getTipoStyle(movimiento.tipo);

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Botón de cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white hover:bg-slate-850 p-2 rounded-xl transition-all"
        >
          <MdClose size={20} />
        </button>

        {/* Título de la modal */}
        <h2 className="text-xl font-bold text-slate-200 mb-1">
          <span>Detalle de Movimiento</span>
        </h2>
        <p className="text-sm text-slate-400 font-medium mb-6 truncate" title={movimiento.titulo || movimiento.concepto}>
          {movimiento.titulo || movimiento.concepto}
        </p>

        {/* Tarjeta del Monto (Gran tamaño) */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-6 text-center mb-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/5 rounded-full blur-xl"></div>
          <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-purple-500/5 rounded-full blur-xl"></div>

          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Monto Registrado</span>
          
          <div className="flex items-center justify-center gap-2">
            <span className={`text-4xl font-extrabold tracking-tight ${tipoStyle.text}`}>
              {showMontoLocal ? formatCurrency(movimiento.monto) : '••••••'}
            </span>
            {ocultarSaldos && (
              <button 
                onClick={() => setShowMontoLocal(prev => !prev)}
                className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title={showMontoLocal ? "Ocultar monto" : "Revelar monto"}
              >
                {showMontoLocal ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
              </button>
            )}
          </div>

          <div className="flex justify-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${tipoStyle.badge}`}>
              {getTransactionIcon(movimiento.tipo)}
              <span>{movimiento.tipo}</span>
            </span>
            {movimiento.tipo === 'Entrada' && movimiento.estado_custodia && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCustodiaBadgeStyle(movimiento.estado_custodia)}`}>
                {getCustodiaLabel(movimiento.estado_custodia)}
              </span>
            )}
          </div>
        </div>

        {/* Contenido / Información */}
        <div className="space-y-5">
          
          {/* Concepto / Desglose */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Desglose / Concepto</h3>
            <div className="bg-slate-850 border border-slate-800/60 p-4 rounded-2xl text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {movimiento.titulo 
                ? (movimiento.concepto || 'Sin desglose adicional')
                : 'Sin desglose adicional'
              }
            </div>
          </div>

          {/* Grid de Apartados y Custodios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-850/40 border border-slate-800/40 p-4 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                {movimiento.tipo === 'Transferencia' ? 'Apartado Origen' : 'Apartado'}
              </span>
              <p className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <MdSavings className="text-blue-400" size={16} />
                {getApartadoNombre(movimiento.apartado_id)}
              </p>
            </div>

            {movimiento.tipo === 'Transferencia' && (
              <div className="bg-slate-850/40 border border-slate-800/40 p-4 rounded-2xl">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Apartado Destino
                </span>
                <p className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                  <MdSavings className="text-purple-400" size={16} />
                  {getApartadoNombre(movimiento.apartado_destino_id)}
                </p>
              </div>
            )}
          </div>

          {/* Sección de Historial de Fechas y Usuario */}
          <div className="bg-slate-850/30 border border-slate-800/50 rounded-2xl p-4 space-y-3">
            
            {/* Usuario que registró */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <MdPerson className="text-slate-500" size={16} />
                Registrado por
              </span>
              <span className="text-xs font-semibold text-slate-200 text-right font-sans">
                {userName}
              </span>
            </div>

            {/* Fecha del Movimiento */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <MdCalendarToday className="text-slate-500" size={16} />
                Fecha del Movimiento
              </span>
              <span className="text-xs font-semibold text-slate-200 text-right">
                {formatDate(movimiento.fecha)}
              </span>
            </div>

            {/* Fecha de Registro en Sistema */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <MdAccessTime className="text-slate-500" size={16} />
                Registro en Sistema
              </span>
              <span className="text-xs font-semibold text-slate-300 text-right">
                {formatDateWithTime(movimiento.fecha_registro)}
              </span>
            </div>

            {/* Fecha de Recepción en Tesorería */}
            {movimiento.fecha_recepcion_tesoreria && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <MdShield className="text-slate-500" size={16} />
                  Recepción en Tesorería
                </span>
                <span className="text-xs font-semibold text-slate-300 text-right">
                  {formatDateWithTime(movimiento.fecha_recepcion_tesoreria)}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Botón de acción final */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-755 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 text-sm"
          >
            Cerrar Detalles
          </button>
        </div>

      </div>
    </div>
  );
};

export default DetalleMovimientoModal;
