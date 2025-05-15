#                                                            OBTENER RUTA OPTIMIZADA PARA USUARIO

GET http://0.0.0.0:8000/api/directions/:id
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