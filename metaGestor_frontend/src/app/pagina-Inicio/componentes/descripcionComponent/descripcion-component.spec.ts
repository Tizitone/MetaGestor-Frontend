import { TestBed } from '@angular/core/testing';
import { DescripcionComponent } from './descripcion-component';

describe('DescripcionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescripcionComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DescripcionComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the "Sobre nosotros" heading and company description', () => {
    const fixture = TestBed.createComponent(DescripcionComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#titulo-descripcion')?.textContent).toContain('Sobre nosotros');
    expect(compiled.querySelector('.descripcion__introduccion')?.textContent).toContain(
      'MetaGestor',
    );
  });

  it('should render the benefits and the comparison table', () => {
    const fixture = TestBed.createComponent(DescripcionComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.beneficio')).toHaveLength(4);
    expect(compiled.querySelectorAll('.comparativa__tabla tbody tr')).toHaveLength(8);
  });
});
