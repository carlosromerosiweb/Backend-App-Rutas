                                                                            LOGIN

POST http://0.0.0.0:8000/api/login

    Body
        {
            "email":"hola@hofdfla.com",
            "password": "kojima123"
        } 

    Response
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzUsInVzZXJJZCI6MzUsImVtYWlsIjoiaG9sYUBob2ZkZmxhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzIwNjQxMCwiZXhwIjoxNzQ3MjkyODEwfQ.ADUjknf1o-5Ax-EcjIWxJUCQdGcxdBdatMG8K9Sxk-0",
            "user": {
                "id": 35,
                "email": "hola@hofdfla.com",
                "name": "kojima5",
                "role": "admin"
            }
        }


                                                                            REGISTER

POST http://0.0.0.0:8000/api/register
    Body
        {
            "name": "kojimanager",
            "password": "kojima123",
            "role": "manager",          // opcional, si no se especifica se establece automáticamente como comercial
            "email": "hola@manager.com"
        }

    Response
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzksInVzZXJJZCI6MzksImVtYWlsIjoiaG9sZHNhQG1hbmFnZXIuY29tIiwicm9sZSI6Im1hbmFnZXIiLCJpYXQiOjE3NDcyMDY4NTUsImV4cCI6MTc0NzI5MzI1NX0.JDH-IHzQsYgO-szg3HFPm5lAJb75Q7ZDl32SVK0D2MI",
            "user": {
                "id": 39,
                "email": "holdsa@manager.com",
                "name": "kojimanagesr",
                "role": "manager"
            }
        }

                                                                        CAMBIAR CONTRASEÑA

PUT http://0.0.0.0:8000/api/change-password
    Body
        {
            "currentPassword": "kojima123",
            "newPassword": "kojima123"
        }

    Response
        {
            "message": "Contraseña actualizada exitosamente",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzUsInVzZXJJZCI6MzUsImVtYWlsIjoiaG9sYUBob2ZkZmxhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzIwNzQ5NSwiZXhwIjoxNzQ3MjkzODk1fQ.IQYMo9qc07pANjtD29GO2ZV44Df5i_yWg1cNwJ54dsw"
        }

                                                                    OBTENER USUARIO ACTUAL

GET http://0.0.0.0:8000/api/me
    Response
        {
            "user": {
                "id": 35,
                "email": "hola@hofdfla.com",
                "name": "kojima5",
                "role": "admin"
            }
        }

                                                                OBTENER TODOS LOS USUARIOS

GET http://0.0.0.0:8000/api/users            
    http://0.0.0.0:8000/api/users?limit=3 para cambiar el limite de usuarios
    http://0.0.0.0:8000/api/users?page=2 para cambiar de página de resultados
    Response
        {
            "success": true,
            "data": [
                {
                    "id": 21,
                    "name": "Usuario de Thudnerclient",
                    "role": "comercial",
                    "email": "thuntder.clifefdgnt@correo.com"
                },
                {
                    "id": 22,
                    "name": "Administrador",
                    "role": "admin",
                    "email": "admin@ejemplo.com"
                },
                {
                    "id": 23,
                    "name": "Usuario Agente",
                    "role": "comercial",
                    "email": "test_agente@ejemplo.com"
                }
            ],
            "pagination": {
                "total": 40,
                "page": 1,
                "limit": 20,
                "totalPages": 2
            }
        }                               //la respuesta devuelve los usuarios especificados en el limit, en este ejemplo están cortados a 3 por comodidad

                                                                 OBTENER USUARIO POR ID

GET http://0.0.0.0:8000/api/users/2
    Response
        {
            "success": true,
            "data": {
                "id": 2,
                "name": "Usuario Prueba",
                "role": "comercial",
                "email": "prueba@ejemplo.com"
            }
        }

                                                                 ELIMINAR USUARIO

DELETE http://0.0.0.0:8000/api/users/:id
    Response
        {
            "success": true,
            "message": "Usuario eliminado exitosamente"
        }

                                                        CAMBIAR ROL DE USUARIO (disponible solo para admins)
PUT http://0.0.0.0:8000/api/users/:userId/role
    Body
        {
            "role": "manager"
        }

    Response
        {
            "success": true,
            "message": "Rol de usuario actualizado exitosamente",
            "user": {
                "id": 10,
                "email": "a@a.com",
                "name": "Antonio Lobato",
                "role": "manager"
            }
        }