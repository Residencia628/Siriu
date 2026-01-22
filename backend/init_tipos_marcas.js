// Script to initialize default tipos_bien and marcas
// Run with: mongosh test_database --eval "$(cat init_tipos_marcas.js)"

// Switch to database
db = db.getSiblingDB('test_database');

// Insert default tipos_bien
print("Inserting default tipos_bien...");
const defaultTiposBien = [
  { id: "1", nombre: "computadora", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "2", nombre: "periferico", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "3", nombre: "componente_red", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "4", nombre: "dispositivo_movil", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "5", nombre: "insumo_critico", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

defaultTiposBien.forEach(tipo => {
  const existing = db.tipos_bien.findOne({ nombre: tipo.nombre });
  if (!existing) {
    db.tipos_bien.insertOne(tipo);
    print(`Inserted tipo_bien: ${tipo.nombre}`);
  } else {
    print(`Tipo_bien already exists: ${tipo.nombre}`);
  }
});

// Insert default marcas
print("Inserting default marcas...");
const defaultMarcas = [
  { id: "1", nombre: "Dell", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "2", nombre: "HP", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "3", nombre: "Lenovo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "4", nombre: "Apple", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "5", nombre: "Samsung", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "6", nombre: "Acer", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "7", nombre: "Asus", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

defaultMarcas.forEach(marca => {
  const existing = db.marcas.findOne({ nombre: marca.nombre });
  if (!existing) {
    db.marcas.insertOne(marca);
    print(`Inserted marca: ${marca.nombre}`);
  } else {
    print(`Marca already exists: ${marca.nombre}`);
  }
});

// Insert default edificios
print("Inserting default edificios...");
const defaultEdificios = [
  { id: "1", nombre: "Edificio A", direccion: "Av. Universidad #100", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "2", nombre: "Edificio B", direccion: "Av. Universidad #200", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "3", nombre: "Edificio C", direccion: "Av. Universidad #300", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "4", nombre: "Edificio Administrativo", direccion: "Av. Principal s/n", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "5", nombre: "Centro de Cómputo", direccion: "Campus Central", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

defaultEdificios.forEach(edificio => {
  const existing = db.edificios.findOne({ nombre: edificio.nombre });
  if (!existing) {
    db.edificios.insertOne(edificio);
    print(`Inserted edificio: ${edificio.nombre}`);
  } else {
    print(`Edificio already exists: ${edificio.nombre}`);
  }
});

print("✅ Default tipos_bien, marcas, and edificios initialized successfully!");