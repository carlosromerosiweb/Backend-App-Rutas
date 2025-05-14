                                                OBTENER RUTAS OPTIMIZADAS

GET http://0.0.0.0:8000/api/routes/optimized
    Body:
        {
            "route_summary": {
                "total_distance": 3584.44,
                "total_duration": 2559
            },
            "steps": [
                {
                    "order": 1,
                    "lead_name": "Ayuntamiento de Valencia",
                    "address": "Plaza Ayuntamiento 1",
                    "latitude": 39.4698437,
                    "longitude": -0.3769634,
                    "distance_to_next": 0,
                    "duration_to_next": 0
                },
                {
                    "order": 2,
                    "lead_name": "Colón",
                    "address": "Ciutat Vella, 46004 Valencia, Spain",
                    "latitude": 39.47014619999999,
                    "longitude": -0.3709278,
                    "distance_to_next": 1.34,
                    "duration_to_next": 7
                },
                {
                    "order": 3,
                    "lead_name": "Alameda",
                    "address": "Metro Alameda, El Llano del Real, 46010 Valencia, Spain",
                    "latitude": 39.4735843,
                    "longitude": -0.3654685,
                    "distance_to_next": 1.603,
                    "duration_to_next": 8
                }
            ],
            "origin": {
                "latitude": 39.4698437,
                "longitude": -0.3769634
            },
            "date": "2025-05-14"
        }
