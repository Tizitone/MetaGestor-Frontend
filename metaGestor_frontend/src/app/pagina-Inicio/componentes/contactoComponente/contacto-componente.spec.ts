import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ContactoService } from '../../servicios/contacto-service';
import { ContactoComponente } from './contacto-componente';

describe('ContactoComponente', () => {
  const enviarSolicitud = vi.fn();

  beforeEach(async () => {
    enviarSolicitud.mockReset();
    enviarSolicitud.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ContactoComponente],
      providers: [{ provide: ContactoService, useValue: { enviarSolicitud } }],
    }).compileComponents();
  });

  const crearComponente = () => {
    const fixture = TestBed.createComponent(ContactoComponente);
    fixture.detectChanges();
    return { fixture, compilado: fixture.nativeElement as HTMLElement };
  };

  const completarFormulario = (compilado: HTMLElement) => {
    const asignarValor = (selector: string, valor: string) => {
      const input = compilado.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    };

    asignarValor('#contacto-nombre', 'Ana Perez');
    asignarValor('#contacto-email', 'ana@metagestor.cl');
    asignarValor('#contacto-telefono', '+56 9 1234 5678');
    asignarValor('#contacto-descripcion', 'Necesito una cotizacion de estructuras metalicas.');
  };

  const esperarEnvio = async (fixture: ComponentFixture<ContactoComponente>) => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  it('should create the component', () => {
    const { fixture } = crearComponente();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the contact form fields and a disabled submit button', () => {
    const { compilado } = crearComponente();

    expect(compilado.querySelector('#contacto')).toBeTruthy();
    expect(compilado.querySelector('#contacto-nombre')).toBeTruthy();
    expect(compilado.querySelector('#contacto-email')).toBeTruthy();
    expect(compilado.querySelector('#contacto-telefono')).toBeTruthy();
    expect(compilado.querySelector('#contacto-descripcion')).toBeTruthy();

    const boton = compilado.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(boton).toBeTruthy();
    expect(boton.disabled).toBe(true);
    expect(boton.textContent?.trim()).toBe('Enviar mensaje');
  });

  it('should show validation errors when submitting an empty form', async () => {
    const { fixture, compilado } = crearComponente();

    compilado.querySelector('form')?.dispatchEvent(new Event('submit'));
    await esperarEnvio(fixture);

    expect(compilado.querySelectorAll('.campo__error')).toHaveLength(4);
    expect(
      Array.from(compilado.querySelectorAll('.campo__error')).map((error) =>
        error.textContent?.trim(),
      ),
    ).toEqual([
      'Ingresa tu nombre.',
      'Ingresa tu correo electrónico.',
      'Ingresa tu teléfono.',
      'Cuéntanos qué necesitas.',
    ]);
    expect(compilado.querySelector('.contacto__exito')).toBeNull();
    expect(enviarSolicitud).not.toHaveBeenCalled();
  });

  it('should disable the button while the request is in progress', async () => {
    const respuesta = new Subject<Record<string, unknown>>();
    enviarSolicitud.mockReturnValue(respuesta.asObservable());

    const { fixture, compilado } = crearComponente();
    completarFormulario(compilado);
    fixture.detectChanges();

    compilado.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const boton = compilado.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    expect(boton.textContent?.trim()).toBe('Enviando…');

    respuesta.next({});
    respuesta.complete();
    await esperarEnvio(fixture);

    expect(compilado.querySelector('.contacto__exito')).toBeTruthy();
  });

  it('should send the form data and show a confirmation message on success', async () => {
    const { fixture, compilado } = crearComponente();
    completarFormulario(compilado);
    fixture.detectChanges();

    const boton = compilado.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(boton.disabled).toBe(false);

    compilado.querySelector('form')?.dispatchEvent(new Event('submit'));
    await esperarEnvio(fixture);

    expect(enviarSolicitud).toHaveBeenCalledWith({
      nombre: 'Ana Perez',
      email: 'ana@metagestor.cl',
      telefono: '+56 9 1234 5678',
      descripcion: 'Necesito una cotizacion de estructuras metalicas.',
    });

    expect(compilado.querySelector('.contacto__exito')?.textContent?.trim()).toBe(
      'Gracias por contactarnos, revisaremos tu solicitud lo antes posible.',
    );
    expect(compilado.querySelectorAll('.campo__error')).toHaveLength(0);

    const nombre = compilado.querySelector('#contacto-nombre') as HTMLInputElement;
    expect(nombre.value).toBe('');
    expect(boton.disabled).toBe(true);
  });

  it('should show an error message when the request fails', async () => {
    enviarSolicitud.mockReturnValue(throwError(() => new Error('fallo de red')));

    const { fixture, compilado } = crearComponente();
    completarFormulario(compilado);
    fixture.detectChanges();

    compilado.querySelector('form')?.dispatchEvent(new Event('submit'));
    await esperarEnvio(fixture);

    const mensajeError = compilado.querySelector('.contacto__error-envio');
    expect(mensajeError?.textContent?.trim()).toBe(
      'Hubo un error al enviar la solicitud. Intenta nuevamente más tarde.',
    );
    expect(mensajeError?.getAttribute('role')).toBe('alert');
    expect(compilado.querySelector('.contacto__exito')).toBeNull();
  });
});
