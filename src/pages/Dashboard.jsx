import React from 'react';
import { useApartados } from '../hooks/useApartados';
import { useDashboard } from '../hooks/useDashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MdTrendingUp, MdTrendingDown, MdSwapHoriz } from 'react-icons/md';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const Dashboard = () => {
  const { apartados, loading: loadingApartados } = useApartados();
  const { ultimasTransacciones, loadingTransacciones } = useDashboard();
  const { userRole } = useAuth();

  if (userRole === 'BASE') {
    return <Navigate to="/registro" />;
  }

  const balanceTotal = apartados.reduce((sum, apartado) => sum + (Number(apartado.saldo_actual) || 0), 0);

  // Preparar datos para el gráfico de Dona filtrando los apartados vacíos
  const chartData = apartados
    .filter(ap => ap.saldo_actual > 0)
    .map(ap => ({
      name: ap.nombre,
      value: ap.saldo_actual
    }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
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

  if (loadingApartados) {
    return (
      <div className="page-container flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page-container pb-24">
      {/* Hero KPI: Balance Total */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <h2 className="text-blue-100 font-medium mb-1 relative z-10">Balance Total</h2>
        <p className="text-4xl font-bold text-white relative z-10">
          {formatCurrency(balanceTotal)}
        </p>
      </div>

      {/* Gráfico de Dona */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 mb-8">
        <h3 className="text-lg font-medium text-slate-200 mb-4">Distribución del Dinero</h3>
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            Aún no hay fondos para mostrar.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Últimas Transacciones */}
      <div>
        <h3 className="text-lg font-medium text-slate-200 mb-4">Últimos Movimientos</h3>
        {loadingTransacciones ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : ultimasTransacciones.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No hay transacciones recientes.</p>
        ) : (
          <div className="space-y-3">
            {ultimasTransacciones.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 p-2 rounded-lg">
                    {getTransactionIcon(t.tipo)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200 line-clamp-1">{t.concepto}</p>
                    <p className="text-xs text-slate-500">{formatDate(t.fecha)}</p>
                  </div>
                </div>
                <p className={`font-semibold ${t.tipo === 'Salida' ? 'text-red-400' : t.tipo === 'Entrada' ? 'text-blue-400' : 'text-purple-400'}`}>
                  {t.tipo === 'Salida' ? '-' : ''}{formatCurrency(t.monto)}
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
