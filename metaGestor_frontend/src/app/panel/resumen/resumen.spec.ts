import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { URL_API } from '../../compartido/url-api';
import { CLAVE_SESION } from '../../pagina-Auth/servicios/sesion-service';
import type { Cliente, Empleado, Registro, Solicitud, Tarea } from '../panel.model';
import { Resumen } from './resumen';

const CLIENTES: readonly Cliente[] = [
  { idCliente: 1, nombre: 'Ana', email: 'ana@test.cl', telefono: '111', dni: 1 },
  { idCliente: 2, nombre: 'Luis', email: 'luis@test.cl', telefono: '222', dni: 2 },
];

const EMPLEADOS: readonly Empleado[] = [
  {
    legajo: 10,
    nombre: 'Juan',
    email: 'juan@test.cl',
    telefono: '333',
    dni: 3,
    categoriaEmpleado: 'TORNERO',
    historial: [],
  },
];

const TAREAS: readonly Tarea[] = [
  {
    idTarea: 1,
    categorias: 'LIGERO',
    titulo: 'Tarea 1',
    fechaDeEntrega: '2026-12-01',
    fechaDeRegistro: '2026-11-01T10:00',
    descripcionMaterial: 'Acero',
    descripcionGeneral: 'Trabajo 1',
    cantidad: 1,
  },
  {
    idTarea: 2,
    categorias: 'MEDIANO',
    titulo: 'Tarea 2',
    fechaDeEntrega: '2026-12-02',
    fechaDeRegistro: '2026-11-02T10:00',
    descripcionMaterial: 'Hierro',
    descripcionGeneral: 'Trabajo 2',
    cantidad: 2,
  },
  {
    idTarea: 3,
    categorias: 'PESADO',
    titulo: 'Tarea 3',
    fechaDeEntrega: '2026-12-03',
    fechaDeRegistro: '2026-11-03T10:00',
    descripcionMaterial: 'Cobre',
    descripcionGeneral: 'Trabajo 3',
    cantidad: 3,
  },
];

const SOLICITUDES: readonly Solicitud[] = [
  {
    id: 1,
    nombre: 'Pendiente',
    email: 'pendiente@test.cl',
    telefono: '444',
    descripcion: 'Sin atender',
    atendido: false,
  },
  {
    id: 2,
    nombre: 'Atendida',
    email: 'atendida@test.cl',
    telefono: '555',
    descripcion: 'Ya atendida',
    atendido: true,
  },
];

const REGISTROS: readonly Registro[] = [
  {
    id: 1,
    titulo: 'En espera',
    tareaId: 1,
    clienteId: 1,
    proceso: 'ESPERA',
    participantesId: [10],
    publicado: false,
  },
  {
    id: 2,
    titulo: 'En proceso',
    tareaId: 2,
    clienteId: 1,
    proceso: 'ENPROCESO',
    participantesId: [10],
    publicado: true,
  },
  {
    id: 3,
    titulo: 'Terminado',
    tareaId: 3,
    clienteId: 2,
    proceso: 'TERMINADO',
    participantesId: [],
    publicado: true,
  },
];

describe('Resumen', () => {
  const urlApi = 'http://api.test/api';
  let fixture: ComponentFixture<Resumen>;
  let http: HttpTestingController;

  async function crearResumen(): Promise<HTMLElement> {
    fixture = TestBed.createComponent(Resumen);
    fixture.detectChanges();

    responder(`${urlApi}/clientes/buscar/all`, CLIENTES);
    responder(`${urlApi}/empleados/buscar/all`, EMPLEADOS);
    responder(`${urlApi}/gerentes/buscar/all`, []);
    responder(`${urlApi}/tareas/buscar/all`, TAREAS);
    responder(`${urlApi}/solicitudes/buscar/all`, SOLICITUDES);
    responder(`${urlApi}/registros/buscar/all`, REGISTROS);

    await fixture.whenStable();
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  function responder(url: string, cuerpo: Object): void {
    http.match((peticion) => peticion.url === url).forEach((peticion) => peticion.flush(cuerpo));
  }

  function tarjetas(): readonly {
    etiqueta: string;
    total: string;
    detalle: string;
    href: string | null;
  }[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.resumen__tarjeta'),
    ).map((tarjeta) => ({
      etiqueta: tarjeta.querySelector('.resumen__etiqueta')?.textContent?.trim() ?? '',
      total: tarjeta.querySelector('.resumen__total')?.textContent?.trim() ?? '',
      detalle: tarjeta.querySelector('.resumen__accion')?.textContent?.trim() ?? '',
      href: (tarjeta as HTMLAnchorElement).getAttribute('href'),
    }));
  }

  beforeEach(async () => {
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: 'jwt', rol: 'ADMIN', idUsuario: 1 }),
    );

    await TestBed.configureTestingModule({
      imports: [Resumen],
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
    sessionStorage.removeItem(CLAVE_SESION);
    http.verify();
  });

  it('shows the general totals and the pending requests', async () => {
    const compiled = await crearResumen();

    expect(compiled.querySelector('.page__title')?.textContent).toContain('Resumen');
    expect(compiled.querySelector('.page__summary')?.textContent).toContain('3');

    const tarjetasVisibles = tarjetas();
    expect(tarjetasVisibles).toHaveLength(7);
    expect(tarjetasVisibles[0]).toMatchObject({
      etiqueta: 'Clientes',
      total: '2',
      detalle: 'Ver clientes →',
    });
    expect(tarjetasVisibles[1]).toMatchObject({
      etiqueta: 'Empleados',
      total: '1',
      detalle: 'Ver empleados →',
    });
    expect(tarjetasVisibles[2]).toMatchObject({
      etiqueta: 'Tareas',
      total: '3',
      detalle: 'Ver tareas →',
    });
    expect(tarjetasVisibles[3]).toMatchObject({
      etiqueta: 'Solicitudes pendientes',
      total: '1',
      detalle: 'Ver solicitudes →',
    });
  });

  it('groups the records by process and links every card to its section', async () => {
    await crearResumen();

    const tarjetasVisibles = tarjetas();
    expect(tarjetasVisibles[4]).toMatchObject({
      etiqueta: 'En espera',
      total: '1',
      detalle: 'Ver registros →',
    });
    expect(tarjetasVisibles[5]).toMatchObject({
      etiqueta: 'En proceso',
      total: '1',
      detalle: 'Ver registros →',
    });
    expect(tarjetasVisibles[6]).toMatchObject({
      etiqueta: 'Terminado',
      total: '1',
      detalle: 'Ver registros →',
    });

    expect(tarjetasVisibles.map((tarjeta) => tarjeta.href)).toEqual([
      '/panel/clientes',
      '/panel/empleados',
      '/panel/tareas',
      '/panel/solicitudes',
      '/panel/registros',
      '/panel/registros',
      '/panel/registros',
    ]);
  });
});
