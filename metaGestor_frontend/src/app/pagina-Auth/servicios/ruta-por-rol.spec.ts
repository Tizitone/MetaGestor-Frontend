import { rutaInicioPorRol } from './ruta-por-rol';

describe('rutaInicioPorRol', () => {
  it('sends a client directly to their own profile', () => {
    expect(rutaInicioPorRol('CLIENTE', 7)).toEqual(['/panel/clientes', '7']);
  });

  it('sends an employee to the tasks section', () => {
    expect(rutaInicioPorRol('EMPLEADO', 3)).toEqual(['/panel/tareas']);
  });

  it('sends an admin or manager to the clients section', () => {
    expect(rutaInicioPorRol('ADMIN', 1)).toEqual(['/panel/clientes']);
    expect(rutaInicioPorRol('GERENTE', 2)).toEqual(['/panel/clientes']);
  });

  it('keeps a client inside the panel if their id is missing', () => {
    expect(rutaInicioPorRol('CLIENTE', null)).toEqual(['/panel/registros']);
  });
});
