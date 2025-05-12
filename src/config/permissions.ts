/**
 * Define las capacidades y permisos para cada rol en el sistema
 * basado en el documento técnico
 */

export enum Resource {
  USERS = 'users',
  LEADS = 'leads',
  ROUTES = 'routes',
  NOTIFICATIONS = 'notifications',
  DASHBOARD = 'dashboard',
  REPORTS = 'reports'
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Un permiso más amplio que incluye todas las acciones
  ASSIGN = 'assign',
  EXPORT = 'export',
  VIEW_GLOBAL = 'view_global', // Para ver dashboards globales
  VIEW_TEAM = 'view_team', // Para ver dashboards de equipo
  VIEW_PERSONAL = 'view_personal', // Para ver dashboard personal
  CHECK_IN = 'check_in', // Para registrar visitas a clientes
  VIEW_ALL = 'view_all'
}

// Definición de permisos por rol según el documento técnico
export const rolePermissions = {
  // Usuario Admin - equivalente al Super-Admin del documento
  admin: [
    // Permisos sobre usuarios
    { resource: Resource.USERS, action: Action.MANAGE },
    // Permisos sobre leads
    { resource: Resource.LEADS, action: Action.MANAGE },
    // Permisos sobre rutas
    { resource: Resource.ROUTES, action: Action.MANAGE },
    // Permisos sobre notificaciones
    { resource: Resource.NOTIFICATIONS, action: Action.MANAGE },
    // Permisos sobre dashboards
    { resource: Resource.DASHBOARD, action: Action.VIEW_ALL },
    // Permisos sobre reportes
    { resource: Resource.REPORTS, action: Action.VIEW_ALL },
  ],
  
  // Manager de Equipo
  manager: [
    // Permisos limitados sobre usuarios (solo puede ver, no puede crear admin)
    { resource: Resource.USERS, action: Action.READ },
    { resource: Resource.USERS, action: Action.CREATE }, // Solo puede crear comerciales
    // Permisos sobre leads
    { resource: Resource.LEADS, action: Action.MANAGE },
    // Permisos sobre rutas
    { resource: Resource.ROUTES, action: Action.MANAGE },
    { resource: Resource.ROUTES, action: Action.ASSIGN },
    // Permisos sobre notificaciones
    { resource: Resource.NOTIFICATIONS, action: Action.READ },
    // Permisos sobre dashboards
    { resource: Resource.DASHBOARD, action: Action.VIEW_ALL },
    // Permisos sobre reportes
    { resource: Resource.REPORTS, action: Action.VIEW_ALL },
  ],
  
  // Comercial (Field Sales)
  comercial: [
    // Permisos sobre su propio perfil
    { resource: Resource.USERS, action: Action.READ }, // Solo puede ver su propio perfil
    { resource: Resource.USERS, action: Action.UPDATE }, // Solo puede actualizar su propio perfil
    // Permisos sobre leads asignados
    { resource: Resource.LEADS, action: Action.READ },
    { resource: Resource.LEADS, action: Action.UPDATE }, // Para actualizar estado, notas, etc.
    // Permisos sobre su ruta asignada
    { resource: Resource.ROUTES, action: Action.READ },
    // Permisos para hacer check-in en visitas
    { resource: Resource.LEADS, action: Action.CHECK_IN },
    // Permisos sobre su dashboard personal
    { resource: Resource.DASHBOARD, action: Action.VIEW_PERSONAL },
    // Permisos sobre sus propios reportes
    { resource: Resource.REPORTS, action: Action.VIEW_PERSONAL },
  ]
};

/**
 * Verifica si un usuario con un rol específico tiene permiso para realizar una acción
 * sobre un recurso determinado
 * 
 * @param role Rol del usuario
 * @param resource Recurso al que se quiere acceder
 * @param action Acción que se quiere realizar
 * @returns boolean indicando si tiene permiso
 */
export const hasPermission = (
  role: string,
  resource: Resource,
  action: Action
): boolean => {
  // Si el rol no existe en nuestro sistema de permisos, no tiene acceso
  if (!rolePermissions[role as keyof typeof rolePermissions]) {
    return false;
  }

  const permissions = rolePermissions[role as keyof typeof rolePermissions];
  
  // Verificar si tiene el permiso específico o el permiso MANAGE para ese recurso
  return permissions.some(
    permission => 
      (permission.resource === resource && permission.action === action) ||
      (permission.resource === resource && permission.action === Action.MANAGE)
  );
};

/**
 * Verifica si un usuario tiene permiso para acceder a una ruta específica
 * basado en el mapeo de rutas a recursos y acciones
 * 
 * @param role Rol del usuario
 * @param path Ruta a la que se quiere acceder
 * @param method Método HTTP (GET, POST, PUT, DELETE)
 * @returns boolean indicando si tiene permiso
 */
export const canAccessRoute = (
  role: string,
  path: string,
  method: string
): boolean => {
  // Implementar un mapeo de rutas a recursos y acciones
  // Por ahora devolvemos true para no interrumpir el flujo actual
  // Esto se implementará en detalle cuando se desarrollen más endpoints
  return true;
};