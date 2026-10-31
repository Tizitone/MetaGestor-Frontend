import { TestBed } from '@angular/core/testing';
import { ClientsSection } from './clients-section';

describe('ClientsSection', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsSection],
    }).compileComponents();
  });

  it('should render the "Clientes Satisfechos" heading', () => {
    const fixture = TestBed.createComponent(ClientsSection);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#clients-title')?.textContent).toContain('Clientes Satisfechos');
  });

  it('should render the client cards with image, title and testimonial', () => {
    const fixture = TestBed.createComponent(ClientsSection);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const visibleGroup = compiled.querySelector('.clients__group:not([aria-hidden])');

    expect(visibleGroup?.querySelectorAll('.client')).toHaveLength(6);
    expect(visibleGroup?.querySelector('.client__avatar')?.textContent).toContain('CM');
    expect(visibleGroup?.querySelector('.client__title')?.textContent).toBeTruthy();
    expect(visibleGroup?.querySelector('.client__quote')?.textContent).toBeTruthy();
  });

  it('should only scroll manually while dragging', () => {
    const fixture = TestBed.createComponent(ClientsSection);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const viewport = compiled.querySelector('.clients__viewport') as HTMLElement;
    const draggingClass = 'clients__viewport--dragging';

    expect(compiled.querySelector('.clients__toggle')).toBeNull();
    expect(viewport.classList.contains(draggingClass)).toBe(false);

    viewport.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 200 }));
    fixture.detectChanges();

    expect(viewport.classList.contains(draggingClass)).toBe(true);

    viewport.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 120 }));
    viewport.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 120 }));
    fixture.detectChanges();

    expect(viewport.classList.contains(draggingClass)).toBe(false);
  });

  it('should expose a keyboard-scrollable carousel region', () => {
    const fixture = TestBed.createComponent(ClientsSection);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const viewport = compiled.querySelector('.clients__viewport') as HTMLElement;

    expect(viewport.getAttribute('role')).toBe('region');
    expect(viewport.getAttribute('tabindex')).toBe('0');
    expect(viewport.getAttribute('aria-label')).toBeTruthy();
  });
});
