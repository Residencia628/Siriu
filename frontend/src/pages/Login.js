import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enhanced axios configuration for better network handling
      const apiClient = axios.create({
        baseURL: API,
        timeout: 15000, // Increased timeout
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: false,
        // Add retry configuration
        retry: 2,
        retryDelay: 1000
      });

      // Add request interceptor for debugging
      apiClient.interceptors.request.use(
        (config) => {
          console.log('📡 Sending request to:', config.url);
          console.log('📍 Full URL:', `${config.baseURL}${config.url}`);
          console.log('📤 Request headers:', config.headers);
          return config;
        },
        (error) => {
          console.error('❌ Request interceptor error:', error);
          return Promise.reject(error);
        }
      );

      // Add response interceptor
      apiClient.interceptors.response.use(
        (response) => {
          console.log('✅ Response received:', response.status);
          return response;
        },
        (error) => {
          console.error('❌ Response error:', error);
          console.error('❌ Error config:', error.config);
          console.error('❌ Error request:', error.request);
          console.error('❌ Error response:', error.response);
          return Promise.reject(error);
        }
      );

      const response = await apiClient.post(`/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success("Inicio de sesión exitoso");
      navigate("/dashboard");
    } catch (error) {
      console.error('💥 LOGIN ERROR DETAILS:');
      console.error('Error object:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      
      // Enhanced error handling
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        toast.error("Error de red. Verifica tu conexión a internet.");
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error("Tiempo de espera agotado. Intenta nuevamente.");
      } else if (error.message.includes('CORS') || error.message.includes('blocked')) {
        toast.error("Error de permisos CORS. Contacta al administrador.");
        console.log('🔒 CORS Debug Info:');
        console.log('- Backend URL:', API);
        console.log('- Current Origin:', window.location.origin);
      } else if (error.response) {
        // Server responded with error status
        toast.error(error.response.data?.detail || `Error del servidor: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        toast.error("No se recibió respuesta del servidor. Verifica que el backend esté activo.");
      } else {
        // Something else happened
        toast.error("Error desconocido al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1b 0%, #0f0f10 100%)' }}>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-600 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-800 rounded-full filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="glass-effect rounded-2xl p-8 shadow-2xl" style={{ background: 'rgba(26, 26, 27, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              {/* Logo de la institución */}
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain drop-shadow-2xl"
                onError={(e) => {
                  // Fallback al ícono SVG si no se encuentra la imagen
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              {/* Fallback icon (oculto por defecto) */}
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl items-center justify-center shadow-lg" style={{ display: 'none' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>Sistema de Inventario</h1>
            <p className="text-gray-400 text-sm">Control de Recursos Informáticos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                data-testid="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 focus:ring-red-600 rounded-lg"
                placeholder="usuario@universidad.edu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Contraseña</Label>
              <Input
                id="password"
                type="password"
                data-testid="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 focus:ring-red-600 rounded-lg"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div className="flex items-center justify-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-gray-300 text-center">
                En caso de extravío y reinicio de contraseña comunicarse con soporte técnico
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}