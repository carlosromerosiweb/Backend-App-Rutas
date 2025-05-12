/**
 * Utilidades para cálculos geográficos
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param point1 Primer punto con latitud y longitud
 * @param point2 Segundo punto con latitud y longitud
 * @returns Distancia en metros
 */
export const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Verifica si un punto está dentro del radio especificado de otro punto
 * @param point1 Punto de referencia
 * @param point2 Punto a verificar
 * @param radius Radio en metros
 * @returns true si el punto está dentro del radio
 */
export const isWithinRadius = (
  point1: Coordinates,
  point2: Coordinates,
  radius: number
): boolean => {
  const distance = calculateDistance(point1, point2);
  return distance <= radius;
};

/**
 * Encuentra el punto más cercano a una ubicación dada
 * @param location Ubicación de referencia
 * @param points Lista de puntos a verificar
 * @returns El punto más cercano y su distancia
 */
export const findNearestPoint = (
  location: Coordinates,
  points: Coordinates[]
): { point: Coordinates; distance: number } | null => {
  if (points.length === 0) return null;

  let nearestPoint = points[0];
  let minDistance = calculateDistance(location, points[0]);

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(location, points[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = points[i];
    }
  }

  return {
    point: nearestPoint,
    distance: minDistance
  };
}; 