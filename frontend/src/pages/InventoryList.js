import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function InventoryList() {
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchEquipment();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [equipment, search, filterType, filterStatus, filterLocation, filterDepartment]);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/equipment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipment(response.data);
      setFilteredEquipment(response.data);
    } catch (error) {
      toast.error("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  };

  // Get unique locations and departments for filter dropdowns
  const getUniqueLocations = () => {
    const locations = equipment.map(eq => eq.ubicacion);
    return [...new Set(locations)].filter(location => location && location.trim() !== '');
  };

  const getUniqueDepartments = () => {
    const departments = equipment.map(eq => eq.departamento);
    return [...new Set(departments)].filter(department => department && department.trim() !== '');
  };

  const applyFilters = () => {
    let filtered = [...equipment];

    if (search) {
      filtered = filtered.filter(
        (eq) =>
          eq.numero_serie.toLowerCase().includes(search.toLowerCase()) ||
          eq.marca.toLowerCase().includes(search.toLowerCase()) ||
          eq.modelo.toLowerCase().includes(search.toLowerCase()) ||
          eq.resguardante.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((eq) => eq.tipo_bien === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((eq) => eq.estado_operativo === filterStatus);
    }

    if (filterLocation !== "all") {
      filtered = filtered.filter((eq) => eq.ubicacion.toLowerCase().includes(filterLocation.toLowerCase()));
    }

    if (filterDepartment !== "all") {
      filtered = filtered.filter((eq) => eq.departamento.toLowerCase().includes(filterDepartment.toLowerCase()));
    }

    setFilteredEquipment(filtered);
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/equipment/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventario.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Reporte ${format.toUpperCase()} descargado`);
    } catch (error) {
      toast.error("Error al exportar");
    }
  };

  const statusColors = {
    disponible: "bg-green-500/20 text-green-400 border-green-500/30",
    asignado: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    en_mantenimiento: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    dado_de_baja: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    en_resguardo: "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };

  const statusLabels = {
    disponible: "Disponible",
    asignado: "Asignado",
    en_mantenimiento: "En Mantenimiento",
    dado_de_baja: "Dado de Baja",
    en_resguardo: "En Resguardo"
  };

  const typeLabels = {
    computadora: "Computadora",
    periferico: "Periférico",
    componente_red: "Componente de Red",
    dispositivo_movil: "Dispositivo Móvil",
    insumo_critico: "Insumo Crítico"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="inventory-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>Inventario</h1>
          <p className="text-gray-400">Gestión de equipos informáticos</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => handleExport('excel')}
            data-testid="export-excel-button"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            📊 Excel
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            data-testid="export-pdf-button"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            📄 PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          background: 'rgba(26, 26, 27, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Input
              type="text"
              data-testid="search-input"
              placeholder="Buscar por serie, marca, modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
            />
          </div>
          <div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger data-testid="filter-type" className="bg-gray-900/50 border-gray-700 text-white">
                <SelectValue placeholder="Tipo de equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="computadora">Computadora</SelectItem>
                <SelectItem value="periferico">Periférico</SelectItem>
                <SelectItem value="componente_red">Componente de Red</SelectItem>
                <SelectItem value="dispositivo_movil">Dispositivo Móvil</SelectItem>
                <SelectItem value="insumo_critico">Insumo Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-testid="filter-status" className="bg-gray-900/50 border-gray-700 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="asignado">Asignado</SelectItem>
                <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
                <SelectItem value="dado_de_baja">Dado de Baja</SelectItem>
                <SelectItem value="en_resguardo">En Resguardo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger data-testid="filter-location" className="bg-gray-900/50 border-gray-700 text-white">
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {getUniqueLocations().map((location, index) => (
                  <SelectItem key={index} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger data-testid="filter-department" className="bg-gray-900/50 border-gray-700 text-white">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {getUniqueDepartments().map((department, index) => (
                  <SelectItem key={index} value={department}>{department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="equipment-grid">
        {filteredEquipment.map((eq) => (
          <div
            key={eq.id}
            data-testid={`equipment-card-${eq.id}`}
            onClick={() => {
              // Only allow editing for admin/superadmin users
              if (user && (user.role === "admin" || user.role === "superadmin")) {
                navigate(`/equipment/edit/${eq.id}`);
              } else {
                navigate(`/equipment/${eq.id}`);
              }
            }}
            className="rounded-2xl p-6 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(26, 26, 27, 0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                  {eq.marca} {eq.modelo}
                </h3>
                <p className="text-sm text-gray-400">{typeLabels[eq.tipo_bien]}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[eq.estado_operativo]}`}>
                {statusLabels[eq.estado_operativo]}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Serie:</span>
                <span className="text-white font-mono">{eq.numero_serie}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Resguardante:</span>
                <span className="text-white">{eq.resguardante}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Ubicación:</span>
                <span className="text-white">{eq.ubicacion}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12" data-testid="no-equipment">
          <p className="text-gray-400 text-lg">No se encontraron equipos</p>
        </div>
      )}
    </div>
  );
}