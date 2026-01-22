import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, ArrowLeft, Save } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function EdificioForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: ""
  });

  useEffect(() => {
    if (id) {
      fetchEdificio();
    }
  }, [id]);

  const fetchEdificio = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/edificios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const edificio = response.data.find(e => e.id === id);
      if (edificio) {
        setFormData({
          nombre: edificio.nombre,
          direccion: edificio.direccion || ""
        });
      }
    } catch (error) {
      toast.error("Error al cargar el edificio");
      console.error("Error fetching edificio:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error("El nombre del edificio es requerido");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (id) {
        // Update existing edificio
        await axios.put(`${API}/edificios/${id}`, formData, config);
        toast.success("Edificio actualizado exitosamente");
      } else {
        // Create new edificio
        await axios.post(`${API}/edificios`, formData, config);
        toast.success("Edificio creado exitosamente");
      }

      navigate("/edificios");
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Error al guardar el edificio";
      toast.error(errorMessage);
      console.error("Error saving edificio:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/edificios")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-red-500" />
              <span>{id ? "Editar Edificio" : "Nuevo Edificio"}</span>
            </h1>
            <p className="text-gray-400 mt-1">
              {id ? "Modifica la información del edificio" : "Agrega un nuevo edificio al sistema"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="p-8 bg-gray-900/50 backdrop-blur-16px border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-white">
                Nombre del Edificio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Edificio A"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="direccion" className="text-white">
                Dirección
              </Label>
              <Input
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej: Av. Universidad #123"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/edificios")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {id ? "Actualizar" : "Guardar"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
