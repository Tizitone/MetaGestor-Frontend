import { TestBed } from '@angular/core/testing';
import { ComentariosComponent } from './comentarios-component';

describe('ComentariosComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComentariosComponent],
    }).compileComponents();
  });

  it('should render the "Clientes Satisfechos" heading', () => {
    const fixture = TestBed.createComponent(ComentariosComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#titulo-comentarios')?.textContent).toContain(
      'Clientes Satisfechos',
    );
  });

  it('should render the client cards with image, title and testimonial', () => {
    const fixture = TestBed.createComponent(ComentariosComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const visibleGroup = compiled.querySelector('.comentarios__grupo:not([aria-hidden])');

    expect(visibleGroup?.querySelectorAll('.comentario')).toHaveLength(6);
    expect(visibleGroup?.querySelector('.comentario__avatar')?.textContent).toContain('CM');
    expect(visibleGroup?.querySelector('.comentario__titulo')?.textContent).toBeTruthy();
    expect(visibleGroup?.querySelector('.comentario__cita')?.textContent).toBeTruthy();
  });

  it('should only scroll manually while dragging', () => {
    const fixture = TestBed.createComponent(ComentariosComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const visor = compiled.querySelector('.comentarios__visor') as HTMLElement;
    const claseArrastrando = 'comentarios__visor--arrastrando';

    expect(compiled.querySelector('.comentarios__alternar')).toBeNull();
    expect(visor.classList.contains(claseArrastrando)).toBe(false);

    visor.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 200 }));
    fixture.detectChanges();

    expect(visor.classList.contains(claseArrastrando)).toBe(true);

    visor.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 120 }));
    visor.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 120 }));
    fixture.detectChanges();

    expect(visor.classList.contains(claseArrastrando)).toBe(false);
  });

  it('should expose a keyboard-scrollable carousel region', () => {
    const fixture = TestBed.createComponent(ComentariosComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const visor = compiled.querySelector('.comentarios__visor') as HTMLElement;

    expect(visor.getAttribute('role')).toBe('region');
    expect(visor.getAttribute('tabindex')).toBe('0');
    expect(visor.getAttribute('aria-label')).toBeTruthy();
  });
});
