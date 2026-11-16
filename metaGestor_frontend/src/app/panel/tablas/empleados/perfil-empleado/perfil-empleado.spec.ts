import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { URL_API } from '../../../../compartido/url-api';
import type { Registro, Tarea } from '../../../panel.model';
import { PerfilEmpleado } from './perfil-empleado';

/** Empleados tal como los devuelve el backend (historial como entidad JPA). */
const EMPLEADOS = [
  {
    legajo: 1001,
    nombre: 'Luis Martínez',
    email: 'lmartinez@metagestor.cl',
    telefono: '911223344',
    dni: 16001122,
    historial: [
      {
        id: 1,
        categorias: 'LIGERO',
        titulo: 'Barandas escalera',
        fecha_de_entrega: '2026-11-10',
        fechaDeRegistro: '2026-10-21T09:15:12',
        descripcion_material: 'Perfiles de acero al carbono',
        descripcion_general: 'Fabricación de barandas para escalera',
        cantidad: 4,
      },
      {
        id: 2,
        categorias: 'MEDIANO',
        titulo: 'Soporte estanque',
        fecha_de_entrega: '2026-11-18',
        fechaDeRegistro: '2026-10-22T11:40:00',
        descripcion_material: 'Planchas de acero inoxidable AISI 304',
        descripcion_general: 'Estructura de soporte para estanque',
        cantidad: 2,
      },
    ],
  },
  {
    legajo: 1002,
    nombre: 'Carla Fuentes',
    email: 'cfuentes@metagestor.cl',
    telefono: '922334455',
    dni: 17112233,
    historial: [],
  },
];

const TAREAS: readonly Tarea[] = [
  {
    idTarea: 1,
    categorias: 'LIGERO',
    titulo: 'Barandas escalera',
    fechaDeEntrega: '2026-11-10',
    fechaDeRegistro: '2026-10-21T09:15',
    descripcionMaterial: 'Perfiles de acero al carbono',
    descripcionGeneral: 'Fabricación de barandas para escalera',
    cantidad: 4,
  },
  {
    idTarea: 2,
    categorias: 'MEDIANO',
    titulo: 'Soporte estanque',
    fechaDeEntrega: '2026-11-18',
    fechaDeRegistro: '2026-10-22T11:40',
    descripcionMaterial: 'Planchas de acero inoxidable AISI 304',
    descripcionGeneral: 'Estructura de soporte para estanque',
    cantidad: 2,
  },
  {
    idTarea: 3,
    categorias: 'PESADO',
    titulo: 'Pasarela nave 2',
    fechaDeEntrega: '2026-12-01',
    fechaDeRegistro: '2026-10-25T08:00',
    descripcionMaterial: 'Vigas de acero',
    descripcionGeneral: 'Pasarela de acceso',
    cantidad: 1,
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
    publicado: true,
  },
  {
    id: 2,
    titulo: 'Soporte estanque lixiviación',
    tareaId: 2,
    clienteId: 1,
    proceso: 'ENPROCESO',
    participantesId: [1001],
    publicado: false,
  },
  {
    id: 3,
    titulo: 'Pasarela nave 2',
    tareaId: 3,
    clienteId: 4,
    proceso: 'TERMINADO',
    participantesId: [1002],
    publicado: false,
  },
  {
    id: 4,
    titulo: 'Trabajo de otra tarea',
    tareaId: 9,
    clienteId: 4,
    proceso: 'ESPERA',
    participantesId: [1002],
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

  /** Responde las colecciones que pide PanelData al construirse y al recargar. */
  function responderColecciones(): void {
    responder(`${urlApi}/clientes/buscar/all`, []);
    responder(`${urlApi}/empleados/buscar/all`, EMPLEADOS);
    responder(`${urlApi}/registros/buscar/participantes`, EMPLEADOS);
    responder(`${urlApi}/tareas/buscar/all`, TAREAS);
    responder(`${urlApi}/solicitudes/buscar/all`, []);
    responder(`${urlApi}/registros/buscar/all`, REGISTROS);
    responder(`${urlApi}/empleados/historial`, []);
  }

  /** Responde el detalle del empleado consultado por `empleados/{legajo}`. */
  function responderEmpleado(legajo: string): void {
    const encontrado = EMPLEADOS.find((empleado) => empleado.legajo === Number(legajo));

    http
      .match((peticion) => peticion.url === `${urlApi}/empleados/${legajo}`)
      .forEach((peticion) => {
        if (encontrado) {
          peticion.flush(encontrado);
        } else {
          peticion.flush(
            { message: 'Empleado no encontrado' },
            { status: 404, statusText: 'Not Found' },
          );
        }
      });
  }

  async function crearPerfil(legajo: string): Promise<HTMLElement> {
    fixture = TestBed.createComponent(PerfilEmpleado);
    fixture.componentRef.setInput('legajo', legajo);

    // Deja que los efectos y las señales registren sus peticiones.
    fixture.detectChanges();
    responderColecciones();
    responderEmpleado(legajo);

    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
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

  it('renders the employee information', async () => {
    const compiled = await crearPerfil('1001');

    expect(compiled.querySelector('.page__title')?.textContent).toContain('Luis Martínez');

    const valores = Array.from(compiled.querySelectorAll('.perfil__valor')).map(
      (valor) => valor.textContent,
    );

    expect(valores.join(' ')).toContain('#1001');
    expect(valores.join(' ')).toContain('lmartinez@metagestor.cl');
    expect(valores.join(' ')).toContain('911223344');
    expect(valores.join(' ')).toContain('16001122');
  });

  it('lists only the tasks of the employee history', async () => {
    const compiled = await crearPerfil('1001');

    expect(compiled.querySelectorAll('.tarea')).toHaveLength(2);
    expect(compiled.textContent).toContain('Barandas escalera');
    expect(compiled.textContent).toContain('Soporte estanque');
    expect(compiled.textContent).not.toContain('Pasarela nave 2');
  });

  it('lists only the records linked to the assigned tasks', async () => {
    const compiled = await crearPerfil('1001');

    expect(compiled.querySelectorAll('.registro')).toHaveLength(2);
    expect(compiled.textContent).toContain('Barandas escalera bloque A');
    expect(compiled.textContent).toContain('Soporte estanque lixiviación');
    expect(compiled.textContent).not.toContain('Trabajo de otra tarea');

    const detalles = Array.from(compiled.querySelectorAll('.registro__detalle')).map((detalle) =>
      (detalle.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(detalles).toContain('Tarea: Barandas escalera');
    expect(detalles).toContain('Tarea: Soporte estanque');
    expect(compiled.querySelector('.perfil__vacio')).toBeFalsy();
  });

  it('updates the state of a linked record with the full payload', async () => {
    const compiled = await crearPerfil('1001');

    const select = compiled.querySelector<HTMLSelectElement>('.registro__select');
    const boton = compiled.querySelector<HTMLButtonElement>('.perfil__boton');

    expect(select).toBeTruthy();
    expect(select?.value).toBe('ESPERA');
    expect(boton?.disabled).toBe(true);

    select!.value = 'TERMINADO';
    select!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(boton?.disabled).toBe(false);
    boton!.click();
    fixture.detectChanges();

    const peticion = http.expectOne({ method: 'PUT', url: `${urlApi}/registros/1` });
    expect(peticion.request.body).toEqual({
      titulo: 'Barandas escalera bloque A',
      tareaId: 1,
      clienteId: 1,
      proceso: 'TERMINADO',
      // El backend conserva los participantes actuales cuando la lista va vacía.
      participantesId: [],
      publicado: true,
    });

    peticion.flush({});
    await fixture.whenStable();

    // La escritura recarga las colecciones del panel.
    responderColecciones();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelector('.perfil__aviso')?.textContent).toContain('#1');
  });

  it('shows a fallback when the employee does not exist', async () => {
    const compiled = await crearPerfil('999');

    expect(compiled.querySelector('.perfil__panel')).toBeFalsy();
    expect(compiled.querySelector('.perfil__no-encontrado')?.textContent).toContain('#999');
  });
});
