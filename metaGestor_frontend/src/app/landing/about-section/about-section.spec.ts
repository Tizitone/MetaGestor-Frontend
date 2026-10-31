import { TestBed } from '@angular/core/testing';
import { AboutSection } from './about-section';

describe('AboutSection', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutSection],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AboutSection);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the "Sobre nosotros" heading and company description', () => {
    const fixture = TestBed.createComponent(AboutSection);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#about-title')?.textContent).toContain('Sobre nosotros');
    expect(compiled.querySelector('.about__intro')?.textContent).toContain('MetaGestor');
  });

  it('should render the benefits and the comparison table', () => {
    const fixture = TestBed.createComponent(AboutSection);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.benefit')).toHaveLength(4);
    expect(compiled.querySelectorAll('.comparison__table tbody tr')).toHaveLength(8);
  });
});
