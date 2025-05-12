/**
 * Sanitiza un valor para evitar inyecciones CSV y problemas con Excel
 * @param value Valor a sanitizar
 * @returns Valor sanitizado
 */
export function sanitizeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Si el valor comienza con caracteres especiales que podrían causar problemas en Excel
  if (/^[=+\-@]/.test(stringValue)) {
    return `'${stringValue}`;
  }

  // Escapar comillas dobles
  return stringValue.replace(/"/g, '""');
} 