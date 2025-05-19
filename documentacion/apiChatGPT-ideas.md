
Según lo que estoy viendo el modelo 3.5 Turbo NO debería ser suficiente, será necesario usar como mínimo el modelo GPT-4o

##                                                                                 PROMPT
>    Tengo esta ruta optimizada, y poseo 4 comerciales. Divide la ruta de tal manera
>    que todos los comerciales tengan una ruta con una duración lo más similar posible.

##                                                             SIMULACIÓN DE RESPUESTA ------ GPT-3.5 Turbo
>    Para repartir la ruta de forma equilibrada entre los 4 comerciales, vamos a dividir la lista de leads en 4 grupos de igual tamaño.
>    Comercial 1: leads 1 a 4.
>    Comercial 2: leads 5 a 8.
>    Comercial 3: leads 9 a 12.
>    Comercial 4: leads 13 a 16.
>    De esta manera, cada comercial tendrá asignado el mismo número de leads, lo que debería equilibrar la carga de trabajo.

##                                                                 SIMULACIÓN DE RESPUESTA ------ GPT-4o
>    Para equilibrar la duración total de la ruta entre 4 comerciales, analizaremos la suma acumulada de los tiempos de cada tramo y los agruparemos buscando minimizar
>    diferencia entre grupos.
>
>    A partir de los datos proporcionados, esta sería una distribución optimizada:
>    Comercial 1: leads 1 (300s), 2 (240s), 3 (180s), 4 (300s), 5 (420s) → Total aproximado: 1440s (24 min).
>    Comercial 2: leads 6 (210s), 7 (120s), 8 (100s), 9 (280s), 10 (220s), 11 (360s) → Total aproximado: 1290s (21,5 min).
>    Comercial 3: leads 12 (310s), 13 (190s), 14 (130s), 15 (340s) → Total aproximado: 970s (16 min).
>    Comercial 4: leads 16 (290s), y resto de leads no listados → completaría hasta equilibrar tiempos.
>
>    He priorizado que la suma de tiempos por comercial sea lo más similar posible, aunque la cantidad de leads por persona pueda variar ligeramente. Recomiendo revisar los 
>    tramos restantes y continuar con esta lógica de balanceo por duración. Esta aproximación permite que cada comercial tenga un volumen de trabajo equivalente en tiempo 
>    real, mejorando la eficiencia global de la ruta.

#                                                                          QUÉ DEBERÍA DE HACER?
##                       Sabiendo una ruta (el número de leads que contiene + distancia +  duración), número de comerciales disponibles:
1. obtener rutas según X comerciales. es decir, si tenemos 5 comerciales, deberá calcular como sería el proceso con solo 1 comercial, con 2, con 3, etc.
2. 
        