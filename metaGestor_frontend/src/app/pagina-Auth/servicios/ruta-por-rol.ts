/**
 * Ruta de inicio dentro de la aplicación según el rol de la sesión.
 *
 * Se usa al iniciar sesión, al pulsar "Mi cuenta" desde la página principal y
 * al entrar a `/panel` sin indicar una sección. Así cada rol vuelve siempre a
 * su pantalla principal mientras la sesión siga abierta.
 */
export function rutaInicioPorRol(
  rol: string | null | undefined,
  idUsuario: number | null | undefined,
): string[] {
  const rolActual = (rol ?? '').toUpperCase();

  if (rolActual.includes('CLIENTE')) {
    return idUsuario ? ['/panel/clientes', String(idUsuario)] : ['/panel/registros'];
  }

  if (rolActual.includes('EMPLEADO')) {
    // El perfil es el único lugar donde el empleado puede actualizar registros.
    return idUsuario ? ['/panel/empleados', String(idUsuario)] : ['/panel/tareas'];
  }

  // ADMIN y GERENTE administran el panel desde la lista de clientes.
  return ['/panel/clientes'];
}
