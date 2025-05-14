    
    El GEOCODING consiste en transformar una dirección normal en coordenadas.
    Por ejemplo, en pasar de "Calle Mayor 123, Madrid, España" a "latitud: 40.4168, longitud: -3.7038"

                                                           
                                                               GEOCODIFICAR UN LEAD

POST http://0.0.0.0:8000/api/geocode/lead/:id

    Body
        // debe ir vacío

    Response
        {
    "message": "Coordenadas actualizadas correctamente",
    "lead": {
        "id": 129,
        "name": "HYD SUSHI",
        "email": null,
        "phone": null,
        "address": "Av. do Fragoso, 90, bajo, Coia, 36210 Vigo, Pontevedra, España",
        "city": null,
        "postal_code": null,
        "country": "España",
        "type": "empresa",
        "status": "nuevo",
        "priority": "media",
        "assigned_to": 37,
        "notes": null,
        "estimated_value": null,
        "created_at": "2025-05-14T06:05:57.859Z",
        "updated_at": "2025-05-14T11:58:49.922Z",
        "last_contact": null,
        "next_followup": null,
        "coordinates": {
            "latitude": 42.2130676,
            "longitude": -8.7392436
        },
        "tags": null,
        "place_id": "ChIJYVDg7xmJJQ0RjM0WVK59aoc",
        "rating": "4.40",
        "category": "restaurant",
        "latitude": 42.2130979,
        "longitude": -8.7391551,
        "team_id": 6
    }
}

                                                            OBTENER RUTAS OPTIMIZADAS

GET http://0.0.0.0:8000/api/routes/optimized
    Response
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

                                                             OBTENER RUTAS OPTIMIZADAS POR USUARIO (por implementar)

GET http://0.0.0.0:8000/api/directions/:id
