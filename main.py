from flask import Flask, request, Response, jsonify
import os
import json
import datetime
import requests
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET', 'default_secret_change_in_production')
app.config['DATABASE_URL'] = os.environ.get('DATABASE_URL')
app.config['NODE_API_URL'] = 'http://localhost:8000'  # URL del servidor Node.js

# Configuración de la base de datos
def get_db_connection():
    """Obtener conexión a la base de datos PostgreSQL"""
    conn = psycopg2.connect(app.config['DATABASE_URL'])
    conn.autocommit = True
    return conn

# Token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            
            # Get user from database
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id, email, name, role FROM users WHERE id = %s", (data['userId'],))
            current_user = cur.fetchone()
            cur.close()
            conn.close()
            
            if not current_user:
                return jsonify({'message': 'Invalid token: User not found'}), 401
                
        except Exception as e:
            return jsonify({'message': f'Invalid token: {str(e)}'}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

@app.route('/')
def index():
    return """
    <html>
    <head>
        <title>API Backend para Rutas Comerciales</title>
        <link href="https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css" rel="stylesheet">
    </head>
    <body class="p-3">
        <div class="container">
            <h1 class="mt-5">API Backend para la aplicación de rutas comerciales</h1>
            <p class="lead">Esta aplicación proporciona un backend API para la aplicación de rutas comerciales.</p>
            
            <div class="card mt-4">
                <div class="card-header">
                    Endpoints disponibles
                </div>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item">/api/register - Registro de usuario</li>
                    <li class="list-group-item">/api/login - Inicio de sesión</li>
                    <li class="list-group-item">/api/me - Perfil del usuario (requiere autenticación)</li>
                </ul>
            </div>
            
            <div class="card mt-4">
                <div class="card-header">
                    Proxy API
                </div>
                <div class="card-body">
                    <p>Para evitar problemas de CORS, puedes usar cualquiera de estos endpoints de proxy:</p>
                    <p><code>/proxy/{ruta-de-api}</code> - Redirigirá al servidor Node.js</p>
                    <p><code>/nodeapi/{ruta-de-api}</code> - Alternativa más corta</p>
                    <p class="mt-2">Ejemplos:</p>
                    <ul>
                        <li><code>/proxy/api/login</code> redirigirá a Node.js</li>
                        <li><code>/nodeapi/api/login</code> hará lo mismo</li>
                    </ul>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

@app.route('/health')
def health():
    return {"status": "healthy"}, 200

@app.route('/api')
def api_root():
    return {
        "message": "API Backend para la aplicación de rutas comerciales",
        "version": "1.0.0",
        "endpoints": [
            "/register - Registro de usuario",
            "/login - Inicio de sesión",
            "/me - Perfil del usuario (requiere autenticación)"
        ]
    }

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No se proporcionaron datos'}), 400
        
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role')
    
    # Validar datos obligatorios
    if not email or not password or not name or not role:
        return jsonify({'message': 'Faltan datos obligatorios (email, password, name, role)'}), 400
        
    # Validar que el rol sea correcto
    valid_roles = ['comercial', 'manager', 'admin']
    if role not in valid_roles:
        return jsonify({'message': f'Rol no válido. Debe ser uno de: {", ".join(valid_roles)}'}), 400
    
    # Verificar si el email ya existe
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Verificar si el usuario ya existe
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'message': 'El email ya está registrado'}), 409
            
        # Crear hash del password
        hashed_password = generate_password_hash(password)
        
        # Insertar usuario en la base de datos
        cur.execute(
            "INSERT INTO users (email, password, name, role) VALUES (%s, %s, %s, %s) RETURNING id, email, name, role",
            (email, hashed_password, name, role)
        )
        
        new_user = cur.fetchone()
        
        # Generar token
        token = jwt.encode({
            'userId': new_user['id'],
            'email': new_user['email'],
            'role': new_user['role'],
            'iat': datetime.datetime.utcnow(),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        # Construir respuesta
        response = {
            'token': token,
            'user': {
                'id': new_user['id'],
                'email': new_user['email'],
                'name': new_user['name'],
                'role': new_user['role']
            }
        }
        
        return jsonify(response), 201
        
    except Exception as e:
        print(f"Error al registrar usuario: {str(e)}")
        return jsonify({'message': f'Error al registrar usuario: {str(e)}'}), 500
        
    finally:
        cur.close()
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No se proporcionaron datos'}), 400
        
    email = data.get('email')
    password = data.get('password')
    
    # Validar datos obligatorios
    if not email or not password:
        return jsonify({'message': 'Faltan datos obligatorios (email, password)'}), 400
    
    # Verificar credenciales
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user or not check_password_hash(user['password'], password):
            return jsonify({'message': 'Credenciales inválidas'}), 401
            
        # Generar token
        token = jwt.encode({
            'userId': user['id'],
            'email': user['email'],
            'role': user['role'],
            'iat': datetime.datetime.utcnow(),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        # Construir respuesta
        response = {
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'role': user['role']
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error al iniciar sesión: {str(e)}")
        return jsonify({'message': f'Error al iniciar sesión: {str(e)}'}), 500
        
    finally:
        cur.close()
        conn.close()

@app.route('/api/me', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({'user': current_user}), 200

@app.route('/list-users', methods=['GET'])
def list_users():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT id, email, name, role, created_at FROM users")
        users = cur.fetchall()
        
        # Convertir a lista de diccionarios para JSON
        users_list = []
        for user in users:
            user_dict = dict(user)
            # Convertir fechas a string para JSON
            if 'created_at' in user_dict and user_dict['created_at']:
                user_dict['created_at'] = user_dict['created_at'].isoformat()
            users_list.append(user_dict)
        
        return jsonify({
            'success': True,
            'message': f'Se encontraron {len(users_list)} usuarios',
            'users': users_list
        })
        
    except Exception as e:
        print(f"Error al listar usuarios: {str(e)}")
        return jsonify({'success': False, 'message': f'Error al listar usuarios: {str(e)}'}), 500
        
    finally:
        cur.close()
        conn.close()

# Interceptar todas las rutas que empiecen con /nodeapi y redirigirlas al proxy
@app.route('/nodeapi/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def nodeapi_proxy(path):
    return proxy(path)

# Función de proxy para reenviar solicitudes al servidor Node.js
@app.route('/proxy/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy(path):
    # Construcción de la URL del servidor Node.js
    target_url = f"{app.config['NODE_API_URL']}/{path}"
    
    # Registrar información para diagnóstico
    print(f"Proxy: Redirigiendo solicitud a {target_url}")
    print(f"Método: {request.method}")
    print(f"Encabezados: {dict(request.headers)}")
    
    # Reenviar los encabezados de la solicitud original (excepto Host)
    headers = {key: value for key, value in request.headers.items() if key.lower() != 'host'}
    
    # Asegurar que se mantiene el encabezado de autorización
    auth_header = request.headers.get('Authorization')
    if auth_header:
        print(f"Encabezado de autorización detectado: {auth_header[:15]}...")
        headers['Authorization'] = auth_header
    
    # Manejar método OPTIONS para preflight
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '86400'  # 24 horas
        return response
    
    try:
        # Obtener el cuerpo de la solicitud
        request_data = request.get_data()
        content_type = request.headers.get('Content-Type', '')
        
        # Para solicitudes JSON, asegurar que los datos se pasan correctamente
        if 'application/json' in content_type:
            try:
                json_data = request.get_json()
                # Reenviar la solicitud al servidor Node.js con datos JSON
                resp = requests.request(
                    method=request.method,
                    url=target_url,
                    headers=headers,
                    json=json_data,
                    cookies=request.cookies,
                    allow_redirects=False,
                    timeout=10
                )
            except Exception as e:
                print(f"Error al procesar JSON: {str(e)}")
                # Fallback a envío de datos brutos
                resp = requests.request(
                    method=request.method,
                    url=target_url,
                    headers=headers,
                    data=request_data,
                    cookies=request.cookies,
                    allow_redirects=False,
                    timeout=10
                )
        else:
            # Para solicitudes no-JSON (como multipart/form-data)
            # Reenviar la solicitud al servidor Node.js
            resp = requests.request(
                method=request.method,
                url=target_url,
                headers=headers,
                data=request_data,
                cookies=request.cookies,
                allow_redirects=False,
                timeout=10
            )
        
        # Registrar respuesta para diagnóstico
        print(f"Respuesta del servidor Node.js: {resp.status_code}")
        print(f"Encabezados de respuesta: {dict(resp.headers)}")
        
        # Crear respuesta
        response = Response(resp.content, resp.status_code)
        
        # Agregar encabezados CORS completos
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        # Copiar encabezados de la respuesta del servidor Node.js
        for key, value in resp.headers.items():
            if key.lower() not in ['content-length', 'connection', 'access-control-allow-origin', 'access-control-allow-credentials']:
                response.headers[key] = value
                
        return response
        
    except requests.exceptions.RequestException as e:
        error_msg = f'Error al contactar con el servidor Node.js: {str(e)}'
        print(error_msg)
        return jsonify({'error': error_msg}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)