import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AutenticacionPantalla } from './autenticacion-pantalla';

describe('AutenticacionPantalla', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutenticacionPantalla],
      providers: [provideRouter([]), provideHttpClient(), ...provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AutenticacionPantalla);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the login form by default', () => {
    const fixture = TestBed.createComponent(AutenticacionPantalla);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#login-email')).toBeTruthy();
    expect(compiled.querySelector('#login-contrasenia')).toBeTruthy();
    expect(compiled.querySelector('#registro-nombre')).toBeFalsy();
    expect(compiled.querySelector('.auth__conmutador')).toBeFalsy();
    expect(compiled.querySelector('.auth__enlace')?.textContent).toContain('Crear una cuenta');
    expect(compiled.querySelector('.auth__enviar')?.textContent).toContain('Ingresar');
  });

  it('should switch to the registration form', () => {
    const fixture = TestBed.createComponent(AutenticacionPantalla);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.auth__enlace')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('#registro-nombre')).toBeTruthy();
    expect(compiled.querySelector('#registro-email')).toBeTruthy();
    expect(compiled.querySelector('#registro-telefono')).toBeTruthy();
    expect(compiled.querySelector('#registro-dni')).toBeTruthy();
    expect(compiled.querySelector('#registro-contrasenia')).toBeTruthy();
    expect(compiled.querySelector('#login-email')).toBeFalsy();
  });

  it('should go back to the login form from the registration form', () => {
    const fixture = TestBed.createComponent(AutenticacionPantalla);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.auth__enlace')?.click();
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('.auth__enlace')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('#login-email')).toBeTruthy();
    expect(compiled.querySelector('#registro-nombre')).toBeFalsy();
  });
});
