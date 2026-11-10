import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { URL_API } from '../../../../compartido/url-api';
import type { Cliente, Empleado, Registro, Tarea } from '../../../panel.model';
import { PerfilCliente } from './perfil-cliente';

const CLIENTES: readonly Cliente[] = [
  {
    idCliente: 1,
    nombre: 'Ana Torres',
    email: 'ana.torres@andesminerals.cl',
    telefono: '912345678',
    dni: 18345678,
  },
  {
    idCliente: 14,
    nombre: 'Felipe Aravena',
    email: 'faravena@obrasmaipo.cl',
    telefono: '963210987',
    dni: 19876543,
  },
];

const EMPLEADOS: readonly Empleado[] = [
  {
    legajo: 1001,
    nombre: 'Luis Martínez',
    email: 'lmartinez@metagestor.cl',
    telefono: '911223344',
    dni: 16001122,
    historial: [],
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
];

const REGISTROS: readonly Registro[] = [
  {
    id: 1,
    titulo: 'Barandas escalera bloque A',
    tareaId: 1,
    clienteId: 1,
    proceso: 'TERMINADO',
    participantesId: [1001, 1003],
    publicado: true,
  },
  {
    id: 2,
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
    clienteId: 4,
    proceso: 'ESPERA',
    participantesId: [1002, 1007],
    publicado: false,
  },
];

describe('PerfilCliente', () => {
  const urlApi = 'http://api.test/api';
  let fixture: ComponentFixture<PerfilCliente>;
  let http: HttpTestingController;

  function responder(url: string, cuerpo: Object | null): void {
    http.match((peticion) => peticion.url === url).forEach((peticion) => peticion.flush(cuerpo));
  }

  /** Crea el perfil con el identificador indicado y responde las colecciones del panel. */
  async function crearPerfil(idCliente: string): Promise<HTMLElement> {
    fixture = TestBed.createComponent(PerfilCliente);
    fixture.componentRef.setInput('idCliente', idCliente);

    responder(`${urlApi}/clientes/buscar/all`, CLIENTES);
    responder(`${urlApi}/empleados/buscar/all`, EMPLEADOS);
    responder(`${urlApi}/tareas/buscar/all`, TAREAS);
    responder(`${urlApi}/solicitudes/buscar/all`, []);
    responder(`${urlApi}/registros/buscar/all`, REGISTROS);

    // Cierra las peticiones restantes de PanelData (historial de empleados y
    // registros por cliente), que no usa la página de perfil.
    http
      .match((peticion) => peticion.url.startsWith(`${urlApi}/`))
      .forEach((peticion) => peticion.flush([]));

    // Wait: deja que Angular procese la entrada y los datos respondidos.
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilCliente],
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

  it('renders the client information and details', async () => {
    const compiled = await crearPerfil('1');

    expect(compiled.querySelector('.page__title')?.textContent).toContain('Ana Torres');

    const valores = Array.from(compiled.querySelectorAll('.perfil__valor')).map(
      (valor) => valor.textContent,
    );

    expect(valores.join(' ')).toContain('#1');
    expect(valores.join(' ')).toContain('ana.torres@andesminerals.cl');
    expect(valores.join(' ')).toContain('912345678');
    expect(valores.join(' ')).toContain('18345678');
  });

  it('lists only the records of the client with the resolved names', async () => {
    const compiled = await crearPerfil('1');

    expect(compiled.querySelectorAll('.registro')).toHaveLength(2);
    expect(compiled.querySelector('.page__summary')?.textContent).toContain('2');
    expect(compiled.textContent).toContain('Barandas escalera bloque A');

    // La tarea de cada registro se resuelve con el título de la tarea.
    const detalles = Array.from(compiled.querySelectorAll('.registro__detalle')).map(
      (detalle) => (detalle.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(detalles).toContain('Tarea: Barandas escalera');
    expect(detalles).toContain('Tarea: Soporte estanque');
    expect(detalles).toContain('Participantes: Luis Martínez, Pedro Rojas');
    expect(detalles).toContain('Participantes: Carla Fuentes');
    expect(compiled.textContent).not.toContain('Soportes parque solar');
    expect(compiled.querySelector('.perfil__vacio')).toBeFalsy();
  });

  it('shows "Sin registros" when the client has no records', async () => {
    const compiled = await crearPerfil('14');

    expect(compiled.querySelector('.page__title')?.textContent).toContain('Felipe Aravena');
    expect(compiled.querySelectorAll('.registro')).toHaveLength(0);
    expect(compiled.querySelector('.perfil__vacio')?.textContent).toContain('Sin registros');
  });

  it('shows a fallback when the client does not exist', async () => {
    const compiled = await crearPerfil('999');

    expect(compiled.querySelector('.perfil__panel')).toBeFalsy();
    expect(compiled.querySelector('.perfil__no-encontrado')?.textContent).toContain('#999');
  });
});
