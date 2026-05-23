import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApartados } from '../hooks/useApartados';
import ApartadoModal from '../components/ApartadoModal';
import CombinarModal from '../components/CombinarModal';
import { MdAdd, MdMoreVert, MdEdit, MdDelete, MdMergeType } from 'react-icons/md';

const Apartados = () => {
  const { userRole } = useAuth();
  const { apartados, loading, addApartado, updateApartado, deleteApartado, combinarApartados } = useApartados();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // States para Edit
  const [editData, setEditData] = useState(null);
  
  // States para Combine
  const [isCombinarOpen, setIsCombinarOpen] = useState(false);
  const [apartadoToCombine, setApartadoToCombine] = useState(null);
  
  // State para Dropdown
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  // Error genérico
  const [errorMsg, setErrorMsg] = useState('');

  const canEdit = userRole === 'ADMIN' || userRole === 'TESORERA';

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSave = async (nombre, meta, id) => {
    if (id) {
      await updateApartado(id, { nombre, meta_financiera: Number(meta) || 0 });
    } else {
      await addApartado(nombre, meta);
    }
  };

  const handleEditClick = (e, apartado) => {
    e.stopPropagation();
    setEditData(apartado);
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleDeleteClick = async (e, apartado) => {
    e.stopPropagation();
    setActiveDropdownId(null);
    if (apartado.saldo_actual > 0) {
      setErrorMsg(`No puedes borrar "${apartado.nombre}" porque tiene saldo positivo. Transfiere o combina los fondos primero.`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    
    if (window.confirm(`¿Estás seguro de borrar el apartado "${apartado.nombre}"?`)) {
      await deleteApartado(apartado.id);
    }
  };

  const handleCombineClick = (e, apartado) => {
    e.stopPropagation();
    setApartadoToCombine(apartado);
    setIsCombinarOpen(true);
    setActiveDropdownId(null);
  };

  const handleConfirmCombine = async (origenId, destinoId) => {
    await combinarApartados(origenId, destinoId);
  };

  const calculateProgress = (actual, meta) => {
    if (!meta || meta <= 0) return 0;
    const progress = (actual / meta) * 100;
    return progress > 100 ? 100 : progress;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  };

  return (
    <div className="page-container relative pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1>Apartados</h1>
        {canEdit && (
          <button 
            onClick={(e) => { e.stopPropagation(); setEditData(null); setIsModalOpen(true); }}
            className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 p-2 rounded-full transition-colors flex items-center justify-center"
            title="Crear nuevo apartado"
          >
            <MdAdd size={24} />
          </button>
        )}
      </div>
      
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl mb-6 text-sm animate-fadeIn">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : apartados.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No hay apartados creados aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apartados.map(apartado => {
            const progress = calculateProgress(apartado.saldo_actual, apartado.meta_financiera);
            const hasMeta = apartado.meta_financiera > 0;
            const isDropdownOpen = activeDropdownId === apartado.id;
            
            return (
              <div key={apartado.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-blue-500/30 transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">
                    {apartado.nombre}
                  </h3>
                  {canEdit && (
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(isDropdownOpen ? null : apartado.id);
                        }}
                        className="text-slate-500 hover:text-slate-300 p-1 rounded-full hover:bg-slate-700/50 transition-colors"
                      >
                        <MdMoreVert size={20} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                          <button 
                            onClick={(e) => handleEditClick(e, apartado)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <MdEdit size={18} />
                            Editar
                          </button>
                          <button 
                            onClick={(e) => handleCombineClick(e, apartado)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-purple-400 hover:bg-slate-700 hover:text-purple-300 transition-colors"
                          >
                            <MdMergeType size={18} />
                            Combinar
                          </button>
                          <button 
                            onClick={(e) => handleDeleteClick(e, apartado)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${apartado.saldo_actual > 0 ? 'text-slate-500 cursor-not-allowed' : 'text-red-400 hover:bg-slate-700 hover:text-red-300'}`}
                          >
                            <MdDelete size={18} />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-slate-400 mb-1">Saldo Actual</p>
                  <p className="text-2xl font-semibold text-white">
                    {formatCurrency(apartado.saldo_actual)}
                  </p>
                </div>
                
                {hasMeta && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Progreso</span>
                      <span>{formatCurrency(apartado.meta_financiera)}</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-xs mt-1 text-slate-500">
                      {progress.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <>
          <ApartadoModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSave}
            initialData={editData}
          />
          <CombinarModal
            isOpen={isCombinarOpen}
            onClose={() => setIsCombinarOpen(false)}
            onConfirm={handleConfirmCombine}
            origenApartado={apartadoToCombine}
            apartados={apartados}
          />
        </>
      )}
    </div>
  );
};

export default Apartados;
