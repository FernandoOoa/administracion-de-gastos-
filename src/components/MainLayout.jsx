import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { MdDashboard, MdAddCircleOutline, MdSecurity, MdSavings } from 'react-icons/md';

const MainLayout = () => {
  const navItems = [
    { to: "/", icon: <MdDashboard size={24} />, label: "Inicio" },
    { to: "/registro", icon: <MdAddCircleOutline size={24} />, label: "Registro" },
    { to: "/custodia", icon: <MdSecurity size={24} />, label: "Custodia" },
    { to: "/apartados", icon: <MdSavings size={24} />, label: "Apartados" }
  ];

  return (
    <div className="layout-container">
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
