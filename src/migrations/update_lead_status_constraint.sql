-- Eliminar la restricción existente
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Añadir la nueva restricción con los estados actualizados
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
CHECK (status::text = ANY (ARRAY[
  'nuevo'::character varying,
  'contactado'::character varying,
  'interesado'::character varying,
  'negociacion'::character varying,
  'cliente'::character varying,
  'perdido'::character varying,
  'inactivo'::character varying
]::text[])); 