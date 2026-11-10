import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import type { SolicitudContacto } from '../../modelos/solicitud-contacto';
import { ContactoService } from '../../servicios/contacto-service';

type EstadoEnvio = 'inicial' | 'enviando' | 'exito' | 'error';


@Component({
  selector: 'app-contacto-componente',
  imports: [FormField],
  templateUrl: './contacto-componente.html',
  styleUrl: './contacto-componente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactoComponente {
  protected readonly estadoEnvio = signal<EstadoEnvio>('inicial');

  private readonly servicioContacto = inject(ContactoService);

   readonly envidado = signal<boolean>(false);
  private readonly modeloFormulario = signal<SolicitudContacto>({nombre:"",email: "",telefono:"",descripcion:""});

  readonly formulario = form(this.modeloFormulario,(ruta)=>{
    required(ruta.email, {message:"Se necesita un correo electronico"}),
    email(ruta.email, {message:"debe ser un correo valido"}),

    required(ruta.nombre, {message:"Se necesita un nombre"}),
    minLength(ruta.nombre,2,{message:"El nombre debe tener al menos 2 caracteres."}),

    required(ruta.telefono,{message:"Ingresa tu telefono"}),
     pattern(ruta.telefono, /^\+?[\d\s()-]{7,20}$/, {
        message: 'Ingresa un teléfono válido (mínimo 7 dígitos).',
      });

    required(ruta.descripcion, {message:"Cuéntanos qué necesitas."}),
    minLength(ruta.descripcion, 10, {message:"Cuéntanos brevemente qué necesitas (mínimo 10 caracteres)."})
  });

  protected async enviar(event: Event): Promise<void> {
    event.preventDefault();

    // Evita envíos duplicados por doble clic, Enter repetido, etc.
    if (this.estadoEnvio() === 'enviando') {
      return;
    }

    // No envía si el formulario tiene errores; muestra los mensajes.
    if (this.formulario().invalid()) {
      this.formulario().markAsTouched();
      return;
    }

    this.estadoEnvio.set('enviando');
    this.envidado.set(false);

    try {
      // Espera la confirmación real del backend antes de cambiar de estado.
      await firstValueFrom(this.servicioContacto.enviarSolicitud(this.modeloFormulario()));
      this.estadoEnvio.set('exito');
      this.envidado.set(true);
      this.formulario().reset({ nombre: '', email: '', telefono: '', descripcion: '' });
    } catch {
      this.estadoEnvio.set('error');
    }
  }

  // Bloquea el envío con Enter mientras se está enviando o el formulario es inválido.
  protected alPresionarEnter(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (this.estadoEnvio() === 'enviando' || this.formulario().invalid()) {
      event.preventDefault();
      this.formulario().markAsTouched();
    }
  }
}
