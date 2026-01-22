import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  const menuItems = [
    { path: "/dashboard", icon: "📊", label: "Dashboard", roles: ["user", "admin", "superadmin"] },
    { path: "/bi-dashboard", icon: "📈", label: "Análisis BI", roles: ["admin", "superadmin"] },
    { path: "/inventory", icon: "📦", label: "Inventario", roles: ["user", "admin", "superadmin"] },
    { path: "/equipment/new", icon: "➕", label: "Nuevo Equipo", roles: ["admin", "superadmin"] },
    { path: "/edificios", icon: "🏛️", label: "Edificios", roles: ["admin", "superadmin"] },
    { path: "/locations", icon: "📍", label: "Ubicaciones", roles: ["user", "admin", "superadmin"] },
    { path: "/departments", icon: "🏢", label: "Departamentos", roles: ["user", "admin", "superadmin"] },
    { path: "/tipos-bien", icon: "🏷️", label: "Tipos de Bien", roles: ["admin", "superadmin"] },
    { path: "/marcas", icon: "🔖", label: "Marcas", roles: ["admin", "superadmin"] },
    { path: "/users", icon: "👥", label: "Usuarios", roles: ["superadmin"] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f10 0%, #1a1a1b 100%)' }}>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full transition-all duration-300 z-20 flex flex-col ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
        style={{
          background: 'rgba(26, 26, 27, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Logo de la institución */}
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain drop-shadow-lg"
                  onError={(e) => {
                    // Fallback al ícono SVG si no se encuentra la imagen
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback icon (oculto por defecto) */}
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl items-center justify-center shadow-lg" style={{ display: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>SIRIU</h2>
                  <p className="text-xs text-gray-400">Inventario</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.replace(/\//g, '-')}`}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          {user && sidebarOpen && (
            <div className="mb-3 px-2">
              <p className="text-xs text-gray-500 mb-1">Conectado como</p>
              <p className="text-sm text-white font-medium truncate" data-testid="user-name">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize" data-testid="user-role">{user.role}</p>
              <Button
                onClick={() => navigate("/profile")}
                className="mt-2 w-full text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-1"
              >
                Mi Perfil
              </Button>
            </div>
          )}
          <Button
            onClick={handleLogout}
            data-testid="logout-button"
            className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm"
          >
            {sidebarOpen ? "Cerrar Sesión" : "🚪"}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {/* Toggle sidebar button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-20 z-30 w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200"
        style={{ left: sidebarOpen ? '15rem' : '3.5rem' }}
      >
        {sidebarOpen ? "◀" : "▶"}
      </button>
    </div>
  );
}