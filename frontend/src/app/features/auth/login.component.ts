import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-brand-700 px-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div class="text-center mb-6">
          <div class="text-4xl mb-2">🅿️</div>
          <h1 class="text-xl font-bold text-slate-800">ParkManager</h1>
          <p class="text-sm text-slate-500">Sistema de gestion de estacionamiento</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="ingresar()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
            <input formControlName="username" type="text" autocomplete="username"
                   class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Contrasena</label>
            <input formControlName="password" type="password" autocomplete="current-password"
                   class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          @if (error()) {
            <p class="text-sm text-red-600">{{ error() }}</p>
          }

          <button type="submit" [disabled]="form.invalid || cargando()"
                  class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors">
            {{ cargando() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <p class="text-xs text-slate-400 text-center mt-6">
          Usuario semilla: admin / admin123 (ADMIN)<br />cajero1 / cajero123 (CAJERO)
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);

  cargando = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(private auth: AuthService, private router: Router) {}

  ingresar(): void {
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue() as { username: string; password: string }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error.set('Usuario o contrasena incorrectos');
        this.cargando.set(false);
      }
    });
  }
}
