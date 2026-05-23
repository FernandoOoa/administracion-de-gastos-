import React, { useState } from 'react';
import { useApartados } from '../hooks/useApartados';
import { useRegistro } from '../hooks/useRegistro';
import { MdInput, MdOutput, MdSwapHoriz, MdCloudUpload } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

const RegistroRapido = () => {
  const { apartados, loading: loadingApartados } = useApartados();
  const { registrarTransaccion, loading: saving, error } = useRegistro();
  const { userRole } = useAuth();

  const [tipo, setTipo] = useState('Entrada');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [apartadoId, setApartadoId] = useState('');
  const [apartadoDestinoId, setApartadoDestinoId] = useState('');
  const [file, setFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (userRole === 'BASE') {
      setTipo('Entrada');
    }
  }, [userRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');

    const res = await registrarTransaccion({
      tipo,
      monto,
      concepto,
      apartadoId,
      apartadoDestinoId: tipo === 'Transferencia' ? apartadoDestinoId : null,
      comprobanteFile: file
    });

    if (res.success) {
      setSuccessMsg('¡Transacción guardada exitosamente!');
      setMonto('');
      setConcepto('');
      setFile(null);
      if (tipo === 'Transferencia') setApartadoDestinoId('');
    }
  };

  const isFormValid = () => {
    if (!monto || !concepto || !apartadoId) return false;
    if (tipo === 'Transferencia' && (!apartadoDestinoId || apartadoId === apartadoDestinoId)) return false;
    return true;
  };

  return (
    <div className="page-container pb-24">
      <h1 className="text-2xl font-bold mb-6">Registro Rápido</h1>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}
      
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-xl mb-6 text-sm">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector de Tipo (Diseño grande para una mano) */}
        {userRole !== 'BASE' && (
          <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setTipo('Entrada')}
            className={`flex flex-col items-center py-3 rounded-xl transition-all ${tipo === 'Entrada' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <MdInput size={24} className="mb-1" />
            <span className="text-xs font-medium">Entrada</span>
          </button>
          <button
            type="button"
            onClick={() => setTipo('Salida')}
            className={`flex flex-col items-center py-3 rounded-xl transition-all ${tipo === 'Salida' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <MdOutput size={24} className="mb-1" />
            <span className="text-xs font-medium">Salida</span>
          </button>
          <button
            type="button"
            onClick={() => setTipo('Transferencia')}
            className={`flex flex-col items-center py-3 rounded-xl transition-all ${tipo === 'Transferencia' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <MdSwapHoriz size={24} className="mb-1" />
            <span className="text-xs font-medium">Transfer.</span>
          </button>
        </div>
        )}

        {/* Monto - Teclado Numérico */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Monto</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">$</span>
            <input
              type="tel"
              inputMode="decimal"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-10 pr-4 py-4 text-2xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Concepto */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Concepto</label>
          <input
            type="text"
            required
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="¿De qué trata el movimiento?"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Apartado Origen */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            {tipo === 'Transferencia' ? 'Apartado Origen (Se restará de aquí)' : 'Apartado'}
          </label>
          <select
            required
            value={apartadoId}
            onChange={(e) => setApartadoId(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">Selecciona un apartado...</option>
            {apartados.map(ap => (
              <option key={ap.id} value={ap.id}>{ap.nombre} (${ap.saldo_actual})</option>
            ))}
          </select>
        </div>

        {/* Apartado Destino (Sólo Transferencias) */}
        {tipo === 'Transferencia' && (
          <div className="animate-fadeIn">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Apartado Destino (Se sumará aquí)
            </label>
            <select
              required
              value={apartadoDestinoId}
              onChange={(e) => setApartadoDestinoId(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="">Selecciona el destino...</option>
              {apartados.map(ap => (
                <option key={ap.id} value={ap.id} disabled={ap.id === apartadoId}>
                  {ap.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload File (Solo Salidas) */}
        {tipo === 'Salida' && (
          <div className="animate-fadeIn">
            <label className="block text-sm font-medium text-slate-300 mb-1">Comprobante (Opcional)</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload" 
                className="w-full flex items-center justify-center gap-2 bg-slate-900/50 border border-slate-700 border-dashed rounded-xl px-4 py-4 text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
              >
                <MdCloudUpload size={24} />
                <span>{file ? file.name : "Subir foto del ticket"}</span>
              </label>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || loadingApartados || !isFormValid()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-4 px-4 rounded-xl shadow-lg hover:shadow-blue-500/25 transform transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex justify-center items-center mt-8"
        >
          {saving ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            `Registrar ${tipo}`
          )}
        </button>
      </form>
    </div>
  );
};

export default RegistroRapido;
