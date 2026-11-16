import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { URL_API } from '../compartido/url-api';
import { CLAVE_SESION } from '../pagina-Auth/servicios/sesion-service';
import { Panel } from './panel';
import { PANEL_ROUTES } from './panel.routes';

describe('Panel con rol GERENTE', () => {
  const urlApi = 'http://api.test/api';
  let fixture: ComponentFixture<Panel>;
  let http: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: 'jwt', rol: 'GERENTE', idUsuario: 3 }),
    );

    await TestBed.configureTestingModule({
      imports: [Panel],
      providers: [
        provideRouter(PANEL_ROUTES),
        provideHttpClient(),
        ...provideHttpClientTesting(),
        { provide: URL_API, useValue: urlApi },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Panel);

    http
      .match((peticion) => peticion.url.startsWith(`${urlApi}/`))
      .forEach((peticion) => peticion.flush([]));

    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.removeItem(CLAVE_SESION);
    http.verify();
  });

  it('offers their own profile and employee management', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(compiled.querySelectorAll('.nav__link')).map((link) =>
      link.textContent?.replace(/\s+/g, ' ').trim(),
    );

    expect(labels).toHaveLength(6);
    expect(labels[0]).toContain('Mi perfil');
    expect(labels[1]).toContain('Clientes');
    expect(labels[2]).toContain('Empleados');

    const perfil = compiled.querySelector<HTMLAnchorElement>('a[href="/panel/gerentes/3"]');
    expect(perfil?.textContent).toContain('Mi perfil');
  });
});
