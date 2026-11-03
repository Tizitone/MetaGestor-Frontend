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
import { firstValueFrom } from 'rxjs';
import type { SolicitudContacto } from '../../modelos/solicitud-contacto';
import { ContactoService } from '../../servicios/contacto-service';

type CampoContacto = 'nombre' | 'email' | 'telefono' | 'descripcion';
type EstadoEnvio = 'inicial' | 'enviando' | 'exito' | 'error';

const SOLICITUD_VACIA: SolicitudContacto = {
  nombre: '',
  email: '',
  telefono: '',
  descripcion: '',
};

@Component({
  selector: 'app-contacto-componente',
  imports: [FormField, FormRoot],
  templateUrl: './contacto-componente.html',
  styleUrl: './contacto-componente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactoComponente {
  protected readonly estadoEnvio = signal<EstadoEnvio>('inicial');

  private readonly servicioContacto = inject(ContactoService);
  private readonly solicitud = signal<SolicitudContacto>({ ...SOLICITUD_VACIA });

  protected readonly formularioContacto = form(
    this.solicitud,
    (contacto) => {
      required(contacto.nombre, { message: 'Ingresa tu nombre.' });
      minLength(contacto.nombre, 2, {
        message: 'El nombre debe tener al menos 2 caracteres.',
      });
      required(contacto.email, { message: 'Ingresa tu correo electrónico.' });
      email(contacto.email, { message: 'Ingresa un correo electrónico válido.' });
      required(contacto.telefono, { message: 'Ingresa tu teléfono.' });
      pattern(contacto.telefono, /^\+?[\d\s()-]{7,20}$/, {
        message: 'Ingresa un teléfono válido (mínimo 7 dígitos).',
      });
      required(contacto.descripcion, { message: 'Cuéntanos qué necesitas.' });
      minLength(contacto.descripcion, 10, {
        message: 'Cuéntanos brevemente qué necesitas (mínimo 10 caracteres).',
      });
    },
    {
      submission: {
        action: async () => {
          this.estadoEnvio.set('enviando');
          try {
            await firstValueFrom(this.servicioContacto.enviarSolicitud(this.solicitud()));
            this.estadoEnvio.set('exito');
            this.formularioContacto().reset({ ...SOLICITUD_VACIA });
          } catch {
            this.estadoEnvio.set('error');
          }
        },
        onInvalid: () => this.estadoEnvio.set('inicial'),
      },
    },
  );

  protected mostrarError(campo: CampoContacto): boolean {
    const estado = this.formularioContacto[campo]();
    return estado.invalid() && estado.touched();
  }
}
