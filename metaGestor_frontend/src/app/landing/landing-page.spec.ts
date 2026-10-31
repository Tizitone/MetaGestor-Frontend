import { TestBed } from '@angular/core/testing';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(LandingPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the navigation actions', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const labels = Array.from(compiled.querySelectorAll('.navbar button')).map((button) =>
      button.textContent?.trim(),
    );

    expect(labels).toEqual(['Inicio', 'Iniciar sesión', 'Contáctanos']);
  });

  it('should render the hero title and subtitle', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.hero__title')?.textContent).toContain('MetaGestor');
    expect(compiled.querySelector('.hero__subtitle')?.textContent).toContain(
      'Soluciones metalúrgicas personalizadas',
    );
  });

  it('should render the About, Clients and Contact sections', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-about-section')).toBeTruthy();
    expect(compiled.querySelector('app-clients-section')).toBeTruthy();
    expect(compiled.querySelector('app-contact-section')).toBeTruthy();
    expect(compiled.querySelector('app-site-footer')).toBeTruthy();
    expect(compiled.querySelector('#clientes')).toBeTruthy();
    expect(compiled.querySelector('#contacto')).toBeTruthy();
  });
});
