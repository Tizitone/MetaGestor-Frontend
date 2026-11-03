import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { DescripcionComponent } from '../componentes/descripcionComponent/descripcion-component';
import { ComentariosComponent } from '../componentes/comentariosComponent/comentarios-component';
import { ContactoComponente } from '../componentes/contactoComponente/contacto-componente';
import { FooterComponente } from '../componentes/footerComponente/footer-componente';

@Component({
  selector: 'app-inicio-pantalla',
  imports: [DescripcionComponent, ComentariosComponent, ContactoComponente, FooterComponente],
  templateUrl: './inicio-pantalla.html',
  styleUrl: './inicio-pantalla.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioPantalla {
  private readonly documento = inject(DOCUMENT);

  protected alInicio(): void {
    this.documento.defaultView?.scrollTo({ top: 0, behavior: this.comportamientoDesplazamiento() });
  }

  protected alIniciarSesion(): void {
    // TODO: abrir el flujo de inicio de sesión.
  }

  protected alContactar(): void {
    this.documento
      .getElementById('contacto')
      ?.scrollIntoView({ behavior: this.comportamientoDesplazamiento(), block: 'start' });
  }

  private comportamientoDesplazamiento(): ScrollBehavior {
    return this.documento.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
  }
}
