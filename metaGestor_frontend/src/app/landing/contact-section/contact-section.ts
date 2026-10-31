import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-section',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSection {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly contactForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s()-]{7,20}$/)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected readonly sent = signal(false);

  constructor() {
    this.contactForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.sent.set(false));
  }

  protected showError(controlName: 'name' | 'email' | 'phone' | 'message'): boolean {
    const control = this.contactForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected onSubmit(): void {
    this.contactForm.markAllAsTouched();

    if (this.contactForm.invalid) {
      this.sent.set(false);
      return;
    }

    // TODO: conectar con el servicio de contacto o backend.
    this.contactForm.reset(undefined, { emitEvent: false });
    this.sent.set(true);
  }
}
