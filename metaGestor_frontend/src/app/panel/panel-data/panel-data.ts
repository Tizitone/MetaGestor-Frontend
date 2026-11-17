import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  filter,
  firstValueFrom,
  forkJoin,
  map,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import type { Observable } from 'rxjs';
import { SesionService } from '../../pagina-Auth/servicios/sesion-service';
import { URL_API } from '../../compartido/url-api';
import type {
  CategoriaTarea,
  Cliente,
  ClienteCreacion,
  Empleado,
  EmpleadoCreacion,
  EmpleadoModificacion,
  Gerente,
  Registro,
  RegistroEscritura,
  Solicitud,
  Tarea,
  TareaDetalle,
  TareaEscritura,
} from '../panel.model';

/** Tarea tal como la serializa JPA dentro del historial de un empleado. */
interface TareaJpa {
  id: number;
  categorias: CategoriaTarea;
  titulo: string;
  fecha_de_entrega: string;
  fechaDeRegistro: string;
  descripcion_material: string;
  descripcion_general: string;
  cantidad: number;
}

/**
 * Empleado tal como lo devuelve el backend.
 *
 * `empleados/buscar/all` incluye el historial como entidad JPA, mientras que
 * `registros/buscar/participantes` devuelve solo los datos del empleado. Por eso
 * el historial es opcional.
 */
type EmpleadoJpa = Omit<Empleado, 'historial'> & { historial?: readonly TareaJpa[] };

function normalizarEmpleado({
  legajo,
  nombre,
  email,
  telefono,
  dni,
  historial,
}: EmpleadoJpa): Empleado {
  return {
    legajo,
    nombre,
    email,
    telefono,
    dni,
    historial: (historial ?? []).map((tarea) => ({
      idTarea: tarea.id,
      categorias: tarea.categorias,
      titulo: tarea.titulo,
      fechaDeEntrega: tarea.fecha_de_entrega,
      fechaDeRegistro: tarea.fechaDeRegistro,
      descripcionMaterial: tarea.descripcion_material,
      descripcionGeneral: tarea.descripcion_general,
      cantidad: tarea.cantidad,
    })),
  };
}

@Service()
export class PanelData {
  private readonly http = inject(HttpClient);
  private readonly urlApi = inject(URL_API);
  private readonly sesion = inject(SesionService);

  /**
   * Rol de la sesión actual. El servicio se provee a nivel del panel, por lo
   * que se crea después del login y no cambia mientras el panel está abierto.
   */
  private readonly rol = (this.sesion.rol() ?? '').toUpperCase();

  /** `true` cuando la sesión pertenece a un cliente. */
  readonly esCliente = this.rol === 'CLIENTE';

  /** `true` cuando la sesión pertenece a un empleado. */
  readonly esEmpleado = this.rol === 'EMPLEADO';

  /** `true` cuando la sesión pertenece a un gerente. */
  readonly esGerente = this.rol === 'GERENTE';

  idActual = signal<number>(0);
  private readonly idActual$ = toObservable(this.idActual);
  /**
   * Emite cada vez que una operación de escritura termina con éxito para
   * volver a pedir las colecciones del panel.
   */
  private readonly refresco$ = new Subject<void>();
  private readonly cambios$ = this.refresco$.pipe(startWith(undefined));

  /**
   * El backend autoriza cada colección según el rol. Cuando no hay rol (por
   * ejemplo en las pruebas) se mantiene el comportamiento permisivo anterior.
   */
  private permite(...roles: string[]): boolean {
    return this.rol === '' || roles.includes(this.rol);
  }

  constructor() {
    // Un cliente siempre debe ver sus propios registros, incluso si recarga la
    // página en una sección distinta a su perfil.
    if (this.esCliente) {
      const idUsuario = this.sesion.idUsuario();
      if (idUsuario) {
        this.idActual.set(idUsuario);
      }
    }
  }

  readonly clientes = toSignal(
    this.cambios$.pipe(
      switchMap(() =>
        this.permite('ADMIN', 'GERENTE')
          ? this.http.get<Cliente[]>(`${this.urlApi}/clientes/buscar/all`)
          : of<Cliente[]>([]),
      ),
    ),
    { initialValue: [] },
  );

  /**
   * Cliente leído desde `clientes/{id}`. Ese endpoint solo está habilitado para
   * el rol CLIENTE; los demás roles resuelven el cliente desde la colección.
   */
  private readonly clienteRemoto = toSignal(
    this.idActual$.pipe(
      filter((id) => id > 0),
      switchMap((id) =>
        this.esCliente
          ? this.http
              .get<Cliente>(`${this.urlApi}/clientes/${id}`)
              .pipe(catchError(() => of(null)))
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  readonly buscarCliente = computed<Cliente | null>(() => {
    const id = this.idActual();
    if (id <= 0) {
      return null;
    }

    return (
      this.clienteRemoto() ??
      this.clientes().find((cliente) => cliente.idCliente === id) ??
      null
    );
  });

  readonly empleados = toSignal(
    this.cambios$.pipe(
      switchMap(() =>
        this.permite('EMPLEADO', 'GERENTE', 'ADMIN')
          ? this.http
              .get<EmpleadoJpa[]>(`${this.urlApi}/empleados/buscar/all`)
              .pipe(
                map((empleados) => empleados.map(normalizarEmpleado)),
                // Una colección inaccesible no debe romper las tablas.
                catchError(() => of<Empleado[]>([])),
              )
          : of<Empleado[]>([]),
      ),
    ),
    { initialValue: [] },
  );

  /** Legajo del empleado que se está consultando en su perfil. */
  legajoActual = signal<number>(0);
  private readonly legajoActual$ = toObservable(this.legajoActual);

  /**
   * Empleado leído desde `empleados/{legajo}`. Si el endpoint falla se degrada
   * a `null` y el perfil recurre a la colección cargada.
   */
  private readonly empleadoRemoto = toSignal(
    this.legajoActual$.pipe(
      filter((legajo) => legajo > 0),
      switchMap((legajo) =>
        this.http.get<EmpleadoJpa>(`${this.urlApi}/empleados/${legajo}`).pipe(
          map(normalizarEmpleado),
          catchError(() => of(null)),
        ),
      ),
    ),
    { initialValue: null },
  );

  /** Legajo del gerente que se está consultando en su perfil. */
  gerenteActual = signal<number>(0);
  private readonly gerenteActual$ = toObservable(this.gerenteActual);

  /**
   * Gerente leído desde `gerentes/{legajo}`. Queda en `undefined` mientras la
   * consulta está en curso y en `null` si falla o no existe.
   */
  private readonly gerenteRemoto = toSignal(
    this.gerenteActual$.pipe(
      filter((legajo) => legajo > 0),
      switchMap((legajo) =>
        this.permite('GERENTE', 'ADMIN')
          ? this.http.get<Gerente>(`${this.urlApi}/gerentes/${legajo}`).pipe(
              // Al cambiar de legajo se vuelve al estado de carga.
              startWith(undefined),
              catchError(() => of(null)),
            )
          : of(null),
      ),
    ),
    { initialValue: undefined },
  );

  /**
   * `registros/buscar/participantes` está reservado al rol CLIENTE por el
   * `SecurityConfig` del backend. Los demás roles obtienen los mismos nombres
   * desde `empleados/buscar/all`, al que sí tienen acceso.
   */
  private readonly usarParticipantes = this.rol === '' || this.esCliente;

  private readonly participantesRemotos = toSignal(
    this.cambios$.pipe(
      switchMap(() =>
        this.permite('CLIENTE')
          ? this.http
              .get<EmpleadoJpa[]>(`${this.urlApi}/registros/buscar/participantes`)
              .pipe(
                map((empleados) => empleados.map(normalizarEmpleado)),
                // Un 403 no debe romper las tablas: se degrada a lista vacía.
                catchError(() => of<Empleado[]>([])),
              )
          : of<Empleado[]>([]),
      ),
    ),
    { initialValue: [] },
  );

  /**
   * Nombres de empleados para resolver los participantes de un registro. El
   * cliente los lee del endpoint de participantes; el resto de los roles
   * reutiliza la colección completa de empleados.
   */
  readonly participantes = computed<readonly Empleado[]>(() =>
    this.usarParticipantes ? this.participantesRemotos() : this.empleados(),
  );

  readonly buscarRegistrosCliente = toSignal(
    this.idActual$.pipe(
      filter((id) => id > 0),
      switchMap((id) =>
        this.http
          .get<Registro[]>(`${this.urlApi}/registros/buscar/cliente/${id}`)
          .pipe(catchError(() => of<Registro[]>([]))),
      ),
    ),
    { initialValue: [] },
  );

  /**
   * Título de la tarea de cada registro del cliente.
   *
   * El rol CLIENTE no puede consultar `tareas/buscar/all`, pero sí
   * `registros/buscar/tareas/{idRegistro}`. Los demás roles resuelven la tarea
   * desde la colección completa.
   */
  private readonly tareasDeRegistrosCliente = toSignal(
    toObservable(this.buscarRegistrosCliente).pipe(
      switchMap((registros) => {
        if (!this.esCliente || registros.length === 0) {
          return of(new Map<number, Tarea>());
        }

        return this.cargarTareasDeRegistros(registros);
      }),
    ),
    { initialValue: new Map<number, Tarea>() },
  );

  readonly buscarHistorialEmpleados = toSignal(
    this.cambios$.pipe(
      switchMap(() =>
        this.permite('EMPLEADO')
          ? this.http.get<Tarea[]>(`${this.urlApi}/empleados/historial`)
          : of<Tarea[]>([]),
      ),
    ),
    { initialValue: [] },
  );

  readonly tareas = toSignal(
    this.cambios$.pipe(
      switchMap(() =>
        this.permite('EMPLEADO', 'GERENTE', 'ADMIN')
          ? this.http.get<Tarea[]>(`${this.urlApi}/tareas/buscar/all`)
          : of<Tarea[]>([]),
      ),
    ),
    { initialValue: [] },
  );

  readonly solicitudes = toSignal(
    this.cambios$.pipe(
      switchMap(() =>
        this.permite('ADMIN', 'GERENTE')
          ? this.http.get<Solicitud[]>(`${this.urlApi}/solicitudes/buscar/all`)
          : of<Solicitud[]>([]),
      ),
    ),
    { initialValue: [] },
  );

  private readonly registrosTodos = toSignal(
    this.cambios$.pipe(
      switchMap(() =>
        this.permite('EMPLEADO', 'GERENTE', 'ADMIN')
          ? this.http.get<Registro[]>(`${this.urlApi}/registros/buscar/all`)
          : of<Registro[]>([]),
      ),
    ),
    { initialValue: [] },
  );

  /**
   * Para un cliente, la tabla de registros muestra únicamente los suyos. El
   * resto de roles sigue viendo la colección completa.
   */
  readonly registros = computed<readonly Registro[]>(() =>
    this.esCliente ? this.buscarRegistrosCliente() : this.registrosTodos(),
  );

  // --- Mutaciones: cada operación recarga las colecciones al terminar. ---

  async crearCliente(cliente: ClienteCreacion): Promise<void> {
    await firstValueFrom(this.http.post<ClienteCreacion>(`${this.urlApi}/clientes`, cliente));
    this.refrescar();
  }

  async modificarCliente(idCliente: number, cliente: Cliente): Promise<void> {
    await firstValueFrom(this.http.put<Cliente>(`${this.urlApi}/clientes/${idCliente}`, cliente));
    this.refrescar();
  }

  async eliminarCliente(idCliente: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.urlApi}/clientes/${idCliente}`));
    this.refrescar();
  }

  async crearEmpleado(empleado: EmpleadoCreacion): Promise<void> {
    await firstValueFrom(this.http.post<EmpleadoCreacion>(`${this.urlApi}/empleados`, empleado));
    this.refrescar();
  }

  async modificarEmpleado(legajo: number, empleado: EmpleadoModificacion): Promise<void> {
    await firstValueFrom(
      this.http.put<EmpleadoModificacion>(`${this.urlApi}/empleados/${legajo}`, empleado),
    );
    this.refrescar();
  }

  async eliminarEmpleado(legajo: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.urlApi}/empleados/${legajo}`));
    this.refrescar();
  }

  async crearTarea(tarea: TareaEscritura): Promise<void> {
    await firstValueFrom(this.http.post<TareaEscritura>(`${this.urlApi}/tareas`, tarea));
    this.refrescar();
  }

  async modificarTarea(idTarea: number, tarea: TareaEscritura): Promise<void> {
    await firstValueFrom(this.http.put<TareaEscritura>(`${this.urlApi}/tareas/${idTarea}`, tarea));
    this.refrescar();
  }

  async eliminarTarea(idTarea: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.urlApi}/tareas/${idTarea}`));
    this.refrescar();
  }

  async crearRegistro(registro: RegistroEscritura): Promise<void> {
    await firstValueFrom(this.http.post<RegistroEscritura>(`${this.urlApi}/registros`, registro));
    this.refrescar();
  }

  async modificarRegistro(id: number, registro: RegistroEscritura): Promise<void> {
    await firstValueFrom(
      this.http.put<RegistroEscritura>(`${this.urlApi}/registros/${id}`, registro),
    );
    this.refrescar();
  }

  async eliminarRegistro(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.urlApi}/registros/${id}`));
    this.refrescar();
  }

  async crearSolicitud(solicitud: Omit<Solicitud, 'id'>): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.urlApi}/solicitudes/crear`, solicitud),
    );
    this.refrescar();
  }

  async modificarSolicitud(id: number, solicitud: Solicitud): Promise<void> {
    await firstValueFrom(
      this.http.put<Solicitud>(`${this.urlApi}/solicitudes/${id}`, solicitud),
    );
    this.refrescar();
  }

  async eliminarSolicitud(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.urlApi}/solicitudes/borrar/${id}`));
    this.refrescar();
  }

  private refrescar(): void {
    this.refresco$.next();
  }

  private cargarTareasDeRegistros(registros: readonly Registro[]): Observable<Map<number, Tarea>> {
    const peticiones = registros.map((registro) =>
      this.http.get<Tarea[]>(`${this.urlApi}/registros/buscar/tareas/${registro.id}`).pipe(
        map((tareas) => ({ id: registro.id, tarea: tareas[0] ?? null })),
        catchError(() => of({ id: registro.id, tarea: null as Tarea | null })),
      ),
    );

    return forkJoin(peticiones).pipe(
      map((resultados) => {
        const tareas = new Map<number, Tarea>();
        for (const { id, tarea } of resultados) {
          if (tarea) {
            tareas.set(id, tarea);
          }
        }
        return tareas;
      }),
    );
  }

  nombreDeCliente(id: number): string {
    const cliente = this.clientes().find((actual) => actual.idCliente === id);
    if (cliente) {
      return cliente.nombre;
    }

    const clienteActual = this.buscarCliente();
    return clienteActual?.idCliente === id ? clienteActual.nombre : `Cliente #${id}`;
  }

  resumenDeTarea(idTarea: number): string {
    const tarea = this.tareas().find((actual) => actual.idTarea === idTarea);
    return tarea?.titulo || tarea?.descripcionGeneral || `Tarea #${idTarea}`;
  }

  /** Tarea asociada a un registro, usando la vía permitida para cada rol. */
  tareaDeRegistro(registro: Registro): Tarea | null {
    return (
      this.tareasDeRegistrosCliente().get(registro.id) ??
      this.tareas().find((actual) => actual.idTarea === registro.tareaId) ??
      null
    );
  }

  /** Resuelve la tarea de un registro usando la vía permitida para cada rol. */
  resumenDeTareaDeRegistro(registro: Registro): string {
    const tarea = this.tareaDeRegistro(registro);

    return tarea?.titulo || tarea?.descripcionGeneral || `Tarea #${registro.tareaId}`;
  }

  nombreDeEmpleado(legajo: number): string {
    return (
      this.participantes().find((empleado) => empleado.legajo === legajo)?.nombre ?? `Legajo #${legajo}`
    );
  }

  /**
   * Empleado consultado en el perfil. Usa `GET /api/empleados/{legajo}` y, si
   * esa consulta aún no respondió o falló, resuelve desde la colección cargada.
   */
  buscarEmpleado(legajo: number): Empleado | null {
    if (legajo <= 0) {
      return null;
    }

    const remoto = this.empleadoRemoto();
    if (remoto?.legajo === legajo) {
      return remoto;
    }

    return this.empleados().find((empleado) => empleado.legajo === legajo) ?? null;
  }

  /**
   * Gerente consultado en su perfil.
   *
   * Devuelve `undefined` mientras la consulta está en curso, `null` si no
   * existe y el gerente cuando el endpoint respondió.
   */
  buscarGerente(legajo: number): Gerente | null | undefined {
    if (legajo <= 0) {
      return null;
    }

    if (this.gerenteActual() !== legajo) {
      return undefined;
    }

    return this.gerenteRemoto();
  }
}
