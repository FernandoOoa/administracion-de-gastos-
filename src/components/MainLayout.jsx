import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { MdDashboard, MdAddCircleOutline, MdSecurity, MdSavings, MdNotifications, MdPerson } from 'react-icons/md';
import NotificationsPanel from './NotificationsPanel';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { useFCM } from '../hooks/useFCM';

const MainLayout = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { unreadCount } = useNotificaciones();
  
  // Inicializar FCM para permisos y tokens
  useFCM();

  const navItems = [
    { to: "/", icon: <MdDashboard size={24} />, label: "Inicio" },
    { to: "/registro", icon: <MdAddCircleOutline size={24} />, label: "Registro" },
    { to: "/custodia", icon: <MdSecurity size={24} />, label: "Custodia" },
    { to: "/apartados", icon: <MdSavings size={24} />, label: "Apartados" },
    { to: "/perfil", icon: <MdPerson size={24} />, label: "Perfil" }
  ];

  return (
    <div className="layout-container relative pt-16">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-[1000] px-4 flex justify-between items-center shadow-sm">
        <div className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          AdminGastos
        </div>
        <div>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors relative"
            title="Notificaciones"
          >
            <MdNotifications size={26} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 shadow-md animate-pulse"></span>
            )}
          </button>
          
          <NotificationsPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>
      </header>

      <main className="content-area">
        <Outlet />
      </main>
      
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-container">
              {item.icon}
            </div>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default MainLayout;
