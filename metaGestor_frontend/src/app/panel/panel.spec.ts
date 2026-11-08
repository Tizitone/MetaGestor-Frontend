import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { URL_API } from '../compartido/url-api';
import { Panel } from './panel';
import { PANEL_ROUTES } from './panel.routes';

describe('Panel', () => {
  const urlApi = 'http://api.test/api';
  let fixture: ComponentFixture<Panel>;
  let http: HttpTestingController;

  beforeEach(async () => {
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
    http.verify();
  });

  it('renders the five management sections with their counts', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(compiled.querySelectorAll('.nav__link')).map((link) =>
      link.textContent?.replace(/\s+/g, ' ').trim(),
    );

    expect(labels).toHaveLength(5);
    expect(labels[0]).toContain('Clientes');
    expect(labels[4]).toContain('Registros');
    expect(compiled.querySelectorAll('.nav__count')).toHaveLength(5);
  });

  it('renders the router outlet for the section pages', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelector('.topbar__title')?.textContent).toContain(
      'Administración MetaGestor',
    );
  });

  it('offers a way to close the session', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const boton = compiled.querySelector<HTMLButtonElement>('.sidebar__link--boton');

    expect(boton?.textContent).toContain('Cerrar sesión');
  });
});
