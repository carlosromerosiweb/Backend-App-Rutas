#                                                            OBTENER RUTA OPTIMIZADA PARA USUARIO

GET http://0.0.0.0:8000/api/directions/:id                     <== endpoint para ruta  en coche
    http://0.0.0.0:8000/api/directions/walking/:id             <== endpoint para ruta andando  
    Response
        {
            "route_summary": {
                "total_distance": 724.81,
                "total_duration": 433
            },
            "steps": [
                {
                    "order": 1,
                    "lead_id": 8,
                    "lead_name": "Machado",
                    "address": "Benimaclet, 46020 Valencia, Spain",
                    "latitude": 39.4927329,
                    "longitude": -0.3585983,
                    "distance_to_next": 0,
                    "duration_to_next": 0
                },
                {
                    "order": 2,
                    "lead_id": 107,
                    "lead_name": "Restaurante Vinitus",
                    "address": "Gran Vía, 4, Centro, 28013 Madrid, España",
                    "latitude": 40.4193514,
                    "longitude": -3.697675099999999,
                    "distance_to_next": 362.183,
                    "duration_to_next": 218
                }
            ],
            "origin": {
                "latitude": 39.4927329,
                "longitude": -0.3585983
            },
            "date": "2025-05-14"
        }

#                                                OBTENER RUTA OPTIMIZADA DE TODOS LOS MIEMBROS DEL EQUIPO

GET http://0.0.0.0:8000/api/directions/team/:id                     <== endpoint para ruta en coche
    http://0.0.0.0:8000/api/directions/team/walking/:id             <== endpoint para ruta andando 

    Response
                {
            "37": {
                "route_summary": {
                    "total_distance": 1894.28,
                    "total_duration": 1090
                },
                "steps": [
                    {
                        "order": 1,
                        "lead_id": 15,
                        "lead_name": "Mislata",
                        "address": "46920 Mislata, Valencia, Spain",
                        "latitude": 39.473988,
                        "longitude": -0.418064,
                        "distance_to_next": 0,
                        "duration_to_next": 0
                    },
                    {
                        "order": 2,
                        "lead_id": 129,
                        "lead_name": "HYD SUSHI",
                        "address": "Av. do Fragoso, 90, bajo, Coia, 36210 Vigo, Pontevedra, España",
                        "latitude": 42.2130979,
                        "longitude": -8.7391551,
                        "distance_to_next": 948.05,
                        "duration_to_next": 547
                    }
                ],
                "origin": {
                    "latitude": 39.473988,
                    "longitude": -0.418064
                },
                "date": "2025-05-15"
            }
        }