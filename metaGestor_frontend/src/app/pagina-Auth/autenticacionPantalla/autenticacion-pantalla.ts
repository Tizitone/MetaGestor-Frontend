import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  FormRoot,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import type { CredencialesInicioSesion } from '../modelos/credenciales';
import { AutenticacionService } from '../servicios/autenticacion-service';
import { SesionService } from '../servicios/sesion-service';

type Modo = 'login' | 'registro';
type EstadoEnvio = 'inicial' | 'enviando' | 'exito' | 'error';
type CampoRegistro = 'nombreCompleto' | 'email' | 'telefono' | 'dni' | 'contrasenia';

interface FormularioRegistro {
  nombreCompleto: string;
  email: string;
  telefono: string;
  dni: string;
  contrasenia: string;
}

const LOGIN_VACIO: CredencialesInicioSesion = {
  email: '',
  contrasenia: '',
};

const REGISTRO_VACIO: FormularioRegistro = {
  nombreCompleto: '',
  email: '',
  telefono: '',
  dni: '',
  contrasenia: '',
};

@Component({
  selector: 'app-autenticacion-pantalla',
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './autenticacion-pantalla.html',
  styleUrl: './autenticacion-pantalla.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutenticacionPantalla {
  protected readonly modo = signal<Modo>('login');
  protected readonly enviandoLogin = signal(false);
  protected readonly estadoLogin = signal<EstadoEnvio>('inicial');
  protected readonly estadoRegistro = signal<EstadoEnvio>('inicial');
  protected readonly mensajeErrorLogin = signal('');
  protected readonly mensajeErrorRegistro = signal('');
  protected readonly mostrarContraseniaLogin = signal(false);
  protected readonly mostrarContraseniaRegistro = signal(false);

  private readonly autenticacion = inject(AutenticacionService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  protected readonly modeloLogin = signal<CredencialesInicioSesion>({ ...LOGIN_VACIO });
  protected readonly modeloRegistro = signal<FormularioRegistro>({ ...REGISTRO_VACIO });

  protected readonly formularioLogin = form(
    this.modeloLogin,
    (credenciales) => {
      required(credenciales.email, { message: 'Ingresa tu correo electronico.' });
      email(credenciales.email, { message: 'Ingresa un correo electronico valido.' });
      required(credenciales.contrasenia, { message: 'Ingresa tu contraseña.' });
    },
  );

  protected readonly formularioRegistro = form(
    this.modeloRegistro,
    (datos) => {
      required(datos.nombreCompleto, { message: 'Ingresa tu nombre completo.' });
      minLength(datos.nombreCompleto, 3, {
        message: 'El nombre debe tener al menos 3 caracteres.',
      });
      required(datos.email, { message: 'Ingresa tu correo electronico.' });
      email(datos.email, { message: 'Ingresa un correo electronico valido.' });
      required(datos.telefono, { message: 'Ingresa tu telefono.' });
      pattern(datos.telefono, /^\d{7,11}$/, {
        message: 'El telefono debe tener entre 7 y 11 digitos.',
      });
      required(datos.dni, { message: 'Ingresa tu DNI.' });
      pattern(datos.dni, /^\d{7,8}$/, {
        message: 'El DNI debe tener 7 u 8 digitos.',
      });
      required(datos.contrasenia, { message: 'Crea una contraseña.' });
      minLength(datos.contrasenia, 8, {
        message: 'La contraseña debe tener al menos 8 caracteres.',
      });
    },
  );

  protected enviarLogin(evento: Event): void {
    evento.preventDefault();

    if (this.formularioLogin().invalid() || this.enviandoLogin()) {
      return;
    }

    this.estadoLogin.set('enviando');
    this.mensajeErrorLogin.set('');
    this.enviandoLogin.set(true);

    this.autenticacion.iniciarSesion(this.modeloLogin()).subscribe({
      next: (respuesta) => {
        this.sesion.guardarSesion(respuesta);
        this.estadoLogin.set('exito');
        this.enviandoLogin.set(false);
        this.modeloLogin.set({ ...LOGIN_VACIO });
        if(this.sesion.rol()?.includes("CLIENTE"))
        {
          void this.router.navigate(['/panel/clientes',this.sesion.idUsuario()]);
        }
        else if(this.sesion.rol()?.includes("ADMIN"))
        {
          void this.router.navigate(['/panel']);
        }
        
      },
      error: (error: unknown) => {
        this.estadoLogin.set('error');
        this.mensajeErrorLogin.set(this.mensajeDeError(error, 'login'));
        this.enviandoLogin.set(false);
      },
    });
  }

  protected cambiarModo(modo: Modo): void {
    if (this.modo() === modo) {
      return;
    }

    this.modo.set(modo);
    this.estadoLogin.set('inicial');
    this.estadoRegistro.set('inicial');
    this.mensajeErrorLogin.set('');
    this.mensajeErrorRegistro.set('');
    this.mostrarContraseniaLogin.set(false);
    this.mostrarContraseniaRegistro.set(false);
  }

  protected alternarContraseniaLogin(): void {
    this.mostrarContraseniaLogin.update((visible) => !visible);
  }

  protected alternarContraseniaRegistro(): void {
    this.mostrarContraseniaRegistro.update((visible) => !visible);
  }

  protected errorLogin(campo: 'email' | 'contrasenia'): boolean {
    const estado = this.formularioLogin[campo]();
    return estado.invalid() && estado.touched();
  }

  protected errorRegistro(campo: CampoRegistro): boolean {
    const estado = this.formularioRegistro[campo]();
    return estado.invalid() && estado.touched();
  }

  private mensajeDeError(error: unknown, origen: Modo): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor.';
      }

      if (error.status === 401 || error.status === 403) {
        return origen === 'login'
          ? 'El correo o la contraseña no son correctos.'
          : 'El registro publico no esta habilitado en el servidor.';
      }

      if (origen === 'registro' && error.status === 400) {
        return 'Revisa los datos ingresados: puede que el correo o el DNI ya esten registrados.';
      }
    }

    return origen === 'login'
      ? 'No pudimos iniciar sesion. Intenta nuevamente.'
      : 'No pudimos crear tu cuenta. Intenta nuevamente.';
  }
}