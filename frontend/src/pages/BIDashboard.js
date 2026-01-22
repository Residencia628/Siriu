import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
// Import charting components
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BIDashboard() {
  const navigate = useNavigate();
  const [departmentData, setDepartmentData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [edificioData, setEdificioData] = useState([]);
  const [tiposBien, setTiposBien] = useState([]);
  const [loading, setLoading] = useState(true);
  // View modes for different sections
  const [departmentView, setDepartmentView] = useState('table'); // 'table' or 'chart'
  const [locationView, setLocationView] = useState('table'); // 'table' or 'chart'
  const [edificioView, setEdificioView] = useState('table'); // 'table' or 'chart'
  const [statusView, setStatusView] = useState('table'); // 'table' or 'chart'
  const [typeView, setTypeView] = useState('table'); // 'table' or 'chart'

  useEffect(() => {
    fetchAllData();
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

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch department data
      const deptResponse = await axios.get(`${API}/dashboard/equipment-by-department`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartmentData(deptResponse.data);
      
      // Fetch location data
      const locResponse = await axios.get(`${API}/dashboard/equipment-by-location`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocationData(locResponse.data);
      
      // Fetch edificio data
      const edificioResponse = await axios.get(`${API}/dashboard/equipment-by-edificio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEdificioData(edificioResponse.data);
    } catch (error) {
      toast.error("Error al cargar datos de análisis");
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    disponible: "Disponible",
    asignado: "Asignado",
    en_mantenimiento: "En Mantenimiento",
    dado_de_baja: "Dado de Baja",
    en_resguardo: "En Resguardo"
  };

  const statusColors = {
    disponible: "#10B981", // green-500
    asignado: "#3B82F6",   // blue-500
    en_mantenimiento: "#F59E0B", // yellow-500
    dado_de_baja: "#6B7280",     // gray-500
    en_resguardo: "#8B5CF6"      // purple-500
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
    if (!departmentData || departmentData.length === 0) return [];
    
    // Aggregate status data from all departments
    const statusCounts = {};
    departmentData.forEach(dept => {
      Object.entries(dept.by_status).forEach(([status, count]) => {
        statusCounts[status] = (statusCounts[status] || 0) + count;
      });
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      color: statusColors[status] || "#6B7280"
    }));
  };

  const prepareTypeChartData = () => {
    if (!departmentData || departmentData.length === 0) return [];
    
    // Aggregate type data from all departments
    const typeCounts = {};
    departmentData.forEach(dept => {
      Object.entries(dept.by_type).forEach(([type, count]) => {
        typeCounts[type] = (typeCounts[type] || 0) + count;
      });
    });
    
    return Object.entries(typeCounts).map(([type, count]) => ({
      name: typeLabels[type] || type,
      value: count,
      color: statusColors[type] || "#EF4444" // red-500 as default
    }));
  };

  const prepareDepartmentChartData = () => {
    if (!departmentData || departmentData.length === 0) return [];
    
    return departmentData.map(dept => ({
      name: dept.department || "Sin departamento",
      value: dept.total
    }));
  };

  const prepareLocationChartData = () => {
    if (!locationData || locationData.length === 0) return [];
    
    return locationData.map(loc => ({
      name: loc.location || "Sin ubicación",
      value: loc.total
    }));
  };

  const prepareEdificioChartData = () => {
    if (!edificioData || edificioData.length === 0) return [];
    
    return edificioData.map(ed => ({
      name: ed.edificio || "Sin edificio",
      value: ed.total
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="bi-dashboard-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  // Chart components
  const StatusChart = () => (
    <div className="h-80">
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
    <div className="h-80">
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
          <Bar dataKey="value" name="Cantidad de Equipos">
            {prepareTypeChartData().map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || "#EF4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const DepartmentChart = () => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={prepareDepartmentChartData()}
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
          <Bar dataKey="value" name="Cantidad de Equipos" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const LocationChart = () => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={prepareLocationChartData()}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {prepareLocationChartData().map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, "Equipos"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const EdificioChart = () => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={prepareEdificioChartData()}
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
          <Bar dataKey="value" name="Cantidad de Equipos" fill="#8B5CF6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in" data-testid="bi-dashboard-container">
      {/* Header */}
      <div>
        <Button
          onClick={() => navigate("/dashboard")}
          data-testid="back-button"
          className="mb-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          ← Volver al Dashboard Principal
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              Análisis de Negocios
            </h1>
            <p className="text-gray-400">Inteligencia de datos y análisis avanzado</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          className="relative overflow-hidden rounded-2xl p-6 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <div className="relative z-10">
            <p className="text-gray-300 text-sm font-medium mb-2">Departamentos</p>
            <p className="text-4xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
              {departmentData.length}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full filter blur-3xl opacity-20"></div>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl p-6 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          <div className="relative z-10">
            <p className="text-gray-300 text-sm font-medium mb-2">Ubicaciones</p>
            <p className="text-4xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
              {locationData.length}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500 rounded-full filter blur-3xl opacity-20"></div>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl p-6 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(109, 40, 217, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}
        >
          <div className="relative z-10">
            <p className="text-gray-300 text-sm font-medium mb-2">Edificios</p>
            <p className="text-4xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
              {edificioData.length}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500 rounded-full filter blur-3xl opacity-20"></div>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl p-6 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(190, 24, 93, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(236, 72, 153, 0.3)'
          }}
        >
          <div className="relative z-10">
            <p className="text-gray-300 text-sm font-medium mb-2">Total Equipos</p>
            <p className="text-4xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
              {departmentData.reduce((sum, dept) => sum + dept.total, 0)}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500 rounded-full filter blur-3xl opacity-20"></div>
        </div>
      </div>

      {/* Status Distribution Section */}
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          background: 'rgba(26, 26, 27, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
            Distribución por Estado Operativo
          </h2>
          {/* Mini menu for view toggle */}
          <div className="flex space-x-2">
            <Button
              onClick={() => setStatusView('table')}
              className={`px-3 py-1 text-sm rounded-lg ${
                statusView === 'table' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Tabla
            </Button>
            <Button
              onClick={() => setStatusView('chart')}
              className={`px-3 py-1 text-sm rounded-lg ${
                statusView === 'chart' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Gráfica
            </Button>
          </div>
        </div>

        {statusView === 'table' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prepareStatusChartData().map((item, index) => (
              <div key={index} className="p-4 rounded-lg bg-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div>
                    <p className="text-gray-300 text-sm">{item.name}</p>
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <StatusChart />
        )}
      </div>

      {/* Type Distribution Section */}
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          background: 'rgba(26, 26, 27, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
            Distribución por Tipo de Equipo
          </h2>
          {/* Mini menu for view toggle */}
          <div className="flex space-x-2">
            <Button
              onClick={() => setTypeView('table')}
              className={`px-3 py-1 text-sm rounded-lg ${
                typeView === 'table' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Tabla
            </Button>
            <Button
              onClick={() => setTypeView('chart')}
              className={`px-3 py-1 text-sm rounded-lg ${
                typeView === 'chart' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Gráfica
            </Button>
          </div>
        </div>

        {typeView === 'table' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prepareTypeChartData().map((item, index) => (
              <div key={index} className="p-4 rounded-lg bg-gray-900/50">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div>
                    <p className="text-gray-300 text-sm">{item.name}</p>
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TypeChart />
        )}
      </div>

      {/* Equipment by Department */}
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          background: 'rgba(26, 26, 27, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
            Equipos por Departamento
          </h2>
          <span className="text-gray-400 text-sm">
            {departmentData.length} departamentos
          </span>
          {/* Mini menu for view toggle */}
          <div className="flex space-x-2">
            <Button
              onClick={() => setDepartmentView('table')}
              className={`px-3 py-1 text-sm rounded-lg ${
                departmentView === 'table' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Tabla
            </Button>
            <Button
              onClick={() => setDepartmentView('chart')}
              className={`px-3 py-1 text-sm rounded-lg ${
                departmentView === 'chart' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Gráfica
            </Button>
          </div>
        </div>

        {departmentView === 'table' ? (
          departmentData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay datos disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Departamento</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Total Equipos</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Por Estado</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Por Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentData.map((dept, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="py-4 px-4 text-white font-medium">{dept.department || "Sin departamento"}</td>
                      <td className="py-4 px-4">
                        <span className="text-2xl font-bold text-white">{dept.total}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(dept.by_status).map(([status, count]) => (
                            <div key={status} className="flex items-center bg-gray-900/50 rounded-full px-3 py-1">
                              <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: statusColors[status] || '#6B7280' }}></div>
                              <span className="text-xs text-gray-300">{statusLabels[status] || status}: </span>
                              <span className="text-xs font-bold text-white ml-1">{count}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(dept.by_type).map(([type, count]) => (
                            <div key={type} className="bg-gray-900/50 rounded-full px-3 py-1">
                              <span className="text-xs text-gray-300">{typeLabels[type] || type}: </span>
                              <span className="text-xs font-bold text-white">{count}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <DepartmentChart />
        )}
      </div>

      {/* Equipment by Location */}
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          background: 'rgba(26, 26, 27, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
            Equipos por Ubicación
          </h2>
          <span className="text-gray-400 text-sm">
            {locationData.length} ubicaciones
          </span>
          {/* Mini menu for view toggle */}
          <div className="flex space-x-2">
            <Button
              onClick={() => setLocationView('table')}
              className={`px-3 py-1 text-sm rounded-lg ${
                locationView === 'table' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Tabla
            </Button>
            <Button
              onClick={() => setLocationView('chart')}
              className={`px-3 py-1 text-sm rounded-lg ${
                locationView === 'chart' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Gráfica
            </Button>
          </div>
        </div>

        {locationView === 'table' ? (
          locationData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay datos disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Ubicación</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Total Equipos</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Por Estado</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Por Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {locationData.map((loc, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="py-4 px-4 text-white font-medium">{loc.location || "Sin ubicación"}</td>
                      <td className="py-4 px-4">
                        <span className="text-2xl font-bold text-white">{loc.total}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(loc.by_status).map(([status, count]) => (
                            <div key={status} className="flex items-center bg-gray-900/50 rounded-full px-3 py-1">
                              <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: statusColors[status] || '#6B7280' }}></div>
                              <span className="text-xs text-gray-300">{statusLabels[status] || status}: </span>
                              <span className="text-xs font-bold text-white ml-1">{count}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(loc.by_type).map(([type, count]) => (
                            <div key={type} className="bg-gray-900/50 rounded-full px-3 py-1">
                              <span className="text-xs text-gray-300">{typeLabels[type] || type}: </span>
                              <span className="text-xs font-bold text-white">{count}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <LocationChart />
        )}
      </div>

      {/* Equipment by Edificio */}
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          background: 'rgba(26, 26, 27, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
            Equipos por Edificio
          </h2>
          <span className="text-gray-400 text-sm">
            {edificioData.length} edificios
          </span>
          {/* Mini menu for view toggle */}
          <div className="flex space-x-2">
            <Button
              onClick={() => setEdificioView('table')}
              className={`px-3 py-1 text-sm rounded-lg ${
                edificioView === 'table' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Tabla
            </Button>
            <Button
              onClick={() => setEdificioView('chart')}
              className={`px-3 py-1 text-sm rounded-lg ${
                edificioView === 'chart' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Gráfica
            </Button>
          </div>
        </div>

        {edificioView === 'table' ? (
          edificioData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay datos disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Edificio</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Total Equipos</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Por Estado</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Por Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {edificioData.map((ed, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="py-4 px-4 text-white font-medium">{ed.edificio || "Sin edificio"}</td>
                      <td className="py-4 px-4">
                        <span className="text-2xl font-bold text-white">{ed.total}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(ed.by_status || {}).map(([status, count]) => (
                            <div key={status} className="flex items-center bg-gray-900/50 rounded-full px-3 py-1">
                              <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: statusColors[status] || '#6B7280' }}></div>
                              <span className="text-xs text-gray-300">{statusLabels[status] || status}: </span>
                              <span className="text-xs font-bold text-white ml-1">{count}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(ed.by_type || {}).map(([type, count]) => (
                            <div key={type} className="bg-gray-900/50 rounded-full px-3 py-1">
                              <span className="text-xs text-gray-300">{typeLabels[type] || type}: </span>
                              <span className="text-xs font-bold text-white">{count}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <EdificioChart />
        )}
      </div>
    </div>
  );
}