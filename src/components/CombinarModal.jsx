import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';

const CombinarModal = ({ isOpen, onClose, onConfirm, origenApartado, apartados }) => {
  const [destinoId, setDestinoId] = useState('');

  if (!isOpen || !origenApartado) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!destinoId) return;
    onConfirm(origenApartado.id, destinoId);
    setDestinoId('');
    onClose();
  };

  const apartadosDisponibles = apartados.filter(ap => ap.id !== origenApartado.id);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
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
        
        <h2 className="text-2xl font-semibold mb-6 text-purple-400">
          Combinar Apartado
        </h2>

        <p className="text-slate-300 text-sm mb-6">
          Se transferirán <strong>{formatCurrency(origenApartado.saldo_actual)}</strong> del apartado <strong>{origenApartado.nombre}</strong> al apartado destino.
          <br /><br />
          <span className="text-red-400">⚠️ El apartado "{origenApartado.nombre}" será eliminado permanentemente.</span>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Apartado Destino
            </label>
            <select
              required
              value={destinoId}
              onChange={(e) => setDestinoId(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="">Selecciona el destino...</option>
              {apartadosDisponibles.map(ap => (
                <option key={ap.id} value={ap.id}>
                  {ap.nombre} (Actual: {formatCurrency(ap.saldo_actual)})
                </option>
              ))}
            </select>
          </div>
          
          <button 
            type="submit"
            className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
            disabled={!destinoId}
          >
            Combinar y Eliminar
          </button>
        </form>
      </div>
    </div>
  );
};

export default CombinarModal;
