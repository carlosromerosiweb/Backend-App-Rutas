# Documentación de API - Backend de Rutas Comerciales

## Autenticación

### Registro de Usuario
- **Endpoint:** `POST /api/auth/register`
- **Descripción:** Registra un nuevo usuario en el sistema
- **Ejemplo de petición:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "name": "Nombre Usuario"
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": "123",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario"
  }
}
```

### Inicio de Sesión
- **Endpoint:** `POST /api/auth/login`
- **Descripción:** Autentica a un usuario y devuelve un token JWT
- **Ejemplo de petición:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario"
  }
}
```

### Obtener Usuario Actual
- **Endpoint:** `GET /api/auth/me`
- **Descripción:** Obtiene la información del usuario autenticado
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario",
    "role": "user"
  }
}
```

### Cambiar Contraseña
- **Endpoint:** `PUT /api/change-password`
- **Descripción:** Permite al usuario cambiar su contraseña
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Ejemplo de petición:**
```json
{
  "currentPassword": "contraseñaActual",
  "newPassword": "nuevaContraseña123"
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

## Leads

### Crear Lead
- **Endpoint:** `POST /api/leads`
- **Descripción:** Crea un nuevo lead en el sistema
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** CREATE en LEADS
- **Ejemplo de petición:**
```json
{
  "name": "Empresa ABC",
  "contactName": "Juan Pérez",
  "email": "juan@empresaabc.com",
  "phone": "5551234567",
  "address": "Av. Reforma 123",
  "city": "Ciudad de México",
  "notes": "Cliente potencial interesado en servicios empresariales"
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Empresa ABC",
    "contactName": "Juan Pérez",
    "email": "juan@empresaabc.com",
    "phone": "5551234567",
    "address": "Av. Reforma 123",
    "city": "Ciudad de México",
    "status": "new",
    "createdAt": "2024-03-15T10:00:00Z"
  }
}
```

### Obtener Leads
- **Endpoint:** `GET /api/leads`
- **Descripción:** Obtiene la lista de leads con filtros opcionales
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** READ en LEADS
- **Query params opcionales:**
  - `status`: Filtro por estado (new, contacted, qualified, etc.)
  - `assignedTo`: Filtro por comercial asignado
  - `search`: Búsqueda por nombre o contacto
  - `page`: Número de página (default: 1)
  - `limit`: Límite por página (default: 10)
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": "123",
        "name": "Empresa ABC",
        "contactName": "Juan Pérez",
        "status": "new",
        "assignedTo": "456",
        "createdAt": "2024-03-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

### Obtener Lead por ID
- **Endpoint:** `GET /api/leads/:id`
- **Descripción:** Obtiene los detalles de un lead específico
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** READ en LEADS
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Empresa ABC",
    "contactName": "Juan Pérez",
    "email": "juan@empresaabc.com",
    "phone": "5551234567",
    "address": "Av. Reforma 123",
    "city": "Ciudad de México",
    "status": "new",
    "assignedTo": "456",
    "notes": "Cliente potencial interesado en servicios empresariales",
    "createdAt": "2024-03-15T10:00:00Z",
    "updatedAt": "2024-03-15T10:00:00Z"
  }
}
```

### Actualizar Lead
- **Endpoint:** `PUT /api/leads/:id`
- **Descripción:** Actualiza la información de un lead existente
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** UPDATE en LEADS
- **Ejemplo de petición:**
```json
{
  "name": "Empresa ABC Actualizada",
  "contactName": "Juan Pérez",
  "email": "juan.nuevo@empresaabc.com",
  "phone": "5551234567",
  "address": "Av. Reforma 123",
  "city": "Ciudad de México",
  "notes": "Actualización de información de contacto"
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Empresa ABC Actualizada",
    "contactName": "Juan Pérez",
    "email": "juan.nuevo@empresaabc.com",
    "phone": "5551234567",
    "address": "Av. Reforma 123",
    "city": "Ciudad de México",
    "status": "new",
    "notes": "Actualización de información de contacto",
    "updatedAt": "2024-03-15T11:00:00Z"
  }
}
```

### Eliminar Lead
- **Endpoint:** `DELETE /api/leads/:id`
- **Descripción:** Elimina un lead del sistema
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** DELETE en LEADS (solo admin y manager)
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Lead eliminado exitosamente"
}
```

### Actualizar Estado de Lead
- **Endpoint:** `PATCH /api/leads/:id/status`
- **Descripción:** Actualiza el estado de un lead
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** UPDATE en LEADS
- **Ejemplo de petición:**
```json
{
  "status": "contacted",
  "notes": "Cliente contactado por teléfono"
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "status": "contacted",
    "updatedAt": "2024-03-15T12:00:00Z"
  }
}
```

### Asignar Lead
- **Endpoint:** `POST /api/leads/:id/assign`
- **Descripción:** Asigna un lead a un comercial específico
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** ASSIGN en LEADS (solo admin y manager)
- **Ejemplo de petición:**
```json
{
  "userId": "456",
  "notes": "Asignado al comercial Juan García"
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "assignedTo": "456",
    "assignedAt": "2024-03-15T13:00:00Z"
  }
}
```

### Crear Interacción con Lead
- **Endpoint:** `POST /api/leads/:id/interactions`
- **Descripción:** Registra una nueva interacción con un lead
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** UPDATE en LEADS
- **Ejemplo de petición:**
```json
{
  "type": "call",
  "notes": "Llamada de seguimiento programada",
  "scheduledDate": "2024-03-20T10:00:00Z"
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "789",
    "leadId": "123",
    "type": "call",
    "notes": "Llamada de seguimiento programada",
    "scheduledDate": "2024-03-20T10:00:00Z",
    "createdAt": "2024-03-15T14:00:00Z"
  }
}
```

### Obtener Interacciones de Lead
- **Endpoint:** `GET /api/leads/:id/interactions`
- **Descripción:** Obtiene el historial de interacciones de un lead
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** READ en LEADS
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "789",
      "type": "call",
      "notes": "Llamada de seguimiento programada",
      "scheduledDate": "2024-03-20T10:00:00Z",
      "createdAt": "2024-03-15T14:00:00Z",
      "createdBy": "456"
    }
  ]
}
```

### Exportar Leads
- **Endpoint:** `GET /api/leads/export`
- **Descripción:** Exporta los leads en formato CSV
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** admin o manager
- **Query params opcionales:**
  - `status`: Filtro por estado
  - `assignedTo`: Filtro por comercial asignado
  - `dateFrom`: Fecha inicial
  - `dateTo`: Fecha final
- **Ejemplo de respuesta:** Archivo CSV descargable

## Notificaciones

### Obtener Notificaciones
- **Endpoint:** `GET /api/notifications`
- **Descripción:** Obtiene las notificaciones del usuario
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "title": "Nueva visita programada",
      "message": "Tienes una visita programada para mañana",
      "read": false,
      "createdAt": "2024-03-15T10:00:00Z"
    }
  ]
}
```

## Check-ins

### Crear Check-in
- **Endpoint:** `POST /api/checkins`
- **Descripción:** Registra un nuevo check-in en una ubicación
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Ejemplo de petición:**
```json
{
  "locationId": "123",
  "latitude": 19.4326,
  "longitude": -99.1332,
  "notes": "Visita al cliente",
  "photos": ["url_foto_1", "url_foto_2"],
  "status": "completed"
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "456",
    "locationId": "123",
    "userId": "789",
    "latitude": 19.4326,
    "longitude": -99.1332,
    "notes": "Visita al cliente",
    "photos": ["url_foto_1", "url_foto_2"],
    "status": "completed",
    "timestamp": "2024-03-15T10:00:00Z"
  }
}
```

### Obtener Check-ins
- **Endpoint:** `GET /api/checkins`
- **Descripción:** Obtiene la lista de check-ins
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Query params opcionales:**
  - `startDate`: Fecha inicial
  - `endDate`: Fecha final
  - `userId`: ID del usuario
  - `status`: Estado del check-in
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "checkins": [
      {
        "id": "456",
        "locationId": "123",
        "userId": "789",
        "latitude": 19.4326,
        "longitude": -99.1332,
        "status": "completed",
        "timestamp": "2024-03-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10
    }
  }
}
```

### Obtener Check-ins por Lead
- **Endpoint:** `GET /api/checkins/lead/:leadId`
- **Descripción:** Obtiene los check-ins asociados a un lead específico
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "456",
      "locationId": "123",
      "userId": "789",
      "latitude": 19.4326,
      "longitude": -99.1332,
      "status": "completed",
      "timestamp": "2024-03-15T10:00:00Z",
      "notes": "Visita al cliente"
    }
  ]
}
```

## Geocodificación

### Obtener Coordenadas
- **Endpoint:** `GET /api/geocoding`
- **Descripción:** Obtiene coordenadas geográficas a partir de una dirección
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Query params:** `address=Av. Reforma 123, Ciudad de México`
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "latitude": 19.4326,
    "longitude": -99.1332,
    "formattedAddress": "Av. Reforma 123, Ciudad de México"
  }
}
```

## Optimización de Rutas

### Optimizar Ruta
- **Endpoint:** `POST /api/route-optimization`
- **Descripción:** Optimiza una ruta de visitas
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Ejemplo de petición:**
```json
{
  "locations": [
    {
      "id": "1",
      "latitude": 19.4326,
      "longitude": -99.1332
    },
    {
      "id": "2",
      "latitude": 19.4327,
      "longitude": -99.1333
    }
  ]
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "optimizedRoute": [
      {
        "id": "2",
        "order": 1,
        "estimatedTime": "10:00 AM"
      },
      {
        "id": "1",
        "order": 2,
        "estimatedTime": "11:30 AM"
      }
    ],
    "totalDistance": "5.2 km",
    "estimatedDuration": "45 min"
  }
}
```

## Reportes

### Resumen de Rendimiento
- **Endpoint:** `GET /api/reports/summary`
- **Descripción:** Obtiene un resumen de rendimiento para usuarios
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** VIEW_ALL en REPORTS
- **Query params opcionales:**
  - `userId`: ID del usuario específico
  - `startDate`: Fecha inicial
  - `endDate`: Fecha final
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalLeads": 150,
      "activeLeads": 75,
      "completedCheckins": 120,
      "scheduledFollowUps": 45,
      "conversionRate": "25%",
      "averageResponseTime": "2.5 horas"
    },
    "byUser": [
      {
        "userId": "789",
        "name": "Juan García",
        "totalLeads": 50,
        "activeLeads": 25,
        "completedCheckins": 40,
        "conversionRate": "30%"
      }
    ]
  }
}
```

## Seguimientos (Follow-ups)

### Establecer Seguimiento
- **Endpoint:** `PATCH /api/followups/leads/:id/follow-up`
- **Descripción:** Establece una fecha de seguimiento para un lead
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Ejemplo de petición:**
```json
{
  "followUpDate": "2024-03-20T10:00:00Z",
  "notes": "Llamada de seguimiento programada",
  "priority": "high"
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "leadId": "456",
    "followUpDate": "2024-03-20T10:00:00Z",
    "notes": "Llamada de seguimiento programada",
    "priority": "high",
    "status": "pending"
  }
}
```

### Obtener Seguimientos del Día
- **Endpoint:** `GET /api/followups/today`
- **Descripción:** Obtiene los seguimientos programados para el día actual
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "leadId": "456",
      "leadName": "Empresa ABC",
      "followUpDate": "2024-03-15T10:00:00Z",
      "notes": "Llamada de seguimiento programada",
      "priority": "high",
      "status": "pending"
    }
  ]
}
```

## Google Calendar

### Sincronizar Eventos
- **Endpoint:** `POST /api/google-calendar/sync`
- **Descripción:** Sincroniza eventos con Google Calendar
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Ejemplo de petición:**
```json
{
  "events": [
    {
      "title": "Visita a Empresa ABC",
      "startTime": "2024-03-20T10:00:00Z",
      "endTime": "2024-03-20T11:00:00Z",
      "description": "Visita de seguimiento",
      "location": "Av. Reforma 123"
    }
  ]
}
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "syncedEvents": [
      {
        "id": "event_123",
        "googleCalendarId": "calendar_event_456",
        "status": "synced"
      }
    ]
  }
}
```

## Importación de Lugares

### Importar Lugares
- **Endpoint:** `POST /api/places/import`
- **Descripción:** Importa lugares desde un archivo CSV
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Content-Type:** `multipart/form-data`
- **Ejemplo de petición:**
```
FormData:
- file: [archivo CSV]
- options: {
    "skipDuplicates": true,
    "updateExisting": false
  }
```
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "totalImported": 100,
    "skipped": 5,
    "errors": 0,
    "details": {
      "new": 95,
      "updated": 0,
      "failed": 0
    }
  }
}
```

## Direcciones

### Obtener Direcciones
- **Endpoint:** `GET /api/directions`
- **Descripción:** Obtiene direcciones entre dos puntos
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Query params:**
  - `origin`: Coordenadas de origen (lat,lng)
  - `destination`: Coordenadas de destino (lat,lng)
  - `mode`: Modo de transporte (driving, walking, transit)
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "distance": "5.2 km",
        "duration": "15 min",
        "steps": [
          {
            "instruction": "Girar a la derecha en Av. Reforma",
            "distance": "0.5 km",
            "duration": "2 min"
          }
        ],
        "polyline": "encoded_polyline_string"
      }
    ]
  }
}
```

## Logs

### Obtener Logs
- **Endpoint:** `GET /api/logs`
- **Descripción:** Obtiene los logs del sistema
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Permisos requeridos:** admin
- **Query params opcionales:**
  - `level`: Nivel de log (info, warning, error)
  - `startDate`: Fecha inicial
  - `endDate`: Fecha final
  - `userId`: ID del usuario
- **Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "123",
        "level": "info",
        "message": "Usuario autenticado",
        "userId": "789",
        "timestamp": "2024-03-15T10:00:00Z",
        "metadata": {
          "ip": "192.168.1.1",
          "userAgent": "Mozilla/5.0..."
        }
      }
    ],
    "pagination": {
      "total": 1000,
      "page": 1,
      "limit": 50
    }
  }
}
```

## Notas Importantes

1. Todos los endpoints requieren autenticación mediante token JWT, excepto `/api/auth/register` y `/api/auth/login`
2. El token debe enviarse en el header `Authorization: Bearer <token>`
3. Algunos endpoints requieren permisos específicos (admin, manager, etc.)
4. Las respuestas de error siguen el formato:
```json
{
  "success": false,
  "error": "Mensaje de error",
  "code": "ERROR_CODE"
}
```
5. Los códigos de error comunes son:
   - `AUTH_REQUIRED`: Se requiere autenticación
   - `INVALID_TOKEN`: Token inválido o expirado
   - `PERMISSION_DENIED`: No tiene permisos para realizar la acción
   - `VALIDATION_ERROR`: Error en los datos enviados
   - `NOT_FOUND`: Recurso no encontrado
   - `INTERNAL_ERROR`: Error interno del servidor

6. Formatos de fecha:
   - Todas las fechas se manejan en formato ISO 8601
   - Ejemplo: `2024-03-15T10:00:00Z`

7. Paginación:
   - Los endpoints que devuelven listas soportan paginación
   - Parámetros: `page` (default: 1) y `limit` (default: 10)
   - La respuesta incluye información de paginación

8. Filtros:
   - La mayoría de los endpoints que devuelven listas soportan filtros
   - Los filtros se envían como query parameters
   - Los filtros comunes son: fechas, estados, usuarios, etc.

9. Archivos:
   - Para subir archivos, usar `multipart/form-data`
   - Formatos soportados: CSV, imágenes (jpg, png)
   - Tamaño máximo: 10MB

10. Rate Limiting:
    - Límite de 1000 peticiones por hora por IP
    - Límite de 100 peticiones por minuto por usuario
    - Headers de respuesta incluyen información de límites:
      - `X-RateLimit-Limit`
      - `X-RateLimit-Remaining`
      - `X-RateLimit-Reset` 