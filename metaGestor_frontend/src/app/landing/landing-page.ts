import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { AboutSection } from './about-section/about-section';
import { ClientsSection } from './clients-section/clients-section';
import { ContactSection } from './contact-section/contact-section';
import { SiteFooter } from './site-footer/site-footer';

@Component({
  selector: 'app-landing-page',
  imports: [AboutSection, ClientsSection, ContactSection, SiteFooter],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  private readonly document = inject(DOCUMENT);

  protected onInicio(): void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: this.scrollBehavior() });
  }

  protected onIniciarSesion(): void {
    // TODO: abrir el flujo de inicio de sesión.
  }

  protected onContactanos(): void {
    this.document
      .getElementById('contacto')
      ?.scrollIntoView({ behavior: this.scrollBehavior(), block: 'start' });
  }

  private scrollBehavior(): ScrollBehavior {
    return this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
  }
}
