import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { URL_API } from '../../../../compartido/url-api';
import { CLAVE_SESION } from '../../../../pagina-Auth/servicios/sesion-service';
import type { Cliente, Registro } from '../../../panel.model';
import { PerfilEmpleado } from './perfil-empleado';

const CLIENTES: readonly Cliente[] = [
  {
    idCliente: 1,
    nombre: 'Ana Torres',
    email: 'ana.torres@andesminerals.cl',
    telefono: '912345678',
    dni: 18345678,
  },
  {
    idCliente: 2,
    nombre: 'Felipe Aravena',
    email: 'faravena@obrasmaipo.cl',
    telefono: '963210987',
    dni: 19876543,
  },
];

/**
 * El historial del empleado llega con la forma que serializa JPA, no con la
 * forma normalizada de `Tarea`; `PanelData` la convierte al cargar.
 */
const HISTORIAL_BARANDAS = {
  id: 1,
  categorias: 'LIGERO',
  titulo: 'Barandas escalera',
  fecha_de_entrega: '2026-11-10',
  fechaDeRegistro: '2026-10-21T09:15',
  descripcion_material: 'Perfiles de acero al carbono',
  descripcion_general: 'Fabricación de barandas para escalera',
  cantidad: 4,
} as const;

const HISTORIAL_SOPORTE = {
  id: 2,
  categorias: 'MEDIANO',
  titulo: 'Soporte estanque',
  fecha_de_entrega: '2026-11-18',
  fechaDeRegistro: '2026-10-22T11:40',
  descripcion_material: 'Planchas de acero inoxidable AISI 304',
  descripcion_general: 'Estructura de soporte para estanque',
  cantidad: 2,
} as const;

const EMPLEADOS = [
  {
    legajo: 1001,
    nombre: 'Luis Martínez',
    email: 'lmartinez@metagestor.cl',
    telefono: '911223344',
    dni: 16001122,
    historial: [HISTORIAL_BARANDAS, HISTORIAL_SOPORTE],
  },
  {
    legajo: 1002,
    nombre: 'Carla Fuentes',
    email: 'cfuentes@metagestor.cl',
    telefono: '922334455',
    dni: 17112233,
    historial: [],
  },
  {
    legajo: 1003,
    nombre: 'Pedro Rojas',
    email: 'projas@metagestor.cl',
    telefono: '933445566',
    dni: 18223344,
    historial: [],
  },
];

const REGISTROS: readonly Registro[] = [
  {
    id: 1,
    titulo: 'Barandas escalera bloque A',
    tareaId: 1,
    clienteId: 1,
    proceso: 'ESPERA',
    participantesId: [1001, 1003],
    publicado: false,
  },
  {
    id: 2,
    titulo: 'Barandas escalera bloque B',
    tareaId: 1,
    clienteId: 2,
    proceso: 'TERMINADO',
    participantesId: [1001],
    publicado: true,
  },
  {
    id: 3,
    titulo: 'Soporte estanque lixiviación',
    tareaId: 2,
    clienteId: 1,
    proceso: 'ENPROCESO',
    participantesId: [1002],
    publicado: false,
  },
  {
    id: 5,
    titulo: 'Soportes parque solar',
    tareaId: 5,
    clienteId: 2,
    proceso: 'ESPERA',
    participantesId: [1001],
    publicado: false,
  },
];

describe('PerfilEmpleado', () => {
  const urlApi = 'http://api.test/api';
  let fixture: ComponentFixture<PerfilEmpleado>;
  let http: HttpTestingController;

  function responder(url: string, cuerpo: Object | null): void {
    http.match((peticion) => peticion.url === url).forEach((peticion) => peticion.flush(cuerpo));
  }

  /** Responde las colecciones que `PanelData` pide al iniciar el panel. */
  function responderColecciones(registros: readonly Registro[]): void {
    responder(`${urlApi}/clientes/buscar/all`, CLIENTES);
    responder(`${urlApi}/empleados/buscar/all`, EMPLEADOS);
    responder(`${urlApi}/tareas/buscar/all`, []);
    responder(`${urlApi}/solicitudes/buscar/all`, []);
    responder(`${urlApi}/registros/buscar/all`, registros);
    responder(`${urlApi}/registros/buscar/participantes`, EMPLEADOS);
    responder(`${urlApi}/empleados/historial`, []);
  }

  /** Crea el perfil con el legajo indicado y responde las colecciones del panel. */
  async function crearPerfil(
    legajo: string,
    registros: readonly Registro[] = REGISTROS,
  ): Promise<HTMLElement> {
    fixture = TestBed.createComponent(PerfilEmpleado);
    fixture.componentRef.setInput('legajo', legajo);
    fixture.detectChanges();

    responderColecciones(registros);

    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    sessionStorage.removeItem(CLAVE_SESION);

    await TestBed.configureTestingModule({
      imports: [PerfilEmpleado],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        ...provideHttpClientTesting(),
        { provide: URL_API, useValue: urlApi },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('renders the employee information and assigned tasks', async () => {
    const compiled = await crearPerfil('1001');

    expect(compiled.querySelector('.page__title')?.textContent).toContain('Luis Martínez');
    expect(compiled.querySelector('.page__summary')?.textContent).toContain('2 tareas asignadas');

    const valores = Array.from(compiled.querySelectorAll('.perfil__valor')).map(
      (valor) => valor.textContent,
    );
    expect(valores.join(' ')).toContain('#1001');
    expect(valores.join(' ')).toContain('lmartinez@metagestor.cl');
    expect(valores.join(' ')).toContain('911223344');
    expect(valores.join(' ')).toContain('16001122');

    const tareas = Array.from(compiled.querySelectorAll('.tarea__titulo')).map((tarea) =>
      tarea.textContent?.trim(),
    );
    expect(tareas).toEqual(['Barandas escalera', 'Soporte estanque']);
  });

  it('lists only the records linked to the assigned tasks', async () => {
    const compiled = await crearPerfil('1001');

    expect(compiled.querySelectorAll('.registro')).toHaveLength(3);

    const detalles = Array.from(compiled.querySelectorAll('.registro__detalle')).map((detalle) =>
      (detalle.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(detalles).toContain('Cliente: Ana Torres');
    expect(detalles).toContain('Participantes: Luis Martínez, Pedro Rojas');
    expect(detalles).toContain('Participantes: Carla Fuentes');

    // El registro de una tarea que no está en el historial no se muestra.
    expect(compiled.textContent).not.toContain('Soportes parque solar');
    expect(compiled.querySelector('.perfil__vacio')).toBeFalsy();
  });

  it('advances an awaiting record to the next process state', async () => {
    const compiled = await crearPerfil('1001');

    const boton = compiled.querySelector<HTMLButtonElement>('.registro__accion');
    expect(boton?.textContent).toContain('Avanzar a En proceso');

    boton?.click();
    fixture.detectChanges();

    const peticion = http.expectOne(`${urlApi}/registros/1`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({
      titulo: 'Barandas escalera bloque A',
      tareaId: 1,
      clienteId: 1,
      proceso: 'ENPROCESO',
      participantesId: [1001, 1003],
      publicado: false,
    });

    const actualizados: readonly Registro[] = REGISTROS.map((registro): Registro =>
      registro.id === 1 ? { ...registro, proceso: 'ENPROCESO' } : registro,
    );

    peticion.flush({});
    await Promise.resolve();
    await fixture.whenStable();

    responderColecciones(actualizados);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    const primero = compiled.querySelectorAll('.registro')[0];
    expect(primero.querySelector('.perfil__badge')?.textContent).toContain('En proceso');
    expect(primero.querySelector('.registro__accion')?.textContent).toContain(
      'Avanzar a Terminado',
    );
  });

  it('does not offer to advance a record that is already finished', async () => {
    const compiled = await crearPerfil('1001');

    const registros = Array.from(compiled.querySelectorAll('.registro'));
    const terminado = registros.find((registro) =>
      registro.textContent?.includes('Barandas escalera bloque B'),
    );

    expect(terminado?.querySelector('.perfil__badge')?.textContent).toContain('Terminado');
    expect(terminado?.querySelector('.registro__accion')).toBeFalsy();
  });

  it('shows "Sin tareas asignadas" when the employee has no history', async () => {
    const compiled = await crearPerfil('1002');

    expect(compiled.querySelector('.page__title')?.textContent).toContain('Carla Fuentes');
    expect(compiled.querySelector('.perfil__vacio')?.textContent).toContain('Sin tareas asignadas');
  });

  it('shows a fallback when the employee does not exist', async () => {
    const compiled = await crearPerfil('999');

    expect(compiled.querySelector('.perfil__panel')).toBeFalsy();
    expect(compiled.querySelector('.perfil__no-encontrado')?.textContent).toContain('#999');
  });
});
