const fs = require('fs');

const sqlStatements = `
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('comercial', 'manager', 'admin')) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  categoria TEXT,
  rating FLOAT,
  horarios TEXT,
  latitud FLOAT,
  longitud FLOAT,
  estado TEXT CHECK (estado IN ('nuevo', 'seguimiento', 'ganado', 'perdido')) DEFAULT 'nuevo',
  notas TEXT,
  foto_url TEXT,
  asignado_a UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de checkins
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fecha TIMESTAMP DEFAULT NOW(),
  estado TEXT,
  notas TEXT,
  foto_url TEXT
);
`;

// Guardar las sentencias SQL en un archivo
fs.writeFileSync('create_tables.sql', sqlStatements);

console.log('✅ Archivo create_tables.sql generado correctamente');
console.log('📝 Copia el contenido del archivo y pégalo en el editor SQL de Supabase'); 