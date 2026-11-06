import { TestBed } from '@angular/core/testing';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFooter],
    }).compileComponents();
  });

  it('should render the summary and section links', () => {
    const fixture = TestBed.createComponent(SiteFooter);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.footer__summary')?.textContent).toContain('soluciones');
    expect(compiled.querySelector('a[href="#inicio"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="#sobre-nosotros"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="#clientes"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="#contacto"]')).toBeTruthy();
    expect(compiled.querySelector('.footer__bottom')?.textContent).toContain('MetaGestor');
  });
});
