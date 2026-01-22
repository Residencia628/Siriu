import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Building2, Plus, Search, Pencil, Trash2, MapPin } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function EdificiosList() {
  const navigate = useNavigate();
  const [edificios, setEdificios] = useState([]);
  const [filteredEdificios, setFilteredEdificios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [edificioToDelete, setEdificioToDelete] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchEdificios();
  }, []);

  useEffect(() => {
    filterEdificios();
  }, [searchTerm, edificios]);

  const fetchEdificios = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/edificios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEdificios(response.data);
      setFilteredEdificios(response.data);
      setLoading(false);
    } catch (error) {
      toast.error("Error al cargar edificios");
      console.error("Error fetching edificios:", error);
      setLoading(false);
    }
  };

  const filterEdificios = () => {
    if (!searchTerm.trim()) {
      setFilteredEdificios(edificios);
      return;
    }

    const filtered = edificios.filter(edificio =>
      edificio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (edificio.direccion && edificio.direccion.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredEdificios(filtered);
  };

  const handleDelete = async () => {
    if (!edificioToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/edificios/${edificioToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Edificio eliminado exitosamente");
      fetchEdificios();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Error al eliminar el edificio";
      toast.error(errorMessage);
      console.error("Error deleting edificio:", error);
    } finally {
      setDeleteDialogOpen(false);
      setEdificioToDelete(null);
    }
  };

  const openDeleteDialog = (edificio) => {
    setEdificioToDelete(edificio);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-red-500" />
            <span>Gestión de Edificios</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Administra los edificios del campus
          </p>
        </div>
        {user && (user.role === "admin" || user.role === "superadmin") && (
          <Button
            onClick={() => navigate("/edificios/new")}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Edificio
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card className="p-4 bg-gray-900/50 backdrop-blur-16px border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar edificios por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-red-600/20 to-red-900/20 backdrop-blur-16px border-red-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total de Edificios</p>
              <p className="text-3xl font-bold text-white mt-1">{edificios.length}</p>
            </div>
            <Building2 className="h-12 w-12 text-red-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-600/20 to-blue-900/20 backdrop-blur-16px border-blue-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Resultados de Búsqueda</p>
              <p className="text-3xl font-bold text-white mt-1">{filteredEdificios.length}</p>
            </div>
            <Search className="h-12 w-12 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Edificios Table */}
      <Card className="bg-gray-900/50 backdrop-blur-16px border-gray-700">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800/50">
                <TableHead className="text-gray-300">Nombre</TableHead>
                <TableHead className="text-gray-300">Dirección</TableHead>
                <TableHead className="text-gray-300">Fecha Creación</TableHead>
                <TableHead className="text-gray-300 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEdificios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    {searchTerm ? "No se encontraron edificios que coincidan con la búsqueda" : "No hay edificios registrados"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEdificios.map((edificio) => (
                  <TableRow
                    key={edificio.id}
                    className="border-gray-700 hover:bg-gray-800/50 transition-colors"
                  >
                    <TableCell className="text-white font-medium">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-red-500" />
                        <span>{edificio.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {edificio.direccion ? (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{edificio.direccion}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Sin dirección</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(edificio.created_at).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {user && (user.role === "admin" || user.role === "superadmin") && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/edificios/edit/${edificio.id}`)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDeleteDialog(edificio)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {(!user || (user.role !== "admin" && user.role !== "superadmin")) && (
                          <span className="text-gray-500 text-sm italic">Solo lectura</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              ¿Estás seguro de eliminar este edificio?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción no se puede deshacer. El edificio "{edificioToDelete?.nombre}" será eliminado permanentemente.
              {edificioToDelete && (
                <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-400 text-sm">
                  ⚠️ No se puede eliminar si tiene ubicaciones asociadas
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
