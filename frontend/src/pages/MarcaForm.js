import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MarcaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: ""
  });

  useEffect(() => {
    if (isEdit) {
      fetchMarca();
    }
  }, [id]);

  const fetchMarca = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/marcas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Find the specific marca
      const marca = response.data.find(m => m.id === id);
      if (marca) {
        setFormData({
          nombre: marca.nombre
        });
      } else {
        toast.error("Marca no encontrada");
        navigate("/marcas");
      }
    } catch (error) {
      toast.error("Error al cargar marca");
      navigate("/marcas");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (isEdit) {
        await axios.put(`${API}/marcas/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Marca actualizada");
      } else {
        await axios.post(`${API}/marcas`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Marca creada");
      }
      navigate("/marcas");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al guardar marca");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="marca-form-container">
      {/* Header */}
      <div>
        <Button
          onClick={() => navigate("/marcas")}
          data-testid="back-button"
          className="mb-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          ← Volver
        </Button>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          {isEdit ? "Editar Marca" : "Nueva Marca"}
        </h1>
        <p className="text-gray-400">{isEdit ? "Actualiza la información de la marca" : "Agrega una nueva marca"}</p>
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
            {/* Nombre */}
            <div className="md:col-span-2">
              <Label htmlFor="nombre" className="text-gray-300 text-sm font-medium mb-2 block">Nombre *</Label>
              <Input
                id="nombre"
                data-testid="nombre-input"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="Dell, HP, Lenovo, Apple, etc."
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
              {loading ? "Guardando..." : (isEdit ? "Actualizar Marca" : "Crear Marca")}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/marcas")}
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