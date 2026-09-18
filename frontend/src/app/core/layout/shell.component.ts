import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';
import { Notificacion } from '../models/models';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-100">
      <aside class="w-64 flex-shrink-0 bg-slate-900 text-slate-100 flex flex-col">
        <div class="px-5 py-5 border-b border-slate-800">
          <h1 class="text-lg font-bold tracking-tight">🅿️ ParkManager</h1>
          <p class="text-xs text-slate-400 mt-1">{{ auth.usuario()?.username }} · {{ auth.rol() }}</p>
        </div>
        <nav class="flex-1 overflow-y-auto py-3">
          @for (item of navItems; track item.path) {
            @if (!item.adminOnly || auth.esAdmin()) {
              <a [routerLink]="item.path" routerLinkActive="bg-slate-800 border-l-4 border-brand-500"
                 class="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-l-4 border-transparent">
                <span>{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </a>
            }
          }
        </nav>
        <button (click)="auth.logout()"
                class="m-4 px-3 py-2 text-sm rounded bg-slate-800 hover:bg-red-600 transition-colors">
          Cerrar sesion
        </button>
      </aside>

      <div class="flex-1 flex flex-col overflow-hidden">
        <header class="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div></div>
          <div class="relative">
            <button (click)="mostrarNotificaciones.set(!mostrarNotificaciones())"
                    class="relative p-2 rounded-full hover:bg-gray-100">
              🔔
              @if (noLeidas() > 0) {
                <span class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{{ noLeidas() }}</span>
              }
            </button>
            @if (mostrarNotificaciones()) {
              <div class="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                <div class="px-4 py-2 border-b font-semibold text-sm">Notificaciones</div>
                @if (notificaciones().length === 0) {
                  <p class="px-4 py-6 text-sm text-gray-400 text-center">Sin notificaciones</p>
                }
                @for (n of notificaciones(); track n.id) {
                  <div class="px-4 py-2.5 border-b text-sm hover:bg-gray-50 cursor-pointer"
                       [class.bg-blue-50]="!n.leida"
                       (click)="marcarLeida(n)">
                    <p class="text-gray-800">{{ n.mensaje }}</p>
                    <p class="text-[11px] text-gray-400 mt-0.5">{{ n.fechaCreacion | date: 'short' }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </header>
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class ShellComponent implements OnInit {
  mostrarNotificaciones = signal(false);
  notificaciones = signal<Notificacion[]>([]);

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/sesiones', label: 'Ingreso / Salida', icon: '🚗' },
    { path: '/espacios', label: 'Plazas y tarifas', icon: '🅿️', adminOnly: true },
    { path: '/clientes', label: 'Clientes y vehiculos', icon: '👤' },
    { path: '/membresias', label: 'Membresias', icon: '🎫' },
    { path: '/reportes', label: 'Reportes', icon: '📈', adminOnly: true },
    { path: '/usuarios', label: 'Usuarios', icon: '🔐', adminOnly: true },
  ];

  constructor(public auth: AuthService, private notificacionService: NotificacionService) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
    setInterval(() => this.cargarNotificaciones(), 60000);
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
