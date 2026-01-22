import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import InventoryList from "@/pages/InventoryList";
import EquipmentDetail from "@/pages/EquipmentDetail";
import EquipmentForm from "@/pages/EquipmentForm";
import UserManagement from "@/pages/UserManagement";
import LocationsList from "@/pages/LocationsList";
import LocationForm from "@/pages/LocationForm";
import DepartmentsList from "@/pages/DepartmentsList";
import DepartmentForm from "@/pages/DepartmentForm";
import BIDashboard from "@/pages/BIDashboard";
import ProfilePage from "@/pages/ProfilePage";
import TiposBienList from "@/pages/TiposBienList";
import TipoBienForm from "@/pages/TipoBienForm";
import MarcasList from "@/pages/MarcasList";
import MarcaForm from "@/pages/MarcaForm";
import EdificiosList from "@/pages/EdificiosList";
import EdificioForm from "@/pages/EdificioForm";
import Layout from "@/components/Layout";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="equipment/:id" element={<EquipmentDetail />} />
            <Route
              path="equipment/new"
              element={
                <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                  <EquipmentForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="equipment/edit/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                  <EquipmentForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={"superadmin"}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="locations" element={<LocationsList />} />
            <Route path="locations/new" element={<LocationForm />} />
            <Route path="locations/edit/:id" element={<LocationForm />} />
            <Route path="departments" element={<DepartmentsList />} />
            <Route path="departments/new" element={<DepartmentForm />} />
            <Route path="departments/edit/:id" element={<DepartmentForm />} />
            <Route path="tipos-bien" element={<TiposBienList />} />
            <Route path="tipos-bien/new" element={<TipoBienForm />} />
            <Route path="tipos-bien/edit/:id" element={<TipoBienForm />} />
            <Route path="marcas" element={<MarcasList />} />
            <Route path="marcas/new" element={<MarcaForm />} />
            <Route path="marcas/edit/:id" element={<MarcaForm />} />
            <Route
              path="edificios"
              element={
                <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                  <EdificiosList />
                </ProtectedRoute>
              }
            />
            <Route
              path="edificios/new"
              element={
                <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                  <EdificioForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="edificios/edit/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                  <EdificioForm />
                </ProtectedRoute>
              }
            />
            <Route path="bi-dashboard" element={<BIDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;