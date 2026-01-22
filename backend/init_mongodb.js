// MongoDB Initialization Script for Inventory System
// Run with: mongosh test_database --eval "$(cat init_mongodb.js)"

// Switch to database
db = db.getSiblingDB('test_database');

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "email", "name", "role", "password"],
      properties: {
        id: { bsonType: "string" },
        email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
        name: { bsonType: "string" },
        role: { enum: ["user", "admin", "superadmin"] },
        password: { bsonType: "string" },
        created_at: { bsonType: "string" }
      }
    }
  }
});

db.createCollection("equipment", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "ubicacion", "resguardante", "departamento", "tipo_bien", "numero_serie", "marca", "modelo", "estado_operativo"],
      properties: {
        id: { bsonType: "string" },
        ubicacion: { bsonType: "string" },
        resguardante: { bsonType: "string" },
        departamento: { bsonType: "string" },
        tipo_bien: { enum: ["computadora", "periferico", "componente_red", "dispositivo_movil", "insumo_critico"] },
        numero_serie: { bsonType: "string" },
        numero_factura: { bsonType: "string" },
        numero_inventario: { bsonType: "string" },
        marca: { bsonType: "string" },
        modelo: { bsonType: "string" },
        fecha_adquisicion: { bsonType: "string" },
        estado_operativo: { enum: ["disponible", "asignado", "en_mantenimiento", "dado_de_baja", "en_resguardo"] },
        observaciones: { bsonType: "string" },
        created_at: { bsonType: "string" },
        updated_at: { bsonType: "string" },
        created_by: { bsonType: "string" }
      }
    }
  }
});

db.createCollection("history", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "equipment_id", "action", "changed_by", "timestamp"],
      properties: {
        id: { bsonType: "string" },
        equipment_id: { bsonType: "string" },
        action: { bsonType: "string" },
        changed_by: { bsonType: "string" },
        timestamp: { bsonType: "string" },
        old_values: { bsonType: "object" },
        new_values: { bsonType: "object" }
      }
    }
  }
});

db.createCollection("locations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "edificio", "piso", "salon_aula"],
      properties: {
        id: { bsonType: "string" },
        edificio: { bsonType: "string" },
        piso: { bsonType: "string" },
        salon_aula: { bsonType: "string" },
        created_at: { bsonType: "string" },
        updated_at: { bsonType: "string" }
      }
    }
  }
});

db.createCollection("departments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "nombre", "ubicacion_id", "numero_trabajadores"],
      properties: {
        id: { bsonType: "string" },
        nombre: { bsonType: "string" },
        ubicacion_id: { bsonType: "string" },
        numero_trabajadores: { bsonType: "int" },
        trabajadores: { bsonType: "array" },
        created_at: { bsonType: "string" },
        updated_at: { bsonType: "string" }
      }
    }
  }
});

db.createCollection("tipos_bien", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "nombre"],
      properties: {
        id: { bsonType: "string" },
        nombre: { bsonType: "string" },
        created_at: { bsonType: "string" },
        updated_at: { bsonType: "string" }
      }
    }
  }
});

db.createCollection("marcas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "nombre"],
      properties: {
        id: { bsonType: "string" },
        nombre: { bsonType: "string" },
        created_at: { bsonType: "string" },
        updated_at: { bsonType: "string" }
      }
    }
  }
});

db.createCollection("edificios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "nombre"],
      properties: {
        id: { bsonType: "string" },
        nombre: { bsonType: "string" },
        direccion: { bsonType: "string" },
        created_at: { bsonType: "string" },
        updated_at: { bsonType: "string" }
      }
    }
  }
});

// Create indexes for performance
print("Creating indexes...");

// Users indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "id": 1 }, { unique: true });

// Equipment indexes
db.equipment.createIndex({ "id": 1 }, { unique: true });
db.equipment.createIndex({ "numero_serie": 1 }, { unique: true });
db.equipment.createIndex({ "numero_factura": 1 });
db.equipment.createIndex({ "numero_inventario": 1 });
db.equipment.createIndex({ "tipo_bien": 1 });
db.equipment.createIndex({ "estado_operativo": 1 });
db.equipment.createIndex({ "departamento": 1 });
db.equipment.createIndex({ "ubicacion": 1 });
db.equipment.createIndex({ "resguardante": 1 });
db.equipment.createIndex({ "marca": 1 });
db.equipment.createIndex({ "modelo": 1 });

// Compound indexes for common queries
db.equipment.createIndex({ "tipo_bien": 1, "estado_operativo": 1 });
db.equipment.createIndex({ "departamento": 1, "estado_operativo": 1 });

// Text index for search functionality
db.equipment.createIndex({
  "numero_serie": "text",
  "marca": "text",
  "modelo": "text",
  "resguardante": "text"
});

// Locations indexes
db.locations.createIndex({ "id": 1 }, { unique: true });
db.locations.createIndex({ "edificio": 1 });
db.locations.createIndex({ "piso": 1 });
db.locations.createIndex({ "salon_aula": 1 });

// Departments indexes
db.departments.createIndex({ "id": 1 }, { unique: true });
db.departments.createIndex({ "nombre": 1 });
db.departments.createIndex({ "ubicacion_id": 1 });

// History indexes
db.history.createIndex({ "equipment_id": 1 });
db.history.createIndex({ "timestamp": -1 });
db.history.createIndex({ "action": 1 });
db.history.createIndex({ "changed_by": 1 });

// Tipos Bien indexes
db.tipos_bien.createIndex({ "id": 1 }, { unique: true });
db.tipos_bien.createIndex({ "nombre": 1 });

// Marcas indexes
db.marcas.createIndex({ "id": 1 }, { unique: true });
db.marcas.createIndex({ "nombre": 1 });

// Edificios indexes
db.edificios.createIndex({ "id": 1 }, { unique: true });
db.edificios.createIndex({ "nombre": 1 });

print("✅ Database initialized successfully!");
print("Collections created: users, equipment, history, locations, departments, tipos_bien, marcas, edificios");
print("Indexes created for optimal performance");
print("");
print("Database statistics:");
db.stats();
