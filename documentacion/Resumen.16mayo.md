
#                                                                        ROLES

    Actualmente disponemos de 3 roles.
        1. "comercial". El rol más bajo, los encargados de realizar las visitas.
        2. "manager". El encargado de gestionar los equipos, pudiendo modificar sus clientes asignados, sus comerciales,y sus rutas.
        3. "admin". El superior, con acceso a la mayoría de funcionalidades. 

#                                                                   CLIENTES/LEADS

    Lugares que deben ser visitados por los comerciales.
    Pueden ser importados de la API de Google mediante una búsqueda especificando sector, rating, etc., o importados directamente desde un archivo .csv seleccionado 
(aunque esta última función actualmente solo funciona con .csv que cumplan con la estructura de nuestra database).
    Para saber qué lead debe visital cada comercial, deberán ser asignados a comerciales o a equipos.

#                                                                     CHECK-INS

    Cuando un comercial visita un cliente deberá realizar un check-in para indicar el resultado de la visita. Actualmente, se cuenta con la funcionalidad de añadir
notas y documentos (por ejemplo, fotos). 

#                                                                       RUTAS

    Mediante la API de Google y las coordenadas de los leads, se calcularán rutas optimizadas para ser recorridas por un comercial de la manera más óptima posible.
Puede ser o bien en coche o bien andando. 

#                                                                   GEOCODIFICACIÓN

    Actualmente la aplicación cuenta con un método para convertir direcciones en leads. Mediante una dirección y un código postal obtendremos las coordenadas (latitud y
longitud)

#                                                                     COMERCIALES

    Deben recorren las rutas establecidas por su manager, e ir haciendo check-ins a medida que progresen. 

#                                                                   ADMINISTRADORES

    Encargados de designar a los managers. Tienen acceso a un dashboard mediante el cuál consultar estadísticas actuales.