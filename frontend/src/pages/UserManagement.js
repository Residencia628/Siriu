import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "user"
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/auth/register`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Usuario creado");
      setDialogOpen(false);
      setFormData({ email: "", name: "", password: "", role: "user" });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear usuario");
    }
  };

  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar usuario");
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/users/${userId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al restablecer contraseña");
    }
  };

  const roleLabels = {
    user: "Usuario",
    admin: "Administrador",
    superadmin: "Super Administrador"
  };

  const roleColors = {
    user: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    superadmin: "bg-red-500/20 text-red-400 border-red-500/30"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  
  return (
    <div className="space-y-6 animate-fade-in" data-testid="user-management-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>Gestión de Usuarios</h1>
          <p className="text-gray-400">Administra los usuarios del sistema</p>
        </div>
        {currentUser.role === "superadmin" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-user-button" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 rounded-lg shadow-lg">
                ➕ Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Crear Nuevo Usuario</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Completa los datos del nuevo usuario
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} data-testid="create-user-form">
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">Nombre Completo</Label>
                    <Input
                      id="name"
                      data-testid="name-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="email-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      data-testid="password-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-gray-300 mb-2 block">Rol</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger data-testid="role-select" className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="superadmin">Super Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" data-testid="submit-user-button" className="bg-red-600 hover:bg-red-700 text-white">
                    Crear Usuario
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Users List */}
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          background: 'rgba(26, 26, 27, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="space-y-4" data-testid="users-list">
          {users.map((user) => {
            const isCurrentUser = user.id === currentUser.id;
            
            return (
              <div
                key={user.id}
                data-testid={`user-card-${user.id}`}
                className="p-4 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-200 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Space Grotesk' }}>
                      {user.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                    {isCurrentUser && (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        Tú
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Creado: {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                {!isCurrentUser && currentUser.role === "superadmin" && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleResetPassword(user.id)}
                      data-testid={`reset-password-${user.id}`}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 px-4 py-2 rounded-lg"
                    >
                      Restablecer Contraseña
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          data-testid={`delete-user-${user.id}`}
                          className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 px-4 py-2 rounded-lg"
                        >
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Esta acción no se puede deshacer. El usuario será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(user.id)}
                            data-testid={`confirm-delete-${user.id}`}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}