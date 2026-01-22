import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LocationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [edificios, setEdificios] = useState([]);
  const [formData, setFormData] = useState({
    edificio: "",
    piso: "",
    salon_aula: ""
  });

  useEffect(() => {
    fetchEdificios();
    if (isEdit) {
      fetchLocation();
    }
  }, [id]);

  const fetchEdificios = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/edificios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEdificios(response.data);
    } catch (error) {
      console.error("Error fetching edificios:", error);
      toast.error("Error al cargar edificios");
    }
  };

  const fetchLocation = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Find the specific location
      const location = response.data.find(loc => loc.id === id);
      if (location) {
        setFormData({
          edificio: location.edificio,
          piso: location.piso,
          salon_aula: location.salon_aula
        });
      } else {
        toast.error("Ubicación no encontrada");
        navigate("/locations");
      }
    } catch (error) {
      toast.error("Error al cargar ubicación");
      navigate("/locations");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (isEdit) {
        await axios.put(`${API}/locations/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Ubicación actualizada");
      } else {
        await axios.post(`${API}/locations`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Ubicación creada");
      }
      navigate("/locations");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al guardar ubicación");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="location-form-container">
      {/* Header */}
      <div>
        <Button
          onClick={() => navigate("/locations")}
          data-testid="back-button"
          className="mb-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          ← Volver
        </Button>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          {isEdit ? "Editar Ubicación" : "Nueva Ubicación"}
        </h1>
        <p className="text-gray-400">{isEdit ? "Actualiza la información de la ubicación" : "Agrega una nueva ubicación"}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          className="rounded-2xl p-6 shadow-lg"
          style={{
            background: 'rgba(26, 26, 27, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Edificio */}
            <div className="md:col-span-2">
              <Label htmlFor="edificio" className="text-gray-300 text-sm font-medium mb-2 block">Edificio *</Label>
              <Select
                value={formData.edificio}
                onValueChange={(value) => handleChange("edificio", value)}
                required
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white focus:border-red-600 rounded-lg">
                  <SelectValue placeholder="Selecciona un edificio" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {edificios.length === 0 ? (
                    <SelectItem value="none" disabled className="text-gray-400">
                      No hay edificios disponibles
                    </SelectItem>
                  ) : (
                    edificios.map((edificio) => (
                      <SelectItem 
                        key={edificio.id} 
                        value={edificio.nombre}
                        className="text-white hover:bg-gray-800"
                      >
                        {edificio.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {edificios.length === 0 && (
                <p className="text-sm text-yellow-500 mt-2">
                  ⚠️ No hay edificios registrados. <a href="/edificios/new" className="underline hover:text-yellow-400">Crear uno ahora</a>
                </p>
              )}
            </div>

            {/* Piso */}
            <div>
              <Label htmlFor="piso" className="text-gray-300 text-sm font-medium mb-2 block">Piso *</Label>
              <Input
                id="piso"
                data-testid="piso-input"
                value={formData.piso}
                onChange={(e) => handleChange("piso", e.target.value)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="1, 2, 3, etc."
              />
            </div>

            {/* Salón o Aula */}
            <div>
              <Label htmlFor="salon_aula" className="text-gray-300 text-sm font-medium mb-2 block">Salón o Aula *</Label>
              <Input
                id="salon_aula"
                data-testid="salon-aula-input"
                value={formData.salon_aula}
                onChange={(e) => handleChange("salon_aula", e.target.value)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="Aula 101, Laboratorio 2, etc."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex gap-4">
            <Button
              type="submit"
              data-testid="submit-button"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : (isEdit ? "Actualizar Ubicación" : "Crear Ubicación")}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/locations")}
              className="px-8 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}