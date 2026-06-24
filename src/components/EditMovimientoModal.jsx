import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import ConfirmModal from './ConfirmModal';

const EditMovimientoModal = ({ isOpen, onClose, onSave, apartados, initialData = null }) => {
  const [titulo, setTitulo] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [apartadoId, setApartadoId] = useState('');
  const [apartadoDestinoId, setApartadoDestinoId] = useState('');

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

  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.titulo !== undefined) {
        setTitulo(initialData.titulo || '');
        setConcepto(initialData.concepto || '');
      } else {
        // Para registros antiguos, cargamos el concepto en el título y dejamos el desglose vacío
        setTitulo(initialData.concepto || '');
        setConcepto('');
      }
      setMonto(initialData.monto || '');
      setApartadoId(initialData.apartado_id || '');
      setApartadoDestinoId(initialData.apartado_destino_id || '');

      let rawDate = new Date();
      if (initialData.fecha) {
        rawDate = initialData.fecha.seconds 
          ? new Date(initialData.fecha.seconds * 1000) 
          : new Date(initialData.fecha);
      }
      
      const year = rawDate.getFullYear();
      const month = String(rawDate.getMonth() + 1).padStart(2, '0');
      const day = String(rawDate.getDate()).padStart(2, '0');
      setFecha(`${year}-${month}-${day}`);
    }
  }, [isOpen, initialData]);

  if (!isOpen || !initialData) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titulo.trim() || !monto || !fecha || !apartadoId) return;

    const [year, month, day] = fecha.split('-').map(Number);
    const ahora = new Date();
    const dateObj = new Date(year, month - 1, day, ahora.getHours(), ahora.getMinutes(), ahora.getSeconds());

    const updateData = {
      titulo: titulo.trim(),
      concepto: concepto.trim(),
      monto: Number(monto),
      fecha: dateObj,
      apartado_id: apartadoId
    };

    if (initialData.tipo === 'Transferencia') {
      if (!apartadoDestinoId) {
        showDialog({
          title: 'Falta Destino',
          message: 'Debes seleccionar un apartado de destino.',
          type: 'warning'
        });
        return;
      }
      if (apartadoId === apartadoDestinoId) {
        showDialog({
          title: 'Apartados Idénticos',
          message: 'El apartado de origen y destino no pueden ser iguales.',
          type: 'warning'
        });
        return;
      }
      updateData.apartado_destino_id = apartadoDestinoId;
    }

    onSave(initialData.id, updateData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800/90 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <MdClose size={24} />
        </button>
        
        <h2 className="text-2xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Editar {initialData.tipo}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Título del Movimiento (Breve)
            </label>
            <input 
              type="text" 
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del movimiento"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Concepto (Desglose Largo)
            </label>
            <textarea 
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Desglose adicional..."
              rows={3}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Monto ($)
              </label>
              <input 
                type="number" 
                required
                min="0.01"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fecha
              </label>
              <input 
                type="date" 
                required
                max={new Date().toISOString().split('T')[0]}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {initialData.tipo === 'Transferencia' ? 'Apartado Origen' : 'Apartado'}
            </label>
            <select
              value={apartadoId}
              required
              onChange={(e) => setApartadoId(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            >
              <option value="" disabled>Seleccionar apartado</option>
              {apartados.map(ap => (
                <option key={ap.id} value={ap.id}>{ap.nombre}</option>
              ))}
            </select>
          </div>

          {initialData.tipo === 'Transferencia' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Apartado Destino
              </label>
              <select
                value={apartadoDestinoId}
                required
                onChange={(e) => setApartadoDestinoId(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              >
                <option value="" disabled>Seleccionar apartado destino</option>
                {apartados.map(ap => (
                  <option key={ap.id} value={ap.id}>{ap.nombre}</option>
                ))}
              </select>
            </div>
          )}
          
          <button 
            type="submit"
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5 transition-all active:scale-95 animate-fadeIn"
          >
            Guardar Cambios
          </button>
        </form>
      </div>
      <ConfirmModal {...dialogConfig} onClose={closeDialog} />
    </div>
  );
};

export default EditMovimientoModal;
