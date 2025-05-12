-- Añadir columna place_id a la tabla leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS place_id VARCHAR(255) UNIQUE;

-- Crear índice para búsquedas rápidas por place_id
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON leads(place_id); 