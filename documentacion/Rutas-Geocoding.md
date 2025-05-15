#                                                            GEOCODIFICAR LEAD
#                        Geocodificar consiste en transformar una dirección en coordenadas (latitud y longitud)

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

                                                            