import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function EquipmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ubicacion: "",
    resguardante: "",
    departamento_id: "",
    tipo_bien: "computadora",
    numero_serie: "",
    numero_factura: "",
    numero_inventario: "",
    marca: "",
    modelo: "",
    fecha_adquisicion: "",
    estado_operativo: "disponible",
    observaciones: ""
  });
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tiposBien, setTiposBien] = useState([]);
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    fetchLocations();
    fetchDepartments();
    fetchTiposBien();
    fetchMarcas();
    if (isEdit) {
      fetchEquipment();
    }
  }, [id]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      // If there's an error fetching departments, we'll just use the text input
      console.log("No se pudieron cargar los departamentos");
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
      // If there's an error fetching locations, we'll just use the text input
      console.log("No se pudieron cargar las ubicaciones");
    }
  };

  const fetchTiposBien = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/tipos-bien`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTiposBien(response.data);
    } catch (error) {
      // If there's an error fetching tipos bien, we'll just use the text input
      console.log("No se pudieron cargar los tipos de bien");
    }
  };

  const fetchMarcas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/marcas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMarcas(response.data);
    } catch (error) {
      // If there's an error fetching marcas, we'll just use the text input
      console.log("No se pudieron cargar las marcas");
    }
  };

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/equipment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData(response.data);
    } catch (error) {
      toast.error("Error al cargar equipo");
      navigate("/inventory");
    }
  };

  const formatLocation = (location) => {
    return `${location.edificio}, Piso ${location.piso}, ${location.salon_aula}`;
  };

  const getLocationFromFormattedString = (formattedString) => {
    // This is for backward compatibility with existing data
    return formattedString;
  };

  const getFormattedLocations = () => {
    return locations.map(location => ({
      id: location.id,
      formatted: formatLocation(location)
    }));
  };

  const getDepartmentWorkers = (departmentId) => {
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.trabajadores : [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Prepare data for submission
    const submissionData = { ...formData };
    
    // If we have a department_id, we need to get the department name for backward compatibility
    if (formData.departamento_id) {
      const department = departments.find(dept => dept.id === formData.departamento_id);
      if (department) {
        submissionData.departamento = department.nombre;
      }
    }

    try {
      const token = localStorage.getItem("token");
      if (isEdit) {
        await axios.put(`${API}/equipment/${id}`, submissionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Equipo actualizado");
      } else {
        await axios.post(`${API}/equipment`, submissionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Equipo creado");
      }
      navigate("/inventory");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al guardar equipo");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="equipment-form-container">
      {/* Header */}
      <div>
        <Button
          onClick={() => navigate("/inventory")}
          data-testid="back-button"
          className="mb-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          ← Volver
        </Button>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          {isEdit ? "Editar Equipo" : "Nuevo Equipo"}
        </h1>
        <p className="text-gray-400">{isEdit ? "Actualiza la información del equipo" : "Agrega un nuevo equipo al inventario"}</p>
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
            {/* Tipo de Bien */}
            <div>
              <Label htmlFor="tipo_bien" className="text-gray-300 text-sm font-medium mb-2 block">Tipo de Bien *</Label>
              {tiposBien.length > 0 ? (
                <Select value={formData.tipo_bien} onValueChange={(value) => handleChange("tipo_bien", value)}>
                  <SelectTrigger data-testid="tipo-bien-select" className="bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposBien.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.nombre}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="tipo_bien"
                  data-testid="tipo-bien-input"
                  value={formData.tipo_bien}
                  onChange={(e) => handleChange("tipo_bien", e.target.value)}
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                  placeholder="Computadora, Periférico, etc."
                />
              )}
              <div className="mt-2 text-xs text-gray-500">
                {tiposBien.length > 0 
                  ? "Selecciona un tipo de bien existente" 
                  : "Agrega tipos de bien en el menú 'Tipos de Bien' para normalizar este campo"}
              </div>
              {tiposBien.length === 0 && (
                <div className="mt-2">
                  <Button 
                    type="button"
                    onClick={() => navigate("/tipos-bien")}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                  >
                    Ir a Tipos de Bien
                  </Button>
                </div>
              )}
            </div>

            {/* Estado Operativo */}
            <div>
              <Label htmlFor="estado_operativo" className="text-gray-300 text-sm font-medium mb-2 block">Estado Operativo *</Label>
              <Select value={formData.estado_operativo} onValueChange={(value) => handleChange("estado_operativo", value)}>
                <SelectTrigger data-testid="estado-select" className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="asignado">Asignado</SelectItem>
                  <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
                  <SelectItem value="dado_de_baja">Dado de Baja</SelectItem>
                  <SelectItem value="en_resguardo">En Resguardo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Número de Serie */}
            <div>
              <Label htmlFor="numero_serie" className="text-gray-300 text-sm font-medium mb-2 block">Número de Serie *</Label>
              <Input
                id="numero_serie"
                data-testid="numero-serie-input"
                value={formData.numero_serie}
                onChange={(e) => handleChange("numero_serie", e.target.value)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="ABC123456"
              />
            </div>

            {/* Número de Factura */}
            <div>
              <Label htmlFor="numero_factura" className="text-gray-300 text-sm font-medium mb-2 block">Número de Factura</Label>
              <Input
                id="numero_factura"
                data-testid="numero-factura-input"
                value={formData.numero_factura}
                onChange={(e) => handleChange("numero_factura", e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="FAC-2024-001"
              />
            </div>

            {/* Número de Inventario */}
            <div>
              <Label htmlFor="numero_inventario" className="text-gray-300 text-sm font-medium mb-2 block">Número de Inventario</Label>
              <Input
                id="numero_inventario"
                data-testid="numero-inventario-input"
                value={formData.numero_inventario}
                onChange={(e) => handleChange("numero_inventario", e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="INV-2024-001"
              />
            </div>

            {/* Marca */}
            <div>
              <Label htmlFor="marca" className="text-gray-300 text-sm font-medium mb-2 block">Marca *</Label>
              {marcas.length > 0 ? (
                <Select value={formData.marca} onValueChange={(value) => handleChange("marca", value)}>
                  <SelectTrigger data-testid="marca-select" className="bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {marcas.map((marca) => (
                      <SelectItem key={marca.id} value={marca.nombre}>
                        {marca.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="marca"
                  data-testid="marca-input"
                  value={formData.marca}
                  onChange={(e) => handleChange("marca", e.target.value)}
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                  placeholder="Dell, HP, Lenovo..."
                />
              )}
              <div className="mt-2 text-xs text-gray-500">
                {marcas.length > 0 
                  ? "Selecciona una marca existente" 
                  : "Agrega marcas en el menú 'Marcas' para normalizar este campo"}
              </div>
              {marcas.length === 0 && (
                <div className="mt-2">
                  <Button 
                    type="button"
                    onClick={() => navigate("/marcas")}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                  >
                    Ir a Marcas
                  </Button>
                </div>
              )}
            </div>

            {/* Modelo */}
            <div>
              <Label htmlFor="modelo" className="text-gray-300 text-sm font-medium mb-2 block">Modelo *</Label>
              <Input
                id="modelo"
                data-testid="modelo-input"
                value={formData.modelo}
                onChange={(e) => handleChange("modelo", e.target.value)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="OptiPlex 7090"
              />
            </div>

            {/* Fecha de Adquisición */}
            <div>
              <Label htmlFor="fecha_adquisicion" className="text-gray-300 text-sm font-medium mb-2 block">Fecha de Adquisición *</Label>
              <Input
                id="fecha_adquisicion"
                type="date"
                data-testid="fecha-input"
                value={formData.fecha_adquisicion}
                onChange={(e) => handleChange("fecha_adquisicion", e.target.value)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
              />
            </div>

            {/* Ubicación */}
            <div>
              <Label htmlFor="ubicacion" className="text-gray-300 text-sm font-medium mb-2 block">Ubicación *</Label>
              {locations.length > 0 ? (
                <Select value={formData.ubicacion} onValueChange={(value) => handleChange("ubicacion", value)}>
                  <SelectTrigger data-testid="ubicacion-select" className="bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Selecciona una ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFormattedLocations().map((loc) => (
                      <SelectItem key={loc.id} value={loc.formatted}>
                        {loc.formatted}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="ubicacion"
                  data-testid="ubicacion-input"
                  value={formData.ubicacion}
                  onChange={(e) => handleChange("ubicacion", e.target.value)}
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                  placeholder="Edificio A, Piso 2, Aula 201"
                />
              )}
              <div className="mt-2 text-xs text-gray-500">
                {locations.length > 0 
                  ? "Selecciona una ubicación existente" 
                  : "Agrega ubicaciones en el menú 'Ubicaciones' para normalizar este campo"}
              </div>
              {locations.length === 0 && (
                <div className="mt-2">
                  <Button 
                    type="button"
                    onClick={() => navigate("/locations")}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                  >
                    Ir a Ubicaciones
                  </Button>
                </div>
              )}
            </div>

            {/* Resguardante */}
            <div>
              <Label htmlFor="resguardante" className="text-gray-300 text-sm font-medium mb-2 block">Resguardante *</Label>
              {formData.departamento_id && getDepartmentWorkers(formData.departamento_id).length > 0 ? (
                <Select value={formData.resguardante} onValueChange={(value) => handleChange("resguardante", value)}>
                  <SelectTrigger data-testid="resguardante-select" className="bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Selecciona un resguardante" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDepartmentWorkers(formData.departamento_id).map((worker, index) => (
                      <SelectItem key={index} value={worker.nombre_completo}>
                        {worker.nombre_completo} ({worker.puesto})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="resguardante"
                  data-testid="resguardante-input"
                  value={formData.resguardante}
                  onChange={(e) => handleChange("resguardante", e.target.value)}
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                  placeholder="Nombre del responsable"
                />
              )}
              <div className="mt-2 text-xs text-gray-500">
                {formData.departamento_id && getDepartmentWorkers(formData.departamento_id).length > 0
                  ? "Selecciona un resguardante del departamento" 
                  : "Ingresa manualmente el nombre del resguardante"}
              </div>
            </div>

            {/* Departamento */}
            <div>
              <Label htmlFor="departamento_id" className="text-gray-300 text-sm font-medium mb-2 block">Departamento *</Label>
              {departments.length > 0 ? (
                <Select value={formData.departamento_id} onValueChange={(value) => {
                  handleChange("departamento_id", value);
                  // Clear resguardante when department changes
                  handleChange("resguardante", "");
                }}>
                  <SelectTrigger data-testid="departamento-select" className="bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="departamento_id"
                  data-testid="departamento-input"
                  value={formData.departamento_id}
                  onChange={(e) => handleChange("departamento_id", e.target.value)}
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                  placeholder="Sistemas, Administración, etc."
                />
              )}
              <div className="mt-2 text-xs text-gray-500">
                {departments.length > 0 
                  ? "Selecciona un departamento existente" 
                  : "Agrega departamentos en el menú 'Departamentos' para normalizar este campo"}
              </div>
              {departments.length > 0 && (
                <div className="mt-2">
                  <Button 
                    type="button"
                    onClick={() => navigate("/departments")}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                  >
                    Ir a Departamentos
                  </Button>
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <Label htmlFor="observaciones" className="text-gray-300 text-sm font-medium mb-2 block">Observaciones</Label>
              <Textarea
                id="observaciones"
                data-testid="observaciones-input"
                value={formData.observaciones}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                rows={4}
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg resize-none"
                placeholder="Notas adicionales sobre el equipo..."
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
              {loading ? "Guardando..." : (isEdit ? "Actualizar Equipo" : "Crear Equipo")}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/inventory")}
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