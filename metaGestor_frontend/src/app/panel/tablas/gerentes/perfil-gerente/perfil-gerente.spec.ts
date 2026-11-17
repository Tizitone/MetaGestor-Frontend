import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { URL_API } from '../../../../compartido/url-api';
import type { Registro, Tarea } from '../../../panel.model';
import { PerfilGerente } from './perfil-gerente';

const GERENTE = {
  legajo: 3,
  nombre: 'Roberto Sánchez',
  email: 'gerente@metalurgica.com',
  telefono: '1199887766',
  dni: 11223344,
};

const EMPLEADOS = [
  {
    legajo: 1,
    nombre: 'Juan Pérez',
    email: 'empleado1@metalurgica.com',
    telefono: '1166554433',
    dni: 33445566,
    historial: [],
  },
];

const TAREAS: readonly Tarea[] = [
  {
    idTarea: 2,
    categorias: 'MEDIANO',
    titulo: 'Estructura para galpón industrial',
    fechaDeEntrega: '2026-07-10',
    fechaDeRegistro: '2026-06-18T23:45',
    descripcionMaterial: 'Hierro galvanizado',
    descripcionGeneral: 'Estructura para galpón industrial',
    cantidad: 1,
  },
  {
    idTarea: 5,
    categorias: 'LIGERO',
    titulo: 'Rejas de protección',
    fechaDeEntrega: '2026-08-01',
    fechaDeRegistro: '2026-06-20T10:00',
    descripcionMaterial: 'Acero',
    descripcionGeneral: 'Rejas de protección',
    cantidad: 3,
  },
];

const REGISTROS: readonly Registro[] = [
  {
    id: 2,
    titulo: 'Estructura galpón norte',
    tareaId: 2,
    clienteId: 1,
    proceso: 'ENPROCESO',
    participantesId: [1, 3],
    publicado: true,
  },
  {
    id: 5,
    titulo: 'Rejas parque',
    tareaId: 5,
    clienteId: 1,
    proceso: 'ESPERA',
    participantesId: [1],
    publicado: false,
  },
];

describe('PerfilGerente', () => {
  const urlApi = 'http://api.test/api';
  let fixture: ComponentFixture<PerfilGerente>;
  let http: HttpTestingController;

  function responder(url: string, cuerpo: Object | null): void {
    http.match((peticion) => peticion.url === url).forEach((peticion) => peticion.flush(cuerpo));
  }

  /** Responde las colecciones que pide PanelData al construirse. */
  function responderColecciones(): void {
    responder(`${urlApi}/clientes/buscar/all`, []);
    responder(`${urlApi}/empleados/buscar/all`, EMPLEADOS);
    responder(`${urlApi}/gerentes/buscar/all`, []);
    responder(`${urlApi}/registros/buscar/participantes`, EMPLEADOS);
    responder(`${urlApi}/tareas/buscar/all`, TAREAS);
    responder(`${urlApi}/solicitudes/buscar/all`, []);
    responder(`${urlApi}/registros/buscar/all`, REGISTROS);
    responder(`${urlApi}/empleados/historial`, []);
  }

  /** Responde el detalle del gerente consultado. */
  function responderGerente(legajo: string): void {
    http
      .match((peticion) => peticion.url === `${urlApi}/gerentes/${legajo}`)
      .forEach((peticion) => {
        if (legajo === String(GERENTE.legajo)) {
          peticion.flush(GERENTE);
        } else {
          peticion.flush(
            { message: 'Gerente no encontrado' },
            { status: 404, statusText: 'Not Found' },
          );
        }
      });
  }

  async function crearPerfil(legajo: string): Promise<HTMLElement> {
    fixture = TestBed.createComponent(PerfilGerente);
    fixture.componentRef.setInput('legajo', legajo);

    // Deja que los efectos y las señales registren sus peticiones.
    fixture.detectChanges();
    responderColecciones();
    responderGerente(legajo);

    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilGerente],
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

  it('renders the manager information', async () => {
    const compiled = await crearPerfil('3');

    expect(compiled.querySelector('.page__title')?.textContent).toContain('Roberto Sánchez');

    const valores = Array.from(compiled.querySelectorAll('.perfil__valor')).map(
      (valor) => valor.textContent,
    );

    expect(valores.join(' ')).toContain('#3');
    expect(valores.join(' ')).toContain('gerente@metalurgica.com');
    expect(valores.join(' ')).toContain('1199887766');
    expect(valores.join(' ')).toContain('11223344');
  });

  it('lists only the records where the manager participates', async () => {
    const compiled = await crearPerfil('3');

    expect(compiled.querySelectorAll('.registro')).toHaveLength(1);
    expect(compiled.textContent).toContain('Estructura galpón norte');
    expect(compiled.textContent).not.toContain('Rejas parque');

    const detalles = Array.from(compiled.querySelectorAll('.registro__detalle')).map((detalle) =>
      (detalle.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(detalles).toContain('Tarea: Estructura para galpón industrial');
    expect(compiled.querySelector('.perfil__vacio')).toBeFalsy();
  });

  it('updates the state of a record with the full payload', async () => {
    const compiled = await crearPerfil('3');

    const select = compiled.querySelector<HTMLSelectElement>('.registro__select');
    const boton = compiled.querySelector<HTMLButtonElement>('.perfil__boton');

    expect(select).toBeTruthy();
    expect(select?.value).toBe('ENPROCESO');
    expect(boton?.disabled).toBe(true);

    select!.value = 'TERMINADO';
    select!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(boton?.disabled).toBe(false);
    boton!.click();
    fixture.detectChanges();

    const peticion = http.expectOne({ method: 'PUT', url: `${urlApi}/registros/2` });
    expect(peticion.request.body).toEqual({
      titulo: 'Estructura galpón norte',
      tareaId: 2,
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

    expect(compiled.querySelector('.perfil__aviso')?.textContent).toContain('#2');
  });

  it('shows a fallback when the manager does not exist', async () => {
    const compiled = await crearPerfil('999');

    expect(compiled.querySelector('.perfil__panel')).toBeFalsy();
    expect(compiled.querySelector('.perfil__no-encontrado')?.textContent).toContain('#999');
  });
});
