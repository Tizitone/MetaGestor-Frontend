import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DescripcionComponent } from '../componentes/descripcionComponent/descripcion-component';
import { ComentariosComponent } from '../componentes/comentariosComponent/comentarios-component';
import { ContactoComponente } from '../componentes/contactoComponente/contacto-componente';
import { FooterComponente } from '../componentes/footerComponente/footer-componente';
import { rutaInicioPorRol } from '../../pagina-Auth/servicios/ruta-por-rol';
import { SesionService } from '../../pagina-Auth/servicios/sesion-service';

@Component({
  selector: 'app-inicio-pantalla',
  imports: [DescripcionComponent, ComentariosComponent, ContactoComponente, FooterComponente],
  templateUrl: './inicio-pantalla.html',
  styleUrl: './inicio-pantalla.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioPantalla {
  private readonly documento = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);

  /** `true` mientras haya una sesión iniciada (hasta pulsar "Cerrar sesión"). */
  protected readonly sesionIniciada = computed(() => this.sesion.token() !== null);

  protected alInicio(): void {
    this.documento.defaultView?.scrollTo({ top: 0, behavior: this.comportamientoDesplazamiento() });
  }

  protected alIniciarSesion(): void {
    if (!this.sesionIniciada()) {
      void this.router.navigate(['/login']);
      return;
    }

    // Con la sesión abierta, el botón "Mi cuenta" devuelve a cada rol a su
    // pantalla principal (el cliente va directo a su perfil).
    void this.router.navigate(rutaInicioPorRol(this.sesion.rol(), this.sesion.idUsuario()));
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
