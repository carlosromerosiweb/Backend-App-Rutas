                                                                            LOGIN

POST http://0.0.0.0:8000/api/login

    Body
        {
            "email":"hola@hofdfla.com",
            "password": "kojima123"
        } 

    Response
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzUsInVzZXJJZCI6MzUsImVtYWlsIjoiaG9sYUBob2ZkZmxhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzIwNjQxMCwiZXhwIjoxNzQ3MjkyODEwfQ.ADUjknf1o-5Ax-EcjIWxJUCQdGcxdBdatMG8K9Sxk-0",
            "user": {
                "id": 35,
                "email": "hola@hofdfla.com",
                "name": "kojima5",
                "role": "admin"
            }
        }


                                                                            REGISTER

POST http://0.0.0.0:8000/api/register
    Body
        {
            "name": "kojimanager",
            "password": "kojima123",
            "role": "manager",
            "email": "hola@manager.com"
        }

    Response
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzksInVzZXJJZCI6MzksImVtYWlsIjoiaG9sZHNhQG1hbmFnZXIuY29tIiwicm9sZSI6Im1hbmFnZXIiLCJpYXQiOjE3NDcyMDY4NTUsImV4cCI6MTc0NzI5MzI1NX0.JDH-IHzQsYgO-szg3HFPm5lAJb75Q7ZDl32SVK0D2MI",
            "user": {
                "id": 39,
                "email": "holdsa@manager.com",
                "name": "kojimanagesr",
                "role": "manager"
            }
        }

                                                                        CAMBIAR CONTRASEÑA

PUT http://0.0.0.0:8000/api/change-password
    Body
        {
            "currentPassword": "kojima123",
            "newPassword": "kojima123"
        }

    Response
        {
            "message": "Contraseña actualizada exitosamente",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzUsInVzZXJJZCI6MzUsImVtYWlsIjoiaG9sYUBob2ZkZmxhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzIwNzQ5NSwiZXhwIjoxNzQ3MjkzODk1fQ.IQYMo9qc07pANjtD29GO2ZV44Df5i_yWg1cNwJ54dsw"
        }

