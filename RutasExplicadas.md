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
            "role": "manager",
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


                                                                         CREAR EQUIPO

POST http://0.0.0.0:8000/api/teams
    Body
        {
            "name": "equipo peobADNO",
            "description": "adisos"
            }

    Response
        {
            "id": 5,
            "name": "equipo peobADNO",
            "description": "adisos",
            "created_at": "2025-05-14T05:15:27.830Z",
            "updated_at": "2025-05-14T05:15:27.830Z"
        }

                                                                      ASIGNAR USUARIOS A EQUIPO

POST http://0.0.0.0:8000/api/teams/:id/users
    Body
        {
        "user_ids": [38]
        }

    Response
        {
            "message": "Usuarios asignados correctamente"
        }

                                                                        ASIGNAR LEADS A EQUIPO

POST http://0.0.0.0:8000/api/teams/:id/leads
    Body
        {
            "lead_ids": [3, 8]
        }

    Response
        {
            "success": true
        }

                                                                        OBTENER LEADS DE UN EQUIPO

GET http://0.0.0.0:8000/api/teams/:id/leads

    Response
        {
            "leads": [
                {
                    "id": 8,
                    "name": "Machado",
                    "email": null,
                    "phone": null,
                    "address": "Benimaclet, 46020 Valencia, Spain",
                    "city": null,
                    "postal_code": null,
                    "country": "España",
                    "type": null,
                    "status": "nuevo",
                    "priority": "media",
                    "assigned_to": 35,
                    "notes": null,
                    "estimated_value": null,
                    "created_at": "2025-05-07T12:50:51.374Z",
                    "updated_at": "2025-05-14T07:24:09.548Z",
                    "last_contact": "2025-05-13T09:28:00.510Z",
                    "next_followup": null,
                    "coordinates": {
                        "latitude": 39.4927329,
                        "longitude": -0.3585983
                    },
                    "tags": null,
                    "place_id": "ChIJGeWKGBlGYA0RZAAM2LfzZ0M",
                    "rating": "3.90",
                    "category": "subway_station",
                    "latitude": 39.4927329,
                    "longitude": -0.3585983,
                    "team_id": 1,
                    "assigned_user_name": "kojima5"
                },
                {
                    "id": 3,
                    "name": "María Rodríguez",
                    "email": "maria@ejemplo.com",
                    "phone": "+34 622334455",
                    "address": "Av. Principal 10",
                    "city": "Barcelona",
                    "postal_code": "08001",
                    "country": "España",
                    "type": "individual",
                    "status": "contactado",
                    "priority": "media",
                    "assigned_to": 24,
                    "notes": "Interesada en servicios de consultoría",
                    "estimated_value": "2500.00",
                    "created_at": "2025-05-06T12:01:13.015Z",
                    "updated_at": "2025-05-13T12:10:21.223Z",
                    "last_contact": null,
                    "next_followup": null,
                    "coordinates": null,
                    "tags": [
                        "retail",
                        "consultoria"
                    ],
                    "place_id": null,
                    "rating": null,
                    "category": null,
                    "latitude": null,
                    "longitude": null,
                    "team_id": 1,
                    "assigned_user_name": "Administrador Test"
                }
            ],
            "total": 2
        }

                                                                        OBTENER MIEMBROS DE UN EQUIPO

GET http://0.0.0.0:8000/api/teams/:id/members

    Response
        [
            {
                "id": 32,
                "team_id": 1,
                "user_id": 32,
                "name": "kojima3",
                "email": "hola@hola.es",
                "role": "admin"
            },
            {
                "id": 35,
                "team_id": 1,
                "user_id": 35,
                "name": "kojima5",
                "email": "hola@hofdfla.com",
                "role": "admin"
            },
            {
                "id": 33,
                "team_id": 1,
                "user_id": 33,
                "name": "kojima4",
                "email": "hola@hola.com",
                "role": "admin"
            },
            {
                "id": 38,
                "team_id": 1,
                "user_id": 38,
                "name": "kojimanager",
                "email": "hola@manager.com",
                "role": "manager"
            }
        ]
        
                                                                      OBTENER LEADS

GET http://0.0.0.0:8000/api/leads             o GET http://0.0.0.0:8000/api/leads/:id para obtener un lead en concreto

    Response
        {
            "leads": [
                 {
                    "id": 100,
                    "name": "Restaurante BELLEVUE",
                    "email": null,
                    "phone": null,
                    "address": "Pje. Recogidas, 1, Ronda, 18005 Granada, España",
                    "city": null,
                    "postal_code": null,
                    "country": "España",
                    "type": null,
                    "status": "contactado",
                    "priority": "media",
                    "assigned_to": 37,
                    "notes": "Hola",
                    "estimated_value": null,
                    "created_at": "2025-05-12T08:01:01.435Z",
                    "updated_at": "2025-05-13T14:44:13.569Z",
                    "last_contact": "2025-05-15T08:00:00.000Z",
                    "next_followup": null,
                    "coordinates": {
                        "latitude": 37.1714873,
                        "longitude": -3.6027867
                    },
                    "tags": null,
                    "place_id": "ChIJb54r6v39cQ0R3_Tf4ajNhbI",
                    "rating": "4.60",
                    "category": "restaurant"
                } 
            ],
            "pagination": {
                "total": 122,
                "page": 1,
                "limit": 20,
                "pages": 7
            }
        }

                                                                CAMBIAR ESTADO DE LEAD

PATCH http://0.0.0.0:8000/api/leads/:id/status
    Body
        {
            "status": "nuevo"
        }

    Response
        {
            "message": "Estado de lead actualizado correctamente",
            "lead": {
                "id": 8,
                "name": "Machado",
                "email": null,
                "phone": null,
                "address": "Benimaclet, 46020 Valencia, Spain",
                "city": null,
                "postal_code": null,
                "country": "España",
                "type": null,
                "status": "nuevo",
                "priority": "media",
                "assigned_to": 35,
                "notes": null,
                "estimated_value": null,
                "created_at": "2025-05-07T12:50:51.374Z",
                "updated_at": "2025-05-14T07:22:07.334Z",
                "last_contact": "2025-05-13T09:28:00.510Z",
                "next_followup": null,
                "coordinates": {
                    "latitude": 39.4927329,
                    "longitude": -0.3585983
                },
                "tags": null,
                "place_id": "ChIJGeWKGBlGYA0RZAAM2LfzZ0M",
                "rating": "3.90",
                "category": "subway_station",
                "latitude": 39.4927329,
                "longitude": -0.3585983,
                "team_id": 1
            }
        }

