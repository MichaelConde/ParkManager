import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideCircleAlert, LucideCircleParking, LucideLock, LucideUser } from '@lucide/angular';
import gsap from 'gsap';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideCircleParking, LucideUser, LucideLock, LucideCircleAlert],
  template: `
    <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4">
      <div class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-500/10 blur-[120px]"></div>
      <div class="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-cyan-400/10 blur-[120px]"></div>
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_60%)]"></div>

      <div #card class="glass-panel-strong relative w-full max-w-sm p-8">
        <div class="mb-7 flex flex-col items-center text-center">
          <span class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-400 shadow-glow-sm">
            <svg lucideCircleParking [size]="26"></svg>
          </span>
          <h1 class="text-xl font-bold tracking-tight text-white">ParkManager</h1>
          <p class="mt-1 text-sm text-slate-500">Sistema de gestion de estacionamiento</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="ingresar()" class="space-y-4">
          <div>
            <label class="label-eyebrow mb-1.5 block">Usuario</label>
            <div class="relative">
              <svg lucideUser [size]="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"></svg>
              <input formControlName="username" type="text" autocomplete="username" class="glass-input !pl-10" />
            </div>
          </div>
          <div>
            <label class="label-eyebrow mb-1.5 block">Contrasena</label>
            <div class="relative">
              <svg lucideLock [size]="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"></svg>
              <input formControlName="password" type="password" autocomplete="current-password" class="glass-input !pl-10" />
            </div>
          </div>

          @if (error()) {
            <p class="flex items-center gap-1.5 text-sm text-red-400">
              <svg lucideCircleAlert [size]="14"></svg>
              {{ error() }}
            </p>
          }

          <button type="submit" [disabled]="form.invalid || cargando()" class="btn-primary w-full !py-2.5">
            {{ cargando() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <p class="mt-7 text-center text-[11px] leading-relaxed text-slate-600">
          Usuario semilla: admin / admin123 (ADMIN)<br />cajero1 / cajero123 (CAJERO)
        </p>
      </div>
    </div>
  `
})
export class LoginComponent implements AfterViewInit {
  private fb = inject(FormBuilder);

  cargando = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(private auth: AuthService, private router: Router) {}

  ngAfterViewInit(): void {
    gsap.fromTo(
      '.glass-panel-strong',
      { opacity: 0, y: 18, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
    );
  }

  ingresar(): void {
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue() as { username: string; password: string }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(
          err.status === 401
            ? 'Usuario o contrasena incorrectos'
            : 'No se pudo conectar con el servidor. Si no lo usabas hace rato, puede estar reactivandose: espera unos segundos y reintenta.'
        );
        this.cargando.set(false);
      }
    });
  }
}
