
                                                            REGISTRAR NUEVO TOKEN DE TESTEO 
                                                        
POST http://0.0.0.0:8000/api/notifications/register-test-token
    Body
        // debe ir vacío

    Response
        {
            "message": "Token de prueba registrado correctamente",
            "deviceToken": {
                "id": 6,
                "user_id": 35,
                "token": "fMqXwYz1234567890abcdefghijklmnopqrstuvwxyz",
                "device_type": "web",
                "device_name": "Test Device",
                "created_at": "2025-05-14T10:50:25.028Z",
                "updated_at": "2025-05-14T10:50:25.028Z",
                "last_used": null
            }
        }

                                                            REGISTRAR TOKEN DE DISPOSITIVO

POST http://0.0.0.0:8000/api/notifications/register-token
    Body
        {
            "token": "tu_token_fcm",
            "device_type": "web",
            "device_name": "Chrome en Windows"
        }

    Response
        {
            "message": "Token registrado correctamente",
            "deviceToken": {
                "id": 1,
                "user_id": 35,
                "token": "tu_token_fcm",
                "device_type": "web",
                "device_name": "Chrome en Windows",
                "created_at": "2025-05-14T10:52:21.401Z",
                "updated_at": "2025-05-14T10:52:21.401Z",
                "last_used": null
            }
        }

                                                                  CREAR NORIFICACIONES

POST http://0.0.0.0:8000/api/notifications
    Body 
        {
            "user_id": 35,
            "title": "notificacion CUATRO",
            "body": "Cuerpo de la notificación 4",
            "type": "PUSH",
            "data": {
                "key1": "valor1",
                "key2": "valor2"
            },
            "priority": "high",
            "send_immediately": true
        }

    Response
        {
            "message": "Notificación creada correctamente",
            "notification": {
                "id": 7,
                "user_id": 35,
                "title": "notificacion CUATRO",
                "body": "Cuerpo de la notificación 4",
                "type": "PUSH",
                "status": "pending",
                "data": {
                    "key1": "valor1",
                    "key2": "valor2"
                },
                "priority": "high",
                "created_at": "2025-05-14T10:58:28.510Z",
                "updated_at": "2025-05-14T10:58:28.510Z",
                "sent_at": null,
                "read_at": null
            }
        }

                                                        OBTENER NOTIFICACIONES DEL USUARIO

GET http://0.0.0.0:8000/api/notifications
    Response
        {
  "notifications": [
            {
            "id": 4,
            "user_id": 35,
            "title": "notificacion d prueba DOS",
            "body": "prubando cosas nada hola si adios ok",
            "type": "PUSH",
            "status": "failed",
            "data": {},
            "priority": "normal",
            "created_at": "2025-05-14T10:48:20.969Z",
            "updated_at": "2025-05-14T10:48:21.610Z",
            "sent_at": null,
            "read_at": null
            },
            {
            "id": 3,
            "user_id": 35,
            "title": "notificacion d prueba",
            "body": "prubando cosas nada hola si adios ok",
            "type": "PUSH",
            "status": "failed",
            "data": {},
            "priority": "normal",
            "created_at": "2025-05-14T10:46:35.739Z",
            "updated_at": "2025-05-14T10:46:37.646Z",
            "sent_at": null,
            "read_at": null
            }
        ],
        "pagination": {
            "total": 2,
            "page": 1,
            "limit": 20,
            "pages": 1
        }
        }

                                                            MARCAR NOTIFICACION COMO LEIDA

PUT http://0.0.0.0:8000/api/notifications/:notificationId/read

    Response
        {
            "message": "Notificación marcada como leída"
        }

                                                                BORRAR NOTIFICACIÓN

DELETE http://0.0.0.0:8000/api/notifications/6

    Response
        {
            "message": "Notificación eliminada correctamente"
        }

                                                            ENVIAR NOTIFICACIÓN PUSH

POST http://0.0.0.0:8000/api/notifications/send
    Body
        {
            "title": "Título de la notificación push",
            "body": "Cuerpo de la notificación push",
            "userId": 35 
        }

    Response
        {
            "message": "Notificación enviada correctamente",
            "sentTo": ["fMqXwYz1234567890abcdefghijklmnopqrstuvwxyz"],
            "notification": {
                "id": 8,
                "user_id": 35,
                "title": "Título de la notificación push",
                "body": "Cuerpo de la notificación push",
                "type": "PUSH",
                "status": "sent",
                "data": {},
                "priority": "normal",
                "created_at": "2025-05-14T11:00:00.000Z",
                "updated_at": "2025-05-14T11:00:00.000Z",
                "sent_at": "2025-05-14T11:00:00.000Z",
                "read_at": null
            }
        }