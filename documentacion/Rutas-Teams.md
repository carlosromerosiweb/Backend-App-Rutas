#                                                                         CREAR EQUIPO

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

#                                                                       ACTUALIZAR EQUIPO

PUT http://0.0.0.0:8000/api/teams/:id
    Body
        {
            "name": "el super equipo",
            "description": "Nueva Descripción"
        }
    
    Response
        {
            "id": 3,
            "name": "el super equipo",
            "description": "Nueva Descripción",
            "created_at": "2025-05-13T11:43:16.693Z",
            "updated_at": "2025-05-13T11:43:16.693Z"
        }

#                                                                         BORRAR EQUIPO

DELETE http://0.0.0.0:8000/api/teams/4
    Response
        {
            "message": "Equipo eliminado exitosamente",
            "team_id": 7
        }

#                                                                        OBTENER EQUIPOS

GET http://0.0.0.0:8000/api/teams          o http://0.0.0.0:8000/api/teams/:id para obtener el equipo según el ID
    Response 
        {
            "teams": [
                {
                    "id": 6,
                    "name": "Equipo Alpha",
                    "description": null,
                    "created_at": "2025-05-14T05:54:39.884Z",
                    "updated_at": "2025-05-14T05:54:39.884Z"
                },
                {
                    "id": 5,
                    "name": "equipo peobADNO",
                    "description": "adisos",
                    "created_at": "2025-05-14T05:15:27.830Z",
                    "updated_at": "2025-05-14T05:15:27.830Z"
                },
                {
                    "id": 4,
                    "name": "equipo q despide",
                    "description": "adios",
                    "created_at": "2025-05-13T11:43:31.153Z",
                    "updated_at": "2025-05-13T11:43:31.153Z"
                },
                {
                    "id": 3,
                    "name": "equipo 4q saluda",
                    "description": "hola",
                    "created_at": "2025-05-13T11:43:16.693Z",
                    "updated_at": "2025-05-13T11:43:16.693Z"
                },
                {
                    "id": 1,
                    "name": "equipo q saluda",
                    "description": "hola",
                    "created_at": "2025-05-13T11:36:15.967Z",
                    "updated_at": "2025-05-13T11:36:15.967Z"
                }
            ],
            "total": 5
        }

#                                                                      ASIGNAR USUARIOS A EQUIPO

POST http://0.0.0.0:8000/api/teams/:id/users
    Body
        {
        "user_ids": [38]
        }

    Response
        {
            "message": "Usuarios asignados correctamente"
        }

#                                                                     DESASIGNAR USUARIOS DE EQUIPO

DELETE http://0.0.0.0:8000/api/teams/:id/users
    Body
        {
            "user_ids": [33]  
        }

    Response
        {
            "message": "Usuarios desasignados correctamente",
            "team_id": 1,
            "removed_users": [
                33
            ]
        }


#                                                                        ASIGNAR LEADS A EQUIPO

POST http://0.0.0.0:8000/api/teams/:id/leads
    Body
        {
            "lead_ids": [3, 8]
        }

    Response
        {
            "success": true
        }

#                                                                        ELIMINAR LEADS DEL EQUIPO

DELETE http://0.0.0.0:8000/api/teams/:id/leads
    Body
        {
            "lead_ids": [15]
        }

    Response
        {
            "message": "Leads eliminados del equipo exitosamente"
        }

#                                                                        OBTENER LEADS DE UN EQUIPO

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

#                                                                       OBTENER MIEMBROS DE UN EQUIPO

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
        