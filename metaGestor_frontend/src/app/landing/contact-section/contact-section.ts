import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { datosConsulta } from './modelos/modeloFormulario';

@Component({
  imports: [FormField],
  selector: 'app-contact-section',
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.css'
})

export class ContactSection {

  readonly envidado = signal<boolean>(false);
  private readonly modeloFormulario = signal<datosConsulta>({nombre:"",email: "",telefono:"",descripcion:""});

  readonly formulario = form(this.modeloFormulario,(ruta)=>{
    required(ruta.email, {message:"Se necesita un correo electronico"}),
    email(ruta.email, {message:"debe ser un correo valido"}),

    required(ruta.nombre, {message:"Se necesita un nombre"}),
    minLength(ruta.nombre,2,{message:"El nombre debe tener al menos 2 caracteres."}),

    required(ruta.telefono,{message:"Ingresa tu telefono"}),
    minLength(ruta.telefono,7,{message:"Ingresa un teléfono válido (mínimo 7 dígitos)."}),

    required(ruta.descripcion, {message:"Cuéntanos qué necesitas."}),
    minLength(ruta.descripcion, 10, {message:"Cuéntanos brevemente qué necesitas (mínimo 10 caracteres)."})
  });

  
  

  constructor() {
  }


  protected enviar(event : Event): void {
    event.preventDefault();
    this.envidado.update((valor) => !valor)
    //post para solicitud
    
  }
}
