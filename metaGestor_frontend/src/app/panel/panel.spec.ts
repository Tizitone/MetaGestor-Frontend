import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Panel } from './panel';
import { PANEL_ROUTES } from './panel.routes';

describe('Panel', () => {
  let fixture: ComponentFixture<Panel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Panel],
      providers: [provideRouter(PANEL_ROUTES)],
    }).compileComponents();

    fixture = TestBed.createComponent(Panel);
    await fixture.whenStable();
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
});
