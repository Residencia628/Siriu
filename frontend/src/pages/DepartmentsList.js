import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DepartmentsList() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDepartments();
    fetchLocations();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      toast.error("Error al cargar departamentos");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(response.data);
    } catch (error) {
      // If locations can't be fetched, we'll just use IDs
      console.log("No se pudieron cargar las ubicaciones");
    }
  };

  const handleDelete = async (departmentId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este departamento?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/departments/${departmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Departamento eliminado");
      fetchDepartments(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar departamento");
    }
  };

  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? `${location.edificio}, Piso ${location.piso}, ${location.salon_aula}` : locationId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="departments-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="departments-list-container">
      {/* Header */}
      <div>
        <Button
          onClick={() => navigate("/dashboard")}
          data-testid="back-button"
          className="mb-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          ← Volver
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              Departamentos
            </h1>
            <p className="text-gray-400">Gestiona los departamentos y sus trabajadores</p>
          </div>
          {(user?.role === "admin" || user?.role === "superadmin") && (
            <Button
              onClick={() => navigate("/departments/new")}
              data-testid="add-department-button"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-lg"
            >
              ➕ Agregar Departamento
            </Button>
          )}
        </div>
      </div>

      {/* Departments Grid */}
      {departments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No hay departamentos registrados</div>
          {(user?.role === "admin" || user?.role === "superadmin") && (
            <Button
              onClick={() => navigate("/departments/new")}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Agregar primer departamento
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <div
              key={department.id}
              className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200"
              style={{
                background: 'rgba(26, 26, 27, 0.8)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              data-testid={`department-card-${department.id}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white" style={{ fontFamily: 'Space Grotesk' }}>
                  {department.nombre}
                </h3>
                {(user?.role === "admin" || user?.role === "superadmin") && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => navigate(`/departments/edit/${department.id}`)}
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      ✏️
                    </Button>
                    <Button
                      onClick={() => handleDelete(department.id)}
                      size="sm"
                      className="bg-red-700 hover:bg-red-600 text-white"
                    >
                      🗑️
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <span className="font-medium mr-2">Ubicación:</span>
                  <span className="text-sm">{getLocationName(department.ubicacion_id)}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="font-medium mr-2">Trabajadores:</span>
                  <span>{department.numero_trabajadores}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="font-medium mr-2">Registrados:</span>
                  <span>{department.trabajadores?.length || 0}</span>
                </div>
              </div>
              
              {department.trabajadores && department.trabajadores.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Trabajadores</h4>
                  <div className="max-h-32 overflow-y-auto">
                    {department.trabajadores.slice(0, 5).map((worker, index) => (
                      <div key={index} className="text-xs text-gray-500 flex justify-between">
                        <span>{worker.nombre_completo}</span>
                        <span>{worker.puesto}</span>
                      </div>
                    ))}
                    {department.trabajadores.length > 5 && (
                      <div className="text-xs text-gray-500">+{department.trabajadores.length - 5} más</div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                ID: {department.id.substring(0, 8)}...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}