import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

// Cargar variables de entorno
dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'OK' : 'FALTA');

const CSV_PATH = './leads_ejemplo.csv';

const CSV_CONTENT = `nombre,telefono,estado,direccion,categoria,rating,horarios,latitud,longitud,notas,foto_url,asignado_a
Bar Prueba 1,123456789,nuevo,Calle 1,bar,4.5,"Lunes a Viernes 9-18",-34.60,-58.38,"Nota para Bar 1",https://ejemplo.com/foto1.jpg,
Restaurante Central,987654321,seguimiento,Avenida 2,restaurante,4.8,"Todos los días 12-23",-34.61,-58.39,"Nota para Restaurante",https://ejemplo.com/foto2.jpg,
Café Moderno,555123456,ganado,Calle 3,cafe,4.2,"Lunes a Sábado 8-20",-34.62,-58.40,"Nota para Café",https://ejemplo.com/foto3.jpg,
`;

const API_URL = 'http://localhost:3000/api';

async function loginKojima() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'kojima@ejemplo.com',
      password: 'kojima123'
    });
    // Devuelve el token y el usuario
    return { token: response.data.accessToken, user: response.data.user };
  } catch (error: any) {
    console.error('❌ Error al hacer login como Kojima:', error.response?.data || error.message);
    return null;
  }
}

async function getOrCreateLead(token: string, userId: string) {
  const { data: leads } = await axios.get(`${API_URL}/leads/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (leads.length > 0) {
    return leads[0];
  }
  // Crear uno de ejemplo
  const leadEjemplo = {
    nombre: 'Bar Los Amigos',
    direccion: 'Calle Falsa 123',
    telefono: '123456789',
    categoria: 'bar',
    rating: 4.5,
    horarios: 'Lunes a Viernes 9:00-18:00',
    latitud: -34.6037,
    longitud: -58.3816,
    estado: 'nuevo',
    notas: 'Cliente potencial, llamar la próxima semana.',
    foto_url: 'https://ejemplo.com/foto.jpg',
    asignado_a: userId
  };
  const { data: newLead } = await axios.post(`${API_URL}/leads`, leadEjemplo, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return newLead;
}

async function subirAdjunto(token: string, leadId: string) {
  const adjunto = {
    url: 'https://ejemplo.com/contrato.pdf',
    descripcion: 'Contrato firmado en PDF'
  };
  const { data } = await axios.post(`${API_URL}/leads/${leadId}/adjuntos`, adjunto, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Adjunto subido:', data);
}

async function cambiarEstadoLead(token: string, leadId: string) {
  // Obtener el lead actual
  const { data: lead } = await axios.get(`${API_URL}/leads/${leadId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  // Elimina 'motivo' si existe
  const { motivo, ...leadData } = lead;
  // Actualizar solo el estado
  const update = {
    ...leadData,
    estado: 'seguimiento'
  };
  const { data } = await axios.put(`${API_URL}/leads/${leadId}`, update, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Estado del lead actualizado:', data);
}

async function mostrarHistorialEstados(token: string, leadId: string) {
  const { data } = await axios.get(`${API_URL}/leads/${leadId}/historial-estados`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('📋 Historial de estados:', data);
}

async function mostrarAdjuntos(token: string, leadId: string) {
  const { data } = await axios.get(`${API_URL}/leads/${leadId}/adjuntos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('📋 Adjuntos del lead:', data);
}

async function main() {
  const loginResult = await loginKojima();
  if (!loginResult) return;
  const { token, user } = loginResult;
  // Buscar o crear lead
  const lead = await getOrCreateLead(token, user.id);
  console.log('Lead usado para la prueba:', lead);
  // Subir adjunto
  await subirAdjunto(token, lead.id);
  // Cambiar estado
  await cambiarEstadoLead(token, lead.id);
  // Mostrar historial de estados
  await mostrarHistorialEstados(token, lead.id);
  // Mostrar adjuntos
  await mostrarAdjuntos(token, lead.id);
}

main(); 