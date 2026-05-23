import React from 'react';
import { useCustodia } from '../hooks/useCustodia';
import { useAuth } from '../contexts/AuthContext';
import { MdCheckCircle, MdSend } from 'react-icons/md';

const Custodia = () => {
  const { porEntregar, esperandoConfirmacion, misPeticiones, loading, entregarATesoreria, confirmarRecepcion } = useCustodia();
  const { userRole } = useAuth();

  const isTesorera = userRole === 'TESORERA' || userRole === 'ADMIN';

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="page-container flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page-container pb-24">
      <h1 className="text-2xl font-bold mb-6">Custodia de Dinero</h1>

      {/* Sección 1: Dinero por entregar (Cualquier custodio) */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-blue-400 mb-4 border-b border-slate-700 pb-2">
          Dinero por entregar a Tesorería
        </h2>
        {porEntregar.length === 0 ? (
          <p className="text-slate-400 text-sm">No tienes dinero pendiente por entregar.</p>
        ) : (
          <div className="space-y-4">
            {porEntregar.map(t => (
              <div key={t.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-700 text-slate-300 rounded-md">
                      {t.tipo}
                    </span>
                    <p className="text-slate-200 mt-2">{t.concepto}</p>
                  </div>
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(t.monto)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-4">
                  {formatDate(t.fecha)}
                </div>
                <button
                  onClick={() => entregarATesoreria(t.id)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors"
                >
                  <MdSend size={18} />
                  <span>Entregar a Tesorería</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sección 2: Validación de Tesorería (Solo Tesorera o Admin) */}
      {isTesorera && (
        <section>
          <h2 className="text-lg font-semibold text-purple-400 mb-4 border-b border-slate-700 pb-2">
            Validación de Tesorería (Por Confirmar)
          </h2>
          {esperandoConfirmacion.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay entregas pendientes de validación.</p>
          ) : (
            <div className="space-y-4">
              {esperandoConfirmacion.map(t => (
                <div key={t.id} className="bg-slate-800/80 border border-purple-500/30 rounded-xl p-4 shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-semibold px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md">
                        Esperando Confirmación
                      </span>
                      <p className="text-slate-200 mt-2">{t.concepto}</p>
                    </div>
                    <span className="text-xl font-bold text-white">
                      {formatCurrency(t.monto)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-4">
                    {formatDate(t.fecha)}
                  </div>
                  <button
                    onClick={() => confirmarRecepcion(t.id)}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg transition-colors"
                  >
                    <MdCheckCircle size={18} />
                    <span>Confirmar Recepción</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sección 3: Mis entregas en proceso (Solo BASE y GESTOR) */}
      {!isTesorera && (
        <section>
          <h2 className="text-lg font-semibold text-purple-400 mb-4 border-b border-slate-700 pb-2">
            Mis entregas en proceso (Esperando a Tesorería)
          </h2>
          {misPeticiones.length === 0 ? (
            <p className="text-slate-400 text-sm">No tienes entregas pendientes de confirmación.</p>
          ) : (
            <div className="space-y-4">
              {misPeticiones.map(t => (
                <div key={t.id} className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 shadow-lg opacity-80">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-semibold px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md">
                        En espera...
                      </span>
                      <p className="text-slate-200 mt-2">{t.concepto}</p>
                    </div>
                    <span className="text-xl font-bold text-white">
                      {formatCurrency(t.monto)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(t.fecha)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Custodia;
