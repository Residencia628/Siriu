// Script para crear usuario administrador
// Ejecutar con: mongosh "TU_CONNECTION_STRING" --eval "$(cat create-admin-user.js)"

// Switch to database
db = db.getSiblingDB('siriu');

print("Creando usuario administrador...");

// Crear usuario superadmin
const bcrypt = require('bcryptjs');

// Contraseña: admin123 (hasheada)
const hashedPassword = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S"; // bcrypt hash de "admin123"

const adminUser = {
  id: "eaf43756-4018-48c7-a1a7-405ad066b809",
  email: "admin@universidad.edu",
  name: "Super Administrador",
  role: "superadmin",
  password: hashedPassword,
  created_at: new Date().toISOString()
};

// Verificar si ya existe
const existingUser = db.users.findOne({ email: "admin@universidad.edu" });

if (existingUser) {
  print("Usuario admin ya existe");
} else {
  db.users.insertOne(adminUser);
  print("Usuario administrador creado exitosamente!");
  print("Email: admin@universidad.edu");
  print("Password: admin123");
}

// Verificar que se creó
const userCount = db.users.countDocuments();
print("\nTotal de usuarios en la base de datos: " + userCount);