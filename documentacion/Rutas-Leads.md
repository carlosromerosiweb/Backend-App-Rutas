
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

#                                                                           IMPORTAR LEADS DE UN .CSV 
#                                          (ahora mismo el .csv tiene que tener una estructura completa, pero lo ideal sería más adelante 
#                                                 modificar el método para que pueda adaptar diferentes estructuras a la nuestra)

POST http://0.0.0.0:8000/api/import/leads
    Body (en form-data)
        Key: file        
        Type: file
        Value: archivoQueSeQuieraImportar.csv

    Response
        {
            "message": "Importación completada",
            "stats": {
                "total": 5,
                "success": 4,
                "failed": 1
            },
            "errors": [
                {
                    "line": 1,
                    "error": "Error al crear el lead en la base de datos"
                }
            ]
        }

#                                                                   EXPORTAR LEADS A .CSV

GET http://0.0.0.0:8000/api/leads/export    
    http://0.0.0.0:8000/api/leads/export?status=nuevo     <== acepta filtros
    Response
        ID,Nombre,Email,Teléfono,Dirección,Ciudad,Estado,Prioridad,Fecha creación,Último contacto,Próximo seguimiento,Categoría,Calificación,Latitud,Longitud,Asignado a
        ID,Nombre,Email,Teléfono,Dirección,Ciudad,Estado,Prioridad,Fecha creación,Último contacto,Próximo seguimiento,Categoría,Calificación,Latitud,Longitud,Asignado a
        137,Tech Solutions SL,info@techsolutions.com,'+34 956789012,Parque Tecnológico 15,Sevilla,nuevo,alta,2025-05-16 09:38:36,,2024-03-29 00:00:00,,,,,
        136,ONG Ayuda,info@ongayuda.org,'+34 945678901,Calle Solidaridad 78,Bilbao,nuevo,baja,2025-05-16 09:38:36,,2024-03-28 01:00:00,,,,,
        135,Gobierno Local,ayuntamiento@ciudad.com,'+34 934567890,Plaza del Ayuntamiento 1,Valencia,nuevo,alta,2025-05-16 09:38:36,,2024-03-27 01:00:00,,,,,
        134,Juan Pérez,juan.perez@email.com,'+34 623456789,Avenida Libertad 45,Barcelona,nuevo,media,2025-05-16 09:38:35,,2024-03-26 01:00:00,,,,,
        133,Taberna A Mina,,886 31 24 88,"Rúa San Vicente, 8, 36202 Vigo, Pontevedra",,nuevo,media,2025-05-15 10:32:57,,,bar,4.40,42.2382698,-8.7272146,
        132,Detapaencepa,,986 47 37 57,"R. do Ecuador, 18, Santiago de Vigo, 36203 Vigo, Pontevedra",,nuevo,media,2025-05-15 10:32:56,,,restaurant,4.60,42.234346,-8.7226465,
        131,Restaurante Casa Vella,,986 43 31 21,"Rúa Pescadería, 1, Bajo Derecha, 36202 Vigo, Pontevedra",,nuevo,media,2025-05-15 10:32:56,,,restaurant,4.60,42.2399228,-8.7257081,
        129,HYD SUSHI,,,"Av. do Fragoso, 90, bajo, Coia, 36210 Vigo, Pontevedra, España",,nuevo,media,2025-05-14 08:05:57,,,restaurant,4.40,42.2130979,-8.7391551,37
        128,Restaurante Tsuki,,,"R. Enrique Xabier Macías, 7, Freixeiro, 36203 Vigo, Pontevedra, España",,nuevo,media,2025-05-14 08:05:56,,,restaurant,4.40,42.2271334,-8.7263747,
        127,Restaurante La Marmita,,,"C. del Príncipe, 3, Centro, 28012 Madrid, España",,nuevo,media,2025-05-14 08:05:28,,,restaurant,4.10,40.4162528,-3.7002245,
        126,"JAVIER MARTÍN, COMIDA DELICIOSA, BURGERS & CROQUETAS,CHEESECAKE HOME.",,,"C. de Toledo, 74, Centro, 28005 Madrid, España",,nuevo,media,2025-05-14 08:05:27,,,restaurant,4.60,40.4094079,-3.7100137,