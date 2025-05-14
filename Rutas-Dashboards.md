                                                OBTENER DASHBOARD DE ADMIN

GET http://0.0.0.0:8000/api/dashboard/overview
    
    Response
        {
            "success": true,
            "data": {
                "leads_summary": {
                    "total": 122,
                    "by_status": [
                        {
                            "status": "nuevo",
                            "count": 118
                        },
                        {
                            "status": "contactado",
                            "count": 2
                        },
                        {
                            "status": "interesado",
                            "count": 2
                        }
                    ],
                    "won": 0,
                    "lost": 0,
                    "conversion_rate": 0,
                    "pending_followups": 1,
                    "inactive": 0
                },
                "checkins_summary": {
                    "total": 3,
                    "by_day": [
                        {
                            "date": "2025-05-12T22:00:00.000Z",
                            "count": 1
                        },
                        {
                            "date": "2025-05-11T22:00:00.000Z",
                            "count": 2
                        }
                    ],
                    "by_city": [
                        {
                            "city": "Valencia",
                            "count": 2
                        },
                        {
                            "city": null,
                            "count": 1
                        }
                    ],
                    "total_distance": 0,
                    "estimated_cost": 0
                },
                "users_summary": {
                    "by_role": [
                        {
                            "role": "admin",
                            "count": 13
                        },
                        {
                            "role": "user",
                            "count": 1
                        },
                        {
                            "role": "manager",
                            "count": 4
                        },
                        {
                            "role": "comercial",
                            "count": 21
                        }
                    ]
                },
                "activity_summary": {
                    "last_30_days": {
                        "checkins": 2,
                        "new_leads": 122
                    }
                }
            }
        }

                                                        OBTENER DASHBOARD DE MANAGER

GET http://0.0.0.0:8000/api/dashboard/manager/overview
    
    Response
        {
            "teamOverview": [
                {
                    "team_id": 1,
                    "team_name": "equipo q saluda",
                    "total_users": "4",
                    "total_checkins": "3",
                    "total_leads": "2",
                    "total_sales": "0",
                    "avg_duration_minutes": "0.00000000000000000000",
                    "conversion_rate": 0
                }
            ],
            "teamRanking": [
                {
                    "user_id": 32,
                    "user_name": "kojima3",
                    "total_checkins": "2",
                    "total_leads": "1",
                    "total_sales": "0",
                    "avg_duration_minutes": "0.00000000000000000000",
                    "conversion_rate": 0,
                    "sales_rank": "1",
                    "conversion_rank": "1"
                },
                {
                    "user_id": 33,
                    "user_name": "kojima4",
                    "total_checkins": "0",
                    "total_leads": "0",
                    "total_sales": "0",
                    "avg_duration_minutes": "0",
                    "conversion_rate": 0,
                    "sales_rank": "1",
                    "conversion_rank": "1"
                },
                {
                    "user_id": 35,
                    "user_name": "kojima5",
                    "total_checkins": "1",
                    "total_leads": "1",
                    "total_sales": "0",
                    "avg_duration_minutes": "0.00000000000000000000",
                    "conversion_rate": 0,
                    "sales_rank": "1",
                    "conversion_rank": "1"
                },
                {
                    "user_id": 38,
                    "user_name": "kojimanager",
                    "total_checkins": "0",
                    "total_leads": "1",
                    "total_sales": "0",
                    "avg_duration_minutes": "0",
                    "conversion_rate": 0,
                    "sales_rank": "1",
                    "conversion_rank": "1"
                }
            ],
            "leadsStatus": [
                {
                    "id": 4,
                    "lead_name": "Ayuntamiento de Valencia",
                    "status": "interesado",
                    "priority": "media",
                    "type": "gobierno",
                    "next_followup": "2026-03-20T10:00:00.000Z",
                    "estimated_value": "25000.00",
                    "assigned_to": "kojima3",
                    "is_overdue": false
                },
                {
                    "id": 8,
                    "lead_name": "Machado",
                    "status": "nuevo",
                    "priority": "media",
                    "type": null,
                    "next_followup": null,
                    "estimated_value": null,
                    "assigned_to": "kojima5",
                    "is_overdue": false
                }
            ],
            "delayedCheckins": []
        }