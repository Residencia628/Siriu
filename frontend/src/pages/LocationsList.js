import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LocationsList() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(response.data);
    } catch (error) {
      toast.error("Error al cargar ubicaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta ubicación?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/locations/${locationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Ubicación eliminada");
      fetchLocations(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar ubicación");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="locations-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="locations-list-container">
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
              Ubicaciones
            </h1>
            <p className="text-gray-400">Gestiona las ubicaciones disponibles para equipos</p>
          </div>
          {(user?.role === "admin" || user?.role === "superadmin") && (
            <Button
              onClick={() => navigate("/locations/new")}
              data-testid="add-location-button"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-lg"
            >
              ➕ Agregar Ubicación
            </Button>
          )}
        </div>
      </div>

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No hay ubicaciones registradas</div>
          {(user?.role === "admin" || user?.role === "superadmin") && (
            <Button
              onClick={() => navigate("/locations/new")}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Agregar primera ubicación
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div
              key={location.id}
              className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200"
              style={{
                background: 'rgba(26, 26, 27, 0.8)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              data-testid={`location-card-${location.id}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white" style={{ fontFamily: 'Space Grotesk' }}>
                  {location.edificio}
                </h3>
                {(user?.role === "admin" || user?.role === "superadmin") && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => navigate(`/locations/edit/${location.id}`)}
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      ✏️
                    </Button>
                    <Button
                      onClick={() => handleDelete(location.id)}
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
                  <span className="font-medium mr-2">Piso:</span>
                  <span>{location.piso}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="font-medium mr-2">Salón/Aula:</span>
                  <span>{location.salon_aula}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                ID: {location.id.substring(0, 8)}...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}