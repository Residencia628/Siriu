import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
// Import charting components
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tiposBien, setTiposBien] = useState([]);
  const [loading, setLoading] = useState(true);
  // View modes for different sections
  const [statusView, setStatusView] = useState('table'); // 'table' or 'chart'
  const [typeView, setTypeView] = useState('table'); // 'table' or 'chart'

  useEffect(() => {
    fetchStats();
    fetchTiposBien();
  }, []);

  const fetchTiposBien = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/tipos-bien`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTiposBien(response.data);
    } catch (error) {
      // Fallback to default types if API fails
      setTiposBien([
        { id: "1", nombre: "computadora" },
        { id: "2", nombre: "periferico" },
        { id: "3", nombre: "componente_red" },
        { id: "4", nombre: "dispositivo_movil" },
        { id: "5", nombre: "insumo_critico" }
      ]);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="dashboard-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  const statusLabels = {
    disponible: "Disponible",
    asignado: "Asignado",
    en_mantenimiento: "En Mantenimiento",
    dado_de_baja: "Dado de Baja"
  };

  const statusColors = {
    disponible: "#10B981", // green-500
    asignado: "#3B82F6",   // blue-500
    en_mantenimiento: "#F59E0B", // yellow-500
    dado_de_baja: "#6B7280"      // gray-500
  };

  // Create dynamic type labels from tipos_bien
  const typeLabels = {};
  tiposBien.forEach(tipo => {
    // Convert snake_case to readable format
    const readableName = tipo.nombre
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    typeLabels[tipo.nombre] = readableName;
  });

  // Prepare data for charts
  const prepareStatusChartData = () => {
    if (!stats || !stats.by_status) return [];
    
    return Object.entries(stats.by_status).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      color: statusColors[status] || "#6B7280"
    }));
  };

  const prepareTypeChartData = () => {
    if (!stats || !stats.by_type) return [];
    
    return Object.entries(stats.by_type).map(([type, count]) => ({
      name: typeLabels[type] || type,
      value: count,
      color: "#EF4444" // red-500 as default
    }));
  };

  // Chart components
  const StatusChart = () => (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={prepareStatusChartData()}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {prepareStatusChartData().map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, "Equipos"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const TypeChart = () => (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={prepareTypeChartData()}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 40,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip formatter={(value) => [value, "Equipos"]} />
          <Legend />
          <Bar dataKey="value" name="Cantidad de Equipos" fill="#EF4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard-container">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>Dashboard</h1>
        <p className="text-gray-400">Vista general del inventario de recursos informáticos</p>
      </div>

      {/* Total Equipment */}
      <div className="grid grid-cols-1 gap-6">
        <div
          className="relative overflow-hidden rounded-2xl p-8 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(220, 38, 38, 0.3)'
          }}
        >
          <div className="relative z-10">
            <p className="text-gray-300 text-sm font-medium mb-2">Total de Equipos</p>
            <p className="text-5xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }} data-testid="total-equipment">
              {stats?.total_equipment || 0}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full filter blur-3xl opacity-20"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Status */}
        <div
          className="rounded-2xl p-6 shadow-lg"
          style={{
            background: 'rgba(26, 26, 27, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white" style={{ fontFamily: 'Space Grotesk' }}>Por Estado Operativo</h3>
            {/* Mini menu for view toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusView('table')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  statusView === 'table' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Tabla
              </button>
              <button
                onClick={() => setStatusView('chart')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  statusView === 'chart' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Gráfica
              </button>
            </div>
          </div>
          
          {statusView === 'table' ? (
            <div className="space-y-3" data-testid="status-stats">
              {Object.entries(stats?.by_status || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        status === 'disponible' ? 'bg-green-500' :
                        status === 'asignado' ? 'bg-blue-500' :
                        status === 'en_mantenimiento' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}
                    ></div>
                    <span className="text-gray-300 text-sm">{statusLabels[status]}</span>
                  </div>
                  <span className="text-white font-semibold" data-testid={`status-${status}-count`}>{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <StatusChart />
          )}
        </div>

        {/* By Type */}
        <div
          className="rounded-2xl p-6 shadow-lg"
          style={{
            background: 'rgba(26, 26, 27, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white" style={{ fontFamily: 'Space Grotesk' }}>Por Tipo de Equipo</h3>
            {/* Mini menu for view toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setTypeView('table')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  typeView === 'table' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Tabla
              </button>
              <button
                onClick={() => setTypeView('chart')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  typeView === 'chart' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Gráfica
              </button>
            </div>
          </div>
          
          {typeView === 'table' ? (
            <div className="space-y-3" data-testid="type-stats">
              {Object.entries(stats?.by_type || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 transition-colors">
                  <span className="text-gray-300 text-sm">{typeLabels[type] || type}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full"
                        style={{ width: `${stats?.total_equipment > 0 ? (count / stats.total_equipment) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold w-8 text-right" data-testid={`type-${type}-count`}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <TypeChart />
          )}
        </div>
      </div>

      {/* By Department */}
      {stats?.by_department && Object.keys(stats.by_department).length > 0 && (
        <div
          className="rounded-2xl p-6 shadow-lg"
          style={{
            background: 'rgba(26, 26, 27, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h3 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>Por Departamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="department-stats">
            {Object.entries(stats.by_department).map(([dept, count]) => (
              <div
                key={dept}
                className="p-4 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-200 hover:scale-105"
              >
                <p className="text-gray-400 text-xs mb-1">{dept}</p>
                <p className="text-2xl font-bold text-white" data-testid={`dept-${dept}-count`}>{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}