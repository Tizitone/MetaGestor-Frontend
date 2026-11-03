import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer-componente',
  imports: [],
  templateUrl: './footer-componente.html',
  styleUrl: './footer-componente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponente {
  protected readonly anioActual = new Date().getFullYear();
}
