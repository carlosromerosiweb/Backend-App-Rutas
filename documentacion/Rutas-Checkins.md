#                                                                     OBTENER CHECKINS

GET http://0.0.0.0:8000/api/checkins
    http://0.0.0.0:8000/api/checkins?userId=35 para filtrar por usuario
    http://0.0.0.0:8000/api/checkins?status=nuevo para filtrar por estado
    Response
        [
            {
                "id": 6,
                "user_id": 35,
                "lead_id": 8,
                "timestamp": "2025-05-13T08:38:32.918Z",
                "location_lat": null,
                "location_lng": null,
                "status": "nuevo",
                "notes": "Primera interacción con el lead",
                "attachment_urls": [],
                "created_at": "2025-05-13T08:38:32.918Z",
                "updated_at": "2025-05-13T08:38:32.918Z",
                "check_in_type": null,
                "distance": null,
                "user_name": "kojima5",
                "lead_name": "Machado"
            },
            {
                "id": 5,
                "user_id": 32,
                "lead_id": 4,
                "timestamp": "2025-05-12T08:54:09.787Z",
                "location_lat": 39.46985,
                "location_lng": -0.37696,
                "status": "interesado",
                "notes": "prueba de checkin 2",
                "attachment_urls": [
                    "/uploads/be1cb9f2-fd97-4ac3-8156-ed12a8f69ca7.png"
                ],
                "created_at": "2025-05-12T08:54:09.787Z",
                "updated_at": "2025-05-12T08:54:09.787Z",
                "check_in_type": "auto",
                "distance": null,
                "user_name": "kojima3",
                "lead_name": "Ayuntamiento de Valencia"
            },
            {
                "id": 3,
                "user_id": 32,
                "lead_id": 4,
                "timestamp": "2025-05-12T06:54:30.210Z",
                "location_lat": 39.4698437,
                "location_lng": -0.3769634,
                "status": "seguimiento",
                "notes": "Check-in de prueba",
                "attachment_urls": [
                    null
                ],
                "created_at": "2025-05-12T06:54:30.210Z",
                "updated_at": "2025-05-12T06:54:30.210Z",
                "check_in_type": null,
                "distance": null,
                "user_name": "kojima3",
                "lead_name": "Ayuntamiento de Valencia"
            }
        ]

#                                                                    CREAR CHECKIN

Valores posibles para status (a día 14/05): nuevo, seguimiento, ganado, perdido
POST http://0.0.0.0:8000/api/checkins
    Headers:
        Authorization: Bearer <token>

    Body (multipart/form-data):
        lead_id: 19
        status: ganado
        notes: probando gamificacion
        files: [archivo1, archivo2, ...] // opcional, máximo 5 archivos

    Notas:
        - Los archivos deben ser .jpg, .png o .pdf
        - Tamaño máximo por archivo: 10MB
        - Las imágenes se comprimirán automáticamente
        - Para enviar en Postman:
            1. Seleccionar método POST
            2. En Body, seleccionar form-data
            3. Añadir los campos lead_id, status y notes como Text
            4. Añadir el campo 'files' como File y seleccionar los archivos
            5. Puedes añadir hasta 5 archivos diferentes

    Response
        {
            "id": 13,
            "user_id": 35,
            "lead_id": 107,
            "timestamp": "2025-05-14T09:35:37.665Z",
            "location_lat": null,
            "location_lng": null,
            "status": "ganado",
            "notes": "probando endpointssss",
            "attachment_urls": [
                "/uploads\\5ec049ff-0e4e-4ef3-92a9-3bf6b9d95ea1.pdf"
            ],
            "created_at": "2025-05-14T09:35:37.665Z",
            "updated_at": "2025-05-14T09:35:37.665Z",
            "check_in_type": "manual",
            "distance": null
        }

#                                                            CREAR CHECKIN AUTOMATICO

POST http://0.0.0.0:8000/api/checkins/auto

    Body (multipart/form-data):
        location: {
            "latitude": 40.4193514,
            "longitude": -3.697675099999999
        }
        radius: 100 // opcional, radio en metros
        notes: Check-in automático
        next_followup: 2025-05-15T10:00:00Z // opcional
        files: [archivo1, archivo2, ...] // opcional, máximo 5 archivos

    Notas:
        - Los archivos deben ser .jpg, .png o .pdf
        - Tamaño máximo por archivo: 10MB
        - Las imágenes se comprimirán automáticamente
        - Para enviar en Postman:
            1. Seleccionar método POST
            2. En Body, seleccionar form-data
            3. Añadir los campos location, radius, notes y next_followup como Text
            4. Añadir el campo 'files' como File y seleccionar los archivos
            5. Puedes añadir hasta 5 archivos diferentes

    Response
        {
            "success": true,
            "message": "Check-in automático registrado exitosamente",
            "data": {
                "lead": {
                    "id": 107,
                    "name": "Restaurante Vinitus",
                    "email": null,
                    "phone": null,
                    "address": "Gran Vía, 4, Centro, 28013 Madrid, España",
                    "city": null,
                    "postal_code": null,
                    "country": "España",
                    "type": "empresa",
                    "status": "nuevo",
                    "priority": "media",
                    "assigned_to": 35,
                    "notes": null,
                    "estimated_value": null,
                    "created_at": "2025-05-13T07:17:21.016Z",
                    "updated_at": "2025-05-14T09:04:13.493Z",
                    "last_contact": "2025-05-14T11:04:13.952Z",
                    "next_followup": null,
                    "coordinates": {
                        "latitude": 40.4193514,
                        "longitude": -3.697675099999999
                    },
                    "tags": null,
                    "place_id": "ChIJ_cSBSNopQg0RdQccod3flf0",
                    "rating": "4.60",
                    "category": "bar",
                    "latitude": 40.4193514,
                    "longitude": -3.697675099999999,
                    "team_id": null
                },
                "distance": 0,
                "next_followup": "2025-05-15T10:00:00.000Z"
            }
        }

#                                                          OBTENER CHECKINS DE UN LEAD

GET http://0.0.0.0:8000/api/checkins/lead/:id
    Body
        {
            "location": {
                "latitude": 40.4193514,
                "longitude": -3.697675099999999
            },
            "radius": 100, // opcional, radio en metros
            "notes": "Check-in automático",
            "next_followup": "2025-05-15T10:00:00Z" // opcional
        }

    Response
        [
            {
                "id": 12,
                "user_id": 35,
                "lead_id": 107,
                "timestamp": "2025-05-14T09:04:28.941Z",
                "location_lat": 40.4193514,
                "location_lng": -3.697675099999999,
                "status": "nuevo",
                "notes": "Check-in automático",
                "attachment_urls": [],
                "created_at": "2025-05-14T09:04:28.941Z",
                "updated_at": "2025-05-14T09:04:28.941Z",
                "check_in_type": "auto",
                "distance": null,
                "user_name": "kojima5"
            }
        ] 


