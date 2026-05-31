import React, { useState } from 'react';
import { useApartados } from '../hooks/useApartados';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MdTrendingUp, MdTrendingDown, MdSwapHoriz, MdFilterList, MdSavings, MdInfo, MdCalendarToday } from 'react-icons/md';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const Dashboard = () => {
  const { userRole } = useAuth();
  const { apartados, loading: loadingApartados } = useApartados();
  const { transacciones, loadingTransacciones } = useDashboard();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedApartadoId, setSelectedApartadoId] = useState('');

  if (userRole === 'BASE') {
    return <Navigate to="/registro" />;
  }

  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const ANIOS = [2024, 2025, 2026];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  const getTransactionIcon = (tipo) => {
    if (tipo === 'Entrada') return <MdTrendingUp className="text-blue-400" size={24} />;
    if (tipo === 'Salida') return <MdTrendingDown className="text-red-400" size={24} />;
    return <MdSwapHoriz className="text-purple-400" size={24} />;
  };

  const getCustodiaLabel = (estado) => {
    switch (estado) {
      case 'POR_ENTREGAR': return 'En custodia';
      case 'ESPERANDO_CONFIRMACION': return 'Enviado (Espera)';
      case 'EN_TESORERIA': return 'En Tesorería';
      default: return estado;
    }
  };

  const getCustodiaBadgeStyle = (estado) => {
    switch (estado) {
      case 'POR_ENTREGAR': return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      case 'ESPERANDO_CONFIRMACION': return 'bg-purple-500/15 text-purple-400 border border-purple-500/20';
      case 'EN_TESORERIA': return 'bg-green-500/15 text-green-400 border border-green-500/20';
      default: return 'bg-slate-700/20 text-slate-400';
    }
  };

  // 1. Balance Total Global (dinero total actual en caja)
  const balanceTotalGlobal = apartados.reduce((sum, ap) => sum + (Number(ap.saldo_actual) || 0), 0);

  // 2. Filtrar transacciones por mes, año y apartado seleccionado
  const transaccionesFiltradas = transacciones.filter(t => {
    if (!t.fecha) return false;
    const date = new Date(t.fecha.seconds * 1000);
    const matchMes = date.getMonth() === selectedMonth;
    const matchAnio = date.getFullYear() === selectedYear;
    
    if (selectedApartadoId) {
      return matchMes && matchAnio && (t.apartado_id === selectedApartadoId || t.apartado_destino_id === selectedApartadoId);
    }
    return matchMes && matchAnio;
  });

  // 3. Calcular KPIs mensuales para el mes seleccionado
  let entradasMensuales = 0;
  let salidasMensuales = 0;

  transaccionesFiltradas.forEach(t => {
    if (selectedApartadoId) {
      if (t.tipo === 'Entrada' && t.apartado_id === selectedApartadoId) {
        entradasMensuales += t.monto;
      } else if (t.tipo === 'Salida' && t.apartado_id === selectedApartadoId) {
        salidasMensuales += t.monto;
      } else if (t.tipo === 'Transferencia') {
        if (t.apartado_destino_id === selectedApartadoId) {
          entradasMensuales += t.monto;
        }
        if (t.apartado_id === selectedApartadoId) {
          salidasMensuales += t.monto;
        }
      }
    } else {
      if (t.tipo === 'Entrada') {
        entradasMensuales += t.monto;
      } else if (t.tipo === 'Salida') {
        salidasMensuales += t.monto;
      }
    }
  });

  const balanceMensual = entradasMensuales - salidasMensuales;

  // 4. Agrupar datos semanales del mes para el gráfico de barras comparativo
  const getSemanasData = () => {
    const data = [
      { name: 'Sem 1', Entradas: 0, Salidas: 0 },
      { name: 'Sem 2', Entradas: 0, Salidas: 0 },
      { name: 'Sem 3', Entradas: 0, Salidas: 0 },
      { name: 'Sem 4', Entradas: 0, Salidas: 0 },
      { name: 'Sem 5', Entradas: 0, Salidas: 0 }
    ];

    transaccionesFiltradas.forEach(t => {
      const date = new Date(t.fecha.seconds * 1000);
      const dia = date.getDate();
      let idx = 0;
      if (dia <= 7) idx = 0;
      else if (dia <= 14) idx = 1;
      else if (dia <= 21) idx = 2;
      else if (dia <= 28) idx = 3;
      else idx = 4;

      if (selectedApartadoId) {
        if (t.tipo === 'Entrada' && t.apartado_id === selectedApartadoId) {
          data[idx].Entradas += t.monto;
        } else if (t.tipo === 'Salida' && t.apartado_id === selectedApartadoId) {
          data[idx].Salidas += t.monto;
        } else if (t.tipo === 'Transferencia') {
          if (t.apartado_destino_id === selectedApartadoId) data[idx].Entradas += t.monto;
          if (t.apartado_id === selectedApartadoId) data[idx].Salidas += t.monto;
        }
      } else {
        if (t.tipo === 'Entrada') data[idx].Entradas += t.monto;
        else if (t.tipo === 'Salida') data[idx].Salidas += t.monto;
      }
    });

    return data;
  };

  const barChartData = getSemanasData();

  // 5. Preparar datos para el grafico de dona (distribución actual)
  const donutChartData = apartados
    .filter(ap => ap.saldo_actual > 0)
    .map(ap => ({
      name: ap.nombre,
      value: ap.saldo_actual
    }));

  // 6. Datos del apartado individual seleccionado
  const apartadoSeleccionadoObj = apartados.find(ap => ap.id === selectedApartadoId);
  const porcentajeDelTotal = (apartadoSeleccionadoObj && balanceTotalGlobal > 0)
    ? ((apartadoSeleccionadoObj.saldo_actual / balanceTotalGlobal) * 100).toFixed(1)
    : 0;

  const progress = apartadoSeleccionadoObj
    ? ((apartadoSeleccionadoObj.saldo_actual / (apartadoSeleccionadoObj.meta_financiera || 1)) * 100)
    : 0;
  const progressLimitado = progress > 100 ? 100 : progress;

  if (loadingApartados || loadingTransacciones) {
    return (
      <div className="page-container flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page-container pb-28">
      {/* Header Balance General Destacado */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-blue-100 text-sm font-medium mb-1">Balance Total en Caja</h2>
            <p className="text-3xl font-extrabold text-white">
              {formatCurrency(balanceTotalGlobal)}
            </p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
            <MdSavings className="text-white" size={32} />
          </div>
        </div>
      </div>

      {/* Selectores de Filtro por Mes, Año y Apartado */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 mb-6 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
          <MdFilterList size={18} />
          <span>Filtros de Análisis</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Selector de Mes */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              {MESES.map((mes, idx) => (
                <option key={idx} value={idx}>{mes}</option>
              ))}
            </select>
          </div>

          {/* Selector de Año */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              {ANIOS.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de Apartado Individual */}
        <div>
          <select
            value={selectedApartadoId}
            onChange={(e) => setSelectedApartadoId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Caja General (Todos los apartados)</option>
            {apartados.map(ap => (
              <option key={ap.id} value={ap.id}>{ap.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de KPIs del Mes Seleccionado */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {/* KPI: Entradas */}
        <div className="bg-slate-800/40 border border-slate-700/30 p-3 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Entradas
          </span>
          <p className="text-sm font-bold text-blue-400 mt-2 truncate">
            {formatCurrency(entradasMensuales)}
          </p>
        </div>

        {/* KPI: Salidas */}
        <div className="bg-slate-800/40 border border-slate-700/30 p-3 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            Salidas
          </span>
          <p className="text-sm font-bold text-red-400 mt-2 truncate">
            {formatCurrency(salidasMensuales)}
          </p>
        </div>

        {/* KPI: Balance */}
        <div className="bg-slate-800/40 border border-slate-700/30 p-3 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Balance
          </span>
          <p className={`text-sm font-bold mt-2 truncate ${balanceMensual >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {balanceMensual >= 0 ? '+' : ''}{formatCurrency(balanceMensual)}
          </p>
        </div>
      </div>

      {/* Gráfico Comparativo Mensual (Barras) */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <MdCalendarToday className="text-blue-400" />
          Comparativa Semanal ({MESES[selectedMonth]})
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Bar dataKey="Entradas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Salidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secciones Dinámicas: Apartado Individual vs Caja General */}
      {selectedApartadoId && apartadoSeleccionadoObj ? (
        /* Vista de Análisis de Apartado Individual */
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 mb-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <MdSavings className="text-purple-400" size={20} />
            Análisis: {apartadoSeleccionadoObj.nombre}
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Saldo Actual</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(apartadoSeleccionadoObj.saldo_actual)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">% de Caja Total</p>
              <p className="text-lg font-bold text-blue-400">
                {porcentajeDelTotal}%
              </p>
            </div>
          </div>

          {/* Barra de progreso de meta si tiene una */}
          {apartadoSeleccionadoObj.meta_financiera > 0 && (
            <div className="border-t border-slate-700/50 pt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Meta de Ahorro</span>
                <span className="font-medium text-slate-300">{formatCurrency(apartadoSeleccionadoObj.meta_financiera)}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressLimitado}%` }}
                ></div>
              </div>
              <p className="text-right text-xs mt-1 text-slate-500">
                {progress.toFixed(0)}% completado
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Vista General de Distribución (Gráfico de Dona) */
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <MdInfo className="text-purple-400" />
            Distribución Actual de Fondos
          </h3>
          {donutChartData.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No hay fondos para distribuir.
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Historial de Movimientos del Mes */}
      <div>
        <h3 className="text-base font-bold text-slate-200 mb-4 flex justify-between items-center">
          <span>Movimientos del Mes</span>
          <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            {transaccionesFiltradas.length} total
          </span>
        </h3>
        {transaccionesFiltradas.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8 bg-slate-850 rounded-2xl border border-dashed border-slate-700">
            No hay transacciones registradas en este período.
          </p>
        ) : (
          <div className="space-y-3">
            {transaccionesFiltradas.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 p-2 rounded-lg">
                    {getTransactionIcon(t.tipo)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-200 line-clamp-1">{t.concepto}</p>
                      {t.tipo === 'Entrada' && t.estado_custodia && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getCustodiaBadgeStyle(t.estado_custodia)}`}>
                          {getCustodiaLabel(t.estado_custodia)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDate(t.fecha)} 
                      {/* Mostrar el origen/destino si fue transferencia */}
                      {t.tipo === 'Transferencia' && ` (Transferido)`}
                    </p>
                  </div>
                </div>
                <p className={`font-semibold ${t.tipo === 'Salida' ? 'text-red-400' : t.tipo === 'Entrada' ? 'text-blue-400' : 'text-purple-400'}`}>
                  {t.tipo === 'Salida' ? '-' : t.tipo === 'Entrada' ? '+' : ''}{formatCurrency(t.monto)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
