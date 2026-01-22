import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DepartmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion_id: "",
    numero_trabajadores: 0,
    trabajadores: []
  });
  const [workerForm, setWorkerForm] = useState({
    nombre_completo: "",
    puesto: "",
    numero_trabajador: ""
  });

  useEffect(() => {
    fetchLocations();
    if (isEdit) {
      fetchDepartment();
    }
  }, [id]);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(response.data);
    } catch (error) {
      toast.error("Error al cargar ubicaciones");
    }
  };

  const fetchDepartment = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Find the specific department
      const department = response.data.find(dept => dept.id === id);
      if (department) {
        setFormData({
          nombre: department.nombre,
          ubicacion_id: department.ubicacion_id,
          numero_trabajadores: department.numero_trabajadores,
          trabajadores: department.trabajadores || []
        });
      } else {
        toast.error("Departamento no encontrado");
        navigate("/departments");
      }
    } catch (error) {
      toast.error("Error al cargar departamento");
      navigate("/departments");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate that we have the required number of workers
    if (formData.trabajadores.length !== formData.numero_trabajadores) {
      toast.error(`Debes registrar exactamente ${formData.numero_trabajadores} trabajadores`);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const dataToSend = {
        ...formData,
        numero_trabajadores: parseInt(formData.numero_trabajadores)
      };

      if (isEdit) {
        await axios.put(`${API}/departments/${id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Departamento actualizado");
      } else {
        await axios.post(`${API}/departments`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Departamento creado");
      }
      navigate("/departments");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al guardar departamento");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWorkerFormChange = (field, value) => {
    setWorkerForm((prev) => ({ ...prev, [field]: value }));
  };

  const addWorker = () => {
    if (!workerForm.nombre_completo || !workerForm.puesto || !workerForm.numero_trabajador) {
      toast.error("Todos los campos del trabajador son obligatorios");
      return;
    }

    if (formData.trabajadores.length >= formData.numero_trabajadores) {
      toast.error(`Ya has agregado el número máximo de trabajadores (${formData.numero_trabajadores})`);
      return;
    }

    const newWorker = { ...workerForm };
    setFormData(prev => ({
      ...prev,
      trabajadores: [...prev.trabajadores, newWorker]
    }));

    // Clear the worker form
    setWorkerForm({
      nombre_completo: "",
      puesto: "",
      numero_trabajador: ""
    });

    toast.success("Trabajador agregado");
  };

  const removeWorker = (index) => {
    setFormData(prev => ({
      ...prev,
      trabajadores: prev.trabajadores.filter((_, i) => i !== index)
    }));
  };

  const formatLocation = (location) => {
    return `${location.edificio}, Piso ${location.piso}, ${location.salon_aula}`;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="department-form-container">
      {/* Header */}
      <div>
        <Button
          onClick={() => navigate("/departments")}
          data-testid="back-button"
          className="mb-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          ← Volver
        </Button>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          {isEdit ? "Editar Departamento" : "Nuevo Departamento"}
        </h1>
        <p className="text-gray-400">{isEdit ? "Actualiza la información del departamento" : "Agrega un nuevo departamento"}</p>
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
            {/* Nombre del Departamento */}
            <div className="md:col-span-2">
              <Label htmlFor="nombre" className="text-gray-300 text-sm font-medium mb-2 block">Nombre del Departamento *</Label>
              <Input
                id="nombre"
                data-testid="nombre-input"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="Departamento de Sistemas, Recursos Humanos, etc."
              />
            </div>

            {/* Ubicación */}
            <div>
              <Label htmlFor="ubicacion_id" className="text-gray-300 text-sm font-medium mb-2 block">Ubicación *</Label>
              <Select value={formData.ubicacion_id} onValueChange={(value) => handleChange("ubicacion_id", value)}>
                <SelectTrigger data-testid="ubicacion-select" className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="Selecciona una ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {formatLocation(location)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {locations.length === 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  No hay ubicaciones disponibles. Agrega ubicaciones primero.
                </div>
              )}
            </div>

            {/* Número de Trabajadores */}
            <div>
              <Label htmlFor="numero_trabajadores" className="text-gray-300 text-sm font-medium mb-2 block">Número de Trabajadores *</Label>
              <Input
                id="numero_trabajadores"
                type="number"
                min="0"
                data-testid="numero-trabajadores-input"
                value={formData.numero_trabajadores}
                onChange={(e) => handleChange("numero_trabajadores", parseInt(e.target.value) || 0)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="5"
              />
            </div>

            {/* Worker Registration Section */}
            {formData.numero_trabajadores > 0 && (
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Registro de Trabajadores</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Debes registrar exactamente {formData.numero_trabajadores} trabajador{formData.numero_trabajadores !== 1 ? 'es' : ''}.
                  Actualmente has registrado {formData.trabajadores.length}.
                </p>
                
                {/* Worker Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 rounded-lg bg-gray-900/30">
                  <div>
                    <Label htmlFor="nombre_completo" className="text-gray-300 text-sm font-medium mb-2 block">Nombre Completo *</Label>
                    <Input
                      id="nombre_completo"
                      value={workerForm.nombre_completo}
                      onChange={(e) => handleWorkerFormChange("nombre_completo", e.target.value)}
                      className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                      placeholder="Juan Pérez García"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="puesto" className="text-gray-300 text-sm font-medium mb-2 block">Puesto *</Label>
                    <Input
                      id="puesto"
                      value={workerForm.puesto}
                      onChange={(e) => handleWorkerFormChange("puesto", e.target.value)}
                      className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                      placeholder="Analista de Sistemas"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="numero_trabajador" className="text-gray-300 text-sm font-medium mb-2 block">Número de Trabajador *</Label>
                    <Input
                      id="numero_trabajador"
                      value={workerForm.numero_trabajador}
                      onChange={(e) => handleWorkerFormChange("numero_trabajador", e.target.value)}
                      className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                      placeholder="EMP-001"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={addWorker}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 rounded-lg"
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
                
                {/* Workers List */}
                {formData.trabajadores.length > 0 && (
                  <div className="border border-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-900/50 border-b border-gray-700 font-medium">
                      <div>Nombre Completo</div>
                      <div>Puesto</div>
                      <div>Número de Trabajador</div>
                      <div>Acciones</div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {formData.trabajadores.map((worker, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b border-gray-800 last:border-b-0">
                          <div className="text-white">{worker.nombre_completo}</div>
                          <div className="text-gray-300">{worker.puesto}</div>
                          <div className="text-gray-300">{worker.numero_trabajador}</div>
                          <div>
                            <Button
                              type="button"
                              onClick={() => removeWorker(index)}
                              size="sm"
                              className="bg-red-700 hover:bg-red-600 text-white"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex gap-4">
            <Button
              type="submit"
              data-testid="submit-button"
              disabled={loading || (formData.numero_trabajadores > 0 && formData.trabajadores.length !== formData.numero_trabajadores)}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : (isEdit ? "Actualizar Departamento" : "Crear Departamento")}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/departments")}
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