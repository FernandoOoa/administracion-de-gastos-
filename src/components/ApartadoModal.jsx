import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';

const ApartadoModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [nombre, setNombre] = useState('');
  const [meta, setMeta] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNombre(initialData?.nombre || '');
      setMeta(initialData?.meta_financiera || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    
    onSave(nombre, meta, initialData?.id);
    onClose();
  };

  const isEdit = !!initialData;

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
          {isEdit ? 'Editar Apartado' : 'Nuevo Apartado'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nombre del apartado
            </label>
            <input 
              type="text" 
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Fondo de emergencia"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Meta financiera (Opcional)
            </label>
            <input 
              type="number" 
              min="0"
              step="0.01"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="Ej. 5000"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5 transition-all active:scale-95"
          >
            {isEdit ? 'Guardar Cambios' : 'Crear Apartado'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApartadoModal;
