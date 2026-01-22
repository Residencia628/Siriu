import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchEquipment();
    fetchHistory();
  }, [id]);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/equipment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipment(response.data);
    } catch (error) {
      toast.error("Error al cargar equipo");
      navigate("/inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data);
    } catch (error) {
      console.error("Error al cargar historial");
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/equipment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Equipo eliminado");
      navigate("/inventory");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar equipo");
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

  const actionLabels = {
    created: "Creado",
    updated: "Actualizado",
    deleted: "Eliminado"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!equipment) return null;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="equipment-detail-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            onClick={() => navigate("/inventory")}
            data-testid="back-button"
            className="mb-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            ← Volver
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            {equipment.marca} {equipment.modelo}
          </h1>
          <p className="text-gray-400">{typeLabels[equipment.tipo_bien]}</p>
        </div>
        {user && (user.role === "admin" || user.role === "superadmin") && (
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(`/equipment/edit/${id}`)}
              data-testid="edit-button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg"
            >
              ✏️ Editar
            </Button>
            {user.role === "superadmin" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button data-testid="delete-button" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-lg">
                    🗑️ Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El equipo será eliminado permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} data-testid="confirm-delete">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

      {/* Equipment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 rounded-2xl p-6 shadow-lg"
          style={{
            background: 'rgba(26, 26, 27, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h2 className="text-2xl font-semibold text-white mb-6" style={{ fontFamily: 'Space Grotesk' }}>Información del Equipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Número de Serie</p>
              <p className="text-white font-mono" data-testid="equipment-serial">{equipment.numero_serie}</p>
            </div>
            {equipment.numero_factura && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Número de Factura</p>
                <p className="text-white font-mono">{equipment.numero_factura}</p>
              </div>
            )}
            {equipment.numero_inventario && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Número de Inventario</p>
                <p className="text-white font-mono">{equipment.numero_inventario}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-sm mb-1">Estado</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[equipment.estado_operativo]}`} data-testid="equipment-status">
                {statusLabels[equipment.estado_operativo]}
              </span>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Marca</p>
              <p className="text-white">{equipment.marca}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Modelo</p>
              <p className="text-white">{equipment.modelo}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Ubicación</p>
              <p className="text-white" data-testid="equipment-location">{equipment.ubicacion}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Resguardante</p>
              <p className="text-white" data-testid="equipment-guardian">{equipment.resguardante}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Departamento</p>
              <p className="text-white">{equipment.departamento}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Fecha de Adquisición</p>
              <p className="text-white">{equipment.fecha_adquisicion}</p>
            </div>
            {equipment.observaciones && (
              <div className="md:col-span-2">
                <p className="text-gray-400 text-sm mb-1">Observaciones</p>
                <p className="text-white" data-testid="equipment-notes">{equipment.observaciones}</p>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div
          className="rounded-2xl p-6 shadow-lg"
          style={{
            background: 'rgba(26, 26, 27, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h2 className="text-2xl font-semibold text-white mb-6" style={{ fontFamily: 'Space Grotesk' }}>Metadatos</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">ID</p>
              <p className="text-white text-xs font-mono break-all">{equipment.id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Creado por</p>
              <p className="text-white text-sm">{equipment.created_by}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Fecha de creación</p>
              <p className="text-white text-sm">{new Date(equipment.created_at).toLocaleString('es-ES')}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Última actualización</p>
              <p className="text-white text-sm">{new Date(equipment.updated_at).toLocaleString('es-ES')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          background: 'rgba(26, 26, 27, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <h2 className="text-2xl font-semibold text-white mb-6" style={{ fontFamily: 'Space Grotesk' }}>Historial de Cambios</h2>
        {history.length === 0 ? (
          <p className="text-gray-400">No hay historial disponible</p>
        ) : (
          <div className="space-y-4" data-testid="history-list">
            {history.map((entry) => (
              <div key={entry.id} className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    entry.action === 'created' ? 'bg-green-500/20 text-green-400' :
                    entry.action === 'updated' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {actionLabels[entry.action]}
                  </span>
                  <span className="text-gray-400 text-xs">{new Date(entry.timestamp).toLocaleString('es-ES')}</span>
                </div>
                <p className="text-sm text-gray-300">Por: {entry.changed_by}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}