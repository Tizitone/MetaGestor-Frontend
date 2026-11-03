import { TestBed } from '@angular/core/testing';
import { FooterComponente } from './footer-componente';

describe('FooterComponente', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponente],
    }).compileComponents();
  });

  it('should render the summary and section links', () => {
    const fixture = TestBed.createComponent(FooterComponente);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.pie-pagina__resumen')?.textContent).toContain('soluciones');
    expect(compiled.querySelector('a[href="#inicio"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="#sobre-nosotros"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="#clientes"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="#contacto"]')).toBeTruthy();
    expect(compiled.querySelector('.pie-pagina__inferior')?.textContent).toContain('MetaGestor');
  });
});
