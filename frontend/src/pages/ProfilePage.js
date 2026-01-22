import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/auth/change-password`, {
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("Contraseña actualizada exitosamente");
      
      // Clear form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="profile-container">
      {/* Header */}
      <div>
        <Button
          onClick={() => navigate(-1)}
          data-testid="back-button"
          className="mb-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          ← Volver
        </Button>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          Mi Perfil
        </h1>
        <p className="text-gray-400">Gestiona tu información personal y contraseña</p>
      </div>

      {/* Change Password Form */}
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          background: 'rgba(26, 26, 27, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <h2 className="text-2xl font-semibold text-white mb-6" style={{ fontFamily: 'Space Grotesk' }}>
          Cambiar Contraseña
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label htmlFor="currentPassword" className="text-gray-300 text-sm font-medium mb-2 block">
                Contraseña Actual *
              </Label>
              <Input
                id="currentPassword"
                type="password"
                data-testid="current-password-input"
                value={formData.currentPassword}
                onChange={(e) => handleChange("currentPassword", e.target.value)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="Ingresa tu contraseña actual"
              />
            </div>
            
            <div>
              <Label htmlFor="newPassword" className="text-gray-300 text-sm font-medium mb-2 block">
                Nueva Contraseña *
              </Label>
              <Input
                id="newPassword"
                type="password"
                data-testid="new-password-input"
                value={formData.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="Ingresa tu nueva contraseña"
              />
              <p className="text-gray-500 text-xs mt-1">Debe tener al menos 6 caracteres</p>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-300 text-sm font-medium mb-2 block">
                Confirmar Nueva Contraseña *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                data-testid="confirm-password-input"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                required
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-lg"
                placeholder="Confirma tu nueva contraseña"
              />
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                data-testid="submit-button"
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Actualizando..." : "Cambiar Contraseña"}
              </Button>
              
              <Button
                type="button"
                onClick={() => navigate(-1)}
                className="px-8 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}