import { TestBed } from '@angular/core/testing';
import { ContactSection } from './contact-section';

describe('ContactSection', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactSection],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ContactSection);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the contact form fields and submit button', () => {
    const fixture = TestBed.createComponent(ContactSection);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#contacto')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="name"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="phone"]')).toBeTruthy();
    expect(compiled.querySelector('textarea[formControlName="message"]')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('should show validation errors when submitting an empty form', () => {
    const fixture = TestBed.createComponent(ContactSection);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.field__error')).toHaveLength(4);
    expect(compiled.querySelector('.contact__success')).toBeNull();
  });

  it('should show a confirmation message when submitting a valid form', () => {
    const fixture = TestBed.createComponent(ContactSection);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const setValue = (selector: string, value: string) => {
      const input = compiled.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };

    setValue('#contact-name', 'Ana Perez');
    setValue('#contact-email', 'ana@metagestor.cl');
    setValue('#contact-phone', '+56 9 1234 5678');
    setValue('#contact-message', 'Necesito una cotizacion de estructuras metalicas.');

    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(compiled.querySelector('.contact__success')).toBeTruthy();
    expect(compiled.querySelectorAll('.field__error')).toHaveLength(0);
  });
});
