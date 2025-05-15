
#                                                                      CREAR LEAD

POST http://0.0.0.0:8000/api/leads
    Body
        {
            "name": "Restaurante La Terraza",
            "email": "contacto@laterraza.com",
            "phone": "+34612345678",
            "address": "Calle Mayor 123, Madrid",
            "city": "Madrid",
            "postal_code": "28001",
            "country": "España",
            "type": "individual",
            "status": "nuevo",
            "priority": "alta",
            "notes": "Cliente potencial interesado en nuestro servicio premium",
            "estimated_value": 5000,
            "coordinates": {
                "latitude": 40.4168,
                "longitude": -3.7038
            },
            "tags": ["restaurante", "premium", "madrid"]
        }

    Response
        {
            "message": "Lead creado correctamente",
            "lead": {
                "id": 130,
                "name": "Restaurante La Terraza",
                "email": "contacto@laterraza.com",
                "phone": "+34612345678",
                "address": "Calle Mayor 123, Madrid",
                "city": "Madrid",
                "postal_code": "28001",
                "country": "España",
                "type": "individual",
                "status": "nuevo",
                "priority": "alta",
                "assigned_to": null,
                "notes": "Cliente potencial interesado en nuestro servicio premium",
                "estimated_value": "5000.00",
                "created_at": "2025-05-14T07:19:55.006Z",
                "updated_at": "2025-05-14T07:19:55.006Z",
                "last_contact": null,
                "next_followup": null,
                "coordinates": {
                    "latitude": 40.4168,
                    "longitude": -3.7038
                },
                "tags": [
                    "restaurante",
                    "premium",
                    "madrid"
                ],
                "place_id": null,
                "rating": null,
                "category": null,
                "latitude": null,
                "longitude": null,
                "team_id": null
            }
        }

#                                                                     ELIMINAR LEAD

DELETE http://0.0.0.0:8000/api/leads/:id
    Response
        {
            "message": "Lead eliminado correctamente"
        }
#                                                                      OBTENER LEADS

GET http://0.0.0.0:8000/api/leads             
    http://0.0.0.0:8000/api/leads/:id para obtener un lead en concreto
    http://0.0.0.0:8000/api/leads?status=nuevo&priority=media&category=bar los filtros se establecen de esta manera

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

#                                                                CAMBIAR ESTADO DE LEAD

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

#                                                                    ACTUALIZAR LEAD

PUT http://0.0.0.0:8000/api/leads/:id
    Body
        {
            "email": "nuevo@laterraza.com",
            "phone": "+34698765432",
            "notes": "Actualización de información de contacto",
            "estimated_value": 7500
        }

    Response
        {
            "message": "Lead actualizado correctamente",
            "lead": {
                "id": 130,
                "name": "Restaurante La Terraza",
                "email": "nuevo@laterraza.com",
                "phone": "+34698765432",
                "address": "Calle Mayor 123, Madrid",
                "city": "Madrid",
                "postal_code": "28001",
                "country": "España",
                "type": "individual",
                "status": "nuevo",
                "priority": "alta",
                "assigned_to": null,
                "notes": "Actualización de información de contacto",
                "estimated_value": "7500.00",
                "created_at": "2025-05-14T07:19:55.006Z",
                "updated_at": "2025-05-14T09:23:56.986Z",
                "last_contact": null,
                "next_followup": null,
                "coordinates": {
                    "latitude": 40.4168,
                    "longitude": -3.7038
                },
                "tags": [
                    "restaurante",
                    "premium",
                    "madrid"
                ],
                "place_id": null,
                "rating": null,
                "category": null,
                "latitude": null,
                "longitude": null,
                "team_id": null
            }
        }

#                                                                ASIGNAR LEAD A USUARIO

POST http://0.0.0.0:8000/api/leads/:id/assign
    Body
        {
            "userId": 38,
            "notes": "Asignación del lead" // opcional
        }

    Response
        {
            "message": "Lead asignado correctamente",
            "lead": {
                "id": 9,
                "name": "Campanar",
                "email": null,
                "phone": null,
                "address": "Campanar, 46015 Valencia, Spain",
                "city": null,
                "postal_code": null,
                "country": "España",
                "type": null,
                "status": "nuevo",
                "priority": "media",
                "assigned_to": 38,
                "notes": null,
                "estimated_value": null,
                "created_at": "2025-05-07T12:50:52.223Z",
                "updated_at": "2025-05-14T07:38:39.708Z",
                "last_contact": null,
                "next_followup": null,
                "coordinates": {
                    "latitude": 39.484131,
                    "longitude": -0.394831
                },
                "tags": null,
                "place_id": "ChIJ_9ccP2BPYA0RYitW5nH2vGQ",
                "rating": "4.50",
                "category": "subway_station",
                "latitude": 39.484131,
                "longitude": -0.394831,
                "team_id": null
            }
        }

#                                                            IMPORTAR LEADS POR GOOGLE //usando API de Google

POST http://0.0.0.0:8000/api/leads/import/detailed
    Body
        {
        "keyword": "cafeteria",
        "type": "restaurant",
        "lat": 42.23,
        "lng": -8.72,
        "radius": 5000,
        "rating_min": 4.0,
        "open_now": false,
        "maxResults": 1
        }

    Response
        {
            "message": "Importación detallada completada",
            "imported": 1,
            "skipped": 0,
            "data": [
                {
                    "id": 131,
                    "name": "Restaurante Casa Vella",
                    "address": "Rúa Pescadería, 1, Bajo Derecha, 36202 Vigo, Pontevedra",
                    "phone": "986 43 31 21",
                    "coordinates": {
                        "lat": 42.2399228,
                        "lng": -8.7257081
                    },
                    "rating": 4.6,
                    "category": "restaurant",
                    "website": "http://restaurantecasavellavigo.com/",
                    "opening_hours": {
                        "open_now": true,
                        "periods": [
                            {
                                "close": {
                                    "day": 1,
                                    "time": "1600"
                                },
                                "open": {
                                    "day": 1,
                                    "time": "1200"
                                }
                            },
                            {
                                "close": {
                                    "day": 1,
                                    "time": "2300"
                                },
                                "open": {
                                    "day": 1,
                                    "time": "2015"
                                }
                            }
                        ],
                        "weekday_text": [
                            "Monday: 12:00 – 4:00 PM, 8:15 – 11:00 PM",
                            "Tuesday: 12:00 – 4:00 PM, 8:15 – 11:00 PM",
                            "Wednesday: Closed",
                            "Thursday: 12:00 – 4:00 PM, 8:15 – 11:00 PM",
                            "Friday: 12:00 – 4:00 PM, 8:15 – 11:00 PM",
                            "Saturday: 12:30 – 4:00 PM, 8:15 – 11:00 PM",
                            "Sunday: Closed"
                        ]
                    }
                }
            ]
        }


