                                                    OBTENER CHECKINS

GET http://0.0.0.0:8000/api/checkins
    Response
        [
            {
                "id": 6,
                "user_id": 35,
                "lead_id": 8,
                "timestamp": "2025-05-13T08:38:32.918Z",
                "location_lat": null,
                "location_lng": null,
                "status": "nuevo",
                "notes": "Primera interacción con el lead",
                "attachment_urls": [],
                "created_at": "2025-05-13T08:38:32.918Z",
                "updated_at": "2025-05-13T08:38:32.918Z",
                "check_in_type": null,
                "distance": null,
                "user_name": "kojima5",
                "lead_name": "Machado"
            },
            {
                "id": 5,
                "user_id": 32,
                "lead_id": 4,
                "timestamp": "2025-05-12T08:54:09.787Z",
                "location_lat": 39.46985,
                "location_lng": -0.37696,
                "status": "interesado",
                "notes": "prueba de checkin 2",
                "attachment_urls": [
                    "/uploads/be1cb9f2-fd97-4ac3-8156-ed12a8f69ca7.png"
                ],
                "created_at": "2025-05-12T08:54:09.787Z",
                "updated_at": "2025-05-12T08:54:09.787Z",
                "check_in_type": "auto",
                "distance": null,
                "user_name": "kojima3",
                "lead_name": "Ayuntamiento de Valencia"
            },
            {
                "id": 3,
                "user_id": 32,
                "lead_id": 4,
                "timestamp": "2025-05-12T06:54:30.210Z",
                "location_lat": 39.4698437,
                "location_lng": -0.3769634,
                "status": "seguimiento",
                "notes": "Check-in de prueba",
                "attachment_urls": [
                    null
                ],
                "created_at": "2025-05-12T06:54:30.210Z",
                "updated_at": "2025-05-12T06:54:30.210Z",
                "check_in_type": null,
                "distance": null,
                "user_name": "kojima3",
                "lead_name": "Ayuntamiento de Valencia"
            }
        ]

                                                        CREAR CHECKIN

POST http://0.0.0.0:8000/api/checkins
    Body
        {
            "lead_id": 19,
            "status": "ganado",
            "notes": "probando gamificacion",
            "attachment_urls": []
        }

    Response
        {
            "id": 11,
            "user_id": 40,
            "lead_id": 19,
            "timestamp": "2025-05-14T05:55:19.614Z",
            "location_lat": null,
            "location_lng": null,
            "status": "ganado",
            "notes": "probando gamificacion",
            "attachment_urls": [],
            "created_at": "2025-05-14T05:55:19.614Z",
            "updated_at": "2025-05-14T05:55:19.614Z",
            "check_in_type": null,
            "distance": null
        }