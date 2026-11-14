import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InicioPantalla } from './inicio-pantalla';

describe('InicioPantalla', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioPantalla],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(InicioPantalla);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the navigation actions', () => {
    const fixture = TestBed.createComponent(InicioPantalla);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const etiquetas = Array.from(compiled.querySelectorAll('.barra-navegacion button')).map(
      (boton) => boton.textContent?.trim(),
    );

    expect(etiquetas).toEqual(['Inicio', 'Iniciar sesión', 'Contáctanos']);
  });

  it('should render the hero title and subtitle', () => {
    const fixture = TestBed.createComponent(InicioPantalla);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.portada__titulo')?.textContent).toContain('MetaGestor');
    expect(compiled.querySelector('.portada__subtitulo')?.textContent).toContain(
      'Soluciones metalúrgicas personalizadas',
    );
  });

  it('should render the About, Clients and Contact sections', () => {
    const fixture = TestBed.createComponent(InicioPantalla);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-descripcion-component')).toBeTruthy();
    expect(compiled.querySelector('app-comentarios-component')).toBeTruthy();
    expect(compiled.querySelector('app-contacto-componente')).toBeTruthy();
    expect(compiled.querySelector('app-footer-componente')).toBeTruthy();
    expect(compiled.querySelector('#clientes')).toBeTruthy();
    expect(compiled.querySelector('#contacto')).toBeTruthy();
  });
});
