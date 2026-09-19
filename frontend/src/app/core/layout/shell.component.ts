import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideBell,
  LucideCarFront,
  LucideChartLine,
  LucideCircleParking,
  LucideLayoutDashboard,
  LucideLayoutGrid,
  LucideLogOut,
  LucideShieldCheck,
  LucideTicket,
  LucideUsers
} from '@lucide/angular';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';
import { Notificacion } from '../models/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideCircleParking,
    LucideLayoutDashboard,
    LucideCarFront,
    LucideLayoutGrid,
    LucideUsers,
    LucideTicket,
    LucideChartLine,
    LucideShieldCheck,
    LucideLogOut,
    LucideBell
  ],
  template: `
    <div class="flex h-screen overflow-hidden bg-ink-950 text-slate-200">
      <aside class="flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/70 backdrop-blur-xl">
        <div class="flex items-center gap-2.5 px-5 py-5">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
            <svg lucideCircleParking [size]="20"></svg>
          </span>
          <div>
            <h1 class="text-[15px] font-bold leading-tight tracking-tight text-white">ParkManager</h1>
            <p class="text-[11px] text-slate-500">{{ auth.usuario()?.username }} &middot; {{ auth.rol() }}</p>
          </div>
        </div>

        <nav class="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          <a routerLink="/dashboard" routerLinkActive="nav-active" class="nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white">
            <span class="flex shrink-0 items-center opacity-70 transition-opacity group-hover:opacity-100"><svg lucideLayoutDashboard [size]="17"></svg></span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/sesiones" routerLinkActive="nav-active" class="nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white">
            <span class="flex shrink-0 items-center opacity-70 transition-opacity group-hover:opacity-100"><svg lucideCarFront [size]="17"></svg></span>
            <span>Ingreso / Salida</span>
          </a>
          @if (auth.esAdmin()) {
            <a routerLink="/espacios" routerLinkActive="nav-active" class="nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white">
              <span class="flex shrink-0 items-center opacity-70 transition-opacity group-hover:opacity-100"><svg lucideLayoutGrid [size]="17"></svg></span>
              <span>Plazas y tarifas</span>
            </a>
          }
          <a routerLink="/clientes" routerLinkActive="nav-active" class="nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white">
            <span class="flex shrink-0 items-center opacity-70 transition-opacity group-hover:opacity-100"><svg lucideUsers [size]="17"></svg></span>
            <span>Clientes y vehiculos</span>
          </a>
          <a routerLink="/membresias" routerLinkActive="nav-active" class="nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white">
            <span class="flex shrink-0 items-center opacity-70 transition-opacity group-hover:opacity-100"><svg lucideTicket [size]="17"></svg></span>
            <span>Membresias</span>
          </a>
          @if (auth.esAdmin()) {
            <a routerLink="/reportes" routerLinkActive="nav-active" class="nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white">
              <span class="flex shrink-0 items-center opacity-70 transition-opacity group-hover:opacity-100"><svg lucideChartLine [size]="17"></svg></span>
              <span>Reportes</span>
            </a>
            <a routerLink="/usuarios" routerLinkActive="nav-active" class="nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-white">
              <span class="flex shrink-0 items-center opacity-70 transition-opacity group-hover:opacity-100"><svg lucideShieldCheck [size]="17"></svg></span>
              <span>Usuarios</span>
            </a>
          }
        </nav>

        <div class="p-3">
          <button (click)="auth.logout()"
                  class="btn-ghost w-full !justify-start !rounded-xl hover:!border-red-400/25 hover:!bg-red-500/10 hover:!text-red-300">
            <svg lucideLogOut [size]="16"></svg>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <div class="flex flex-1 flex-col overflow-hidden">
        <header class="flex items-center justify-end border-b border-white/[0.06] bg-ink-900/40 px-6 py-3 backdrop-blur-xl">
          <div class="relative">
            <button (click)="mostrarNotificaciones.set(!mostrarNotificaciones())"
                    class="btn-icon relative">
              <svg lucideBell [size]="17"></svg>
              @if (noLeidas() > 0) {
                <span class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {{ noLeidas() }}
                </span>
              }
            </button>
            @if (mostrarNotificaciones()) {
              <div class="glass-panel-strong absolute right-0 top-11 z-20 w-80 animate-fade-in overflow-hidden !p-0">
                <div class="label-eyebrow border-b border-white/[0.06] px-4 py-3">Notificaciones</div>
                <div class="max-h-96 overflow-y-auto">
                  @if (notificaciones().length === 0) {
                    <p class="px-4 py-8 text-center text-sm text-slate-500">Sin notificaciones</p>
                  }
                  @for (n of notificaciones(); track n.id) {
                    <div class="cursor-pointer border-b border-white/[0.04] px-4 py-3 text-sm transition-colors hover:bg-white/[0.03]"
                         [ngClass]="{ 'bg-accent-500/[0.04]': !n.leida }"
                         (click)="marcarLeida(n)">
                      <p class="text-slate-200">{{ n.mensaje }}</p>
                      <p class="mt-0.5 text-[11px] text-slate-500">{{ n.fechaCreacion | date: 'short' }}</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </header>
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .nav-active {
      color: white;
      background: linear-gradient(90deg, rgba(34,197,94,0.14), rgba(34,197,94,0.02));
      box-shadow: inset 2px 0 0 0 #22c55e;
    }
    .nav-active svg { opacity: 1; color: #34d399; }
  `]
})
export class ShellComponent implements OnInit {
  mostrarNotificaciones = signal(false);
  notificaciones = signal<Notificacion[]>([]);

  constructor(public auth: AuthService, private notificacionService: NotificacionService) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
    setInterval(() => this.cargarNotificaciones(), 60000);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.mostrarNotificaciones()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) this.mostrarNotificaciones.set(false);
  }

  noLeidas(): number {
    return this.notificaciones().filter((n) => !n.leida).length;
  }

  cargarNotificaciones(): void {
    this.notificacionService.listar(false).subscribe((n) => this.notificaciones.set(n));
  }

  marcarLeida(n: Notificacion): void {
    if (n.leida) return;
    this.notificacionService.marcarLeida(n.id).subscribe(() => this.cargarNotificaciones());
  }
}
