import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideCarFront,
  LucideCircleCheckBig,
  LucideGauge,
  LucideHash,
  LucideLogIn,
  LucideMotorbike,
  LucidePrinter,
  LucideSquareParking,
  LucideUsers,
  LucideX
} from '@lucide/angular';
import { PlazaService } from '../../core/services/plaza.service';
import { SesionService } from '../../core/services/sesion.service';
import { MetodoPago, Plaza, Recibo, Sesion } from '../../core/models/models';
import { GlassCardComponent } from '../../shared/ui/glass-card.component';
import { StatTileComponent } from '../../shared/ui/stat-tile.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { GsapRevealDirective } from '../../shared/animations/gsap-reveal.directive';
import { ParkingSceneComponent } from './parking-3d/parking-scene.component';
import { VehiclePreviewComponent } from '../../shared/three/vehicle-preview.component';
import { colorForSeed } from '../../shared/three/car-palette';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GlassCardComponent,
    StatTileComponent,
    StatusBadgeComponent,
    GsapRevealDirective,
    ParkingSceneComponent,
    VehiclePreviewComponent,
    LucideCarFront,
    LucideMotorbike,
    LucideSquareParking,
    LucideUsers,
    LucideGauge,
    LucideCircleCheckBig,
    LucidePrinter,
    LucideX,
    LucideLogIn,
    LucideHash
  ],
  template: `
    <div class="space-y-6">
      <div gsapReveal [gsapIndex]="0">
        <h2 class="text-2xl font-bold tracking-tight text-white">Dashboard</h2>
        <p class="text-sm text-slate-500">Vision general de ocupacion e ingresos en tiempo real</p>
      </div>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div gsapReveal [gsapIndex]="1">
          <app-stat-tile label="Sesiones activas" [value]="sesionesActivas().length" tone="accent">
            <svg icon lucideCarFront [size]="19"></svg>
          </app-stat-tile>
        </div>
        <div gsapReveal [gsapIndex]="2">
          <app-stat-tile label="Plazas libres" [value]="libres()" tone="cyan">
            <svg icon lucideSquareParking [size]="19"></svg>
          </app-stat-tile>
        </div>
        <div gsapReveal [gsapIndex]="3">
          <app-stat-tile label="Plazas ocupadas" [value]="ocupadas()" tone="violet">
            <svg icon lucideUsers [size]="19"></svg>
          </app-stat-tile>
        </div>
        <div gsapReveal [gsapIndex]="4">
          <app-stat-tile label="Ocupacion total" [value]="porcentajeOcupacion() + '%'" tone="amber">
            <svg icon lucideGauge [size]="19"></svg>
          </app-stat-tile>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div gsapReveal [gsapIndex]="5" class="lg:col-span-2">
          <app-glass-card padding="lg" [glow]="true">
            <div class="mb-3 flex items-center justify-between">
              <p class="label-eyebrow">Mapa de plazas</p>
              <p class="text-[11px] text-slate-600">Arrastra para rotar &middot; click en una plaza para su ingreso/salida</p>
            </div>
            @if (zonasDisponibles().length > 0) {
              <div class="mb-4 flex gap-2 overflow-x-auto pb-1">
                <button (click)="zonaSeleccionada.set(null)"
                        class="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200"
                        [ngClass]="zonaSeleccionada() === null ? 'bg-accent-500 text-ink-950 shadow-glow-sm' : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'">
                  Todos
                </button>
                @for (z of zonasDisponibles(); track z) {
                  <button (click)="zonaSeleccionada.set(z)"
                          class="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200"
                          [ngClass]="zonaSeleccionada() === z ? 'bg-accent-500 text-ink-950 shadow-glow-sm' : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'">
                    {{ z }}
                  </button>
                }
              </div>
            }
            <div class="h-[420px] overflow-hidden rounded-xl bg-black/20">
              <app-parking-scene
                [plazas]="plazasFiltradas()"
                [sesiones]="sesionesEnMapa()"
                (vehicleClick)="onVehicleClick($event)"
                (freeSlotClick)="onFreeSlotClick($event)"
              />
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-4">
              <app-status-badge label="Disponible" tone="available" />
              <app-status-badge label="Ocupado" tone="occupied" />
            </div>
          </app-glass-card>
        </div>

        <div gsapReveal [gsapIndex]="6">
          <app-glass-card padding="lg">
            <p class="label-eyebrow mb-4">Sesiones activas</p>
            <div class="max-h-[440px] space-y-2 overflow-y-auto">
              @for (s of sesionesActivas(); track s.id; let i = $index) {
                <div gsapReveal [gsapIndex]="i" (click)="onVehicleClick(s.codigoQr)" class="cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-sm transition-colors hover:bg-white/[0.05]">
                  <div class="flex items-center justify-between">
                    <span class="flex items-center gap-2">
                      <span class="h-2.5 w-2.5 shrink-0 rounded-full" [style.background]="colorHex(s.codigoQr)" [style.box-shadow]="'0 0 6px 0 ' + colorHex(s.codigoQr)"></span>
                      @if (s.tipoVehiculo === 'AUTO') {
                        <svg lucideCarFront [size]="13" class="shrink-0 text-slate-500"></svg>
                      } @else {
                        <svg lucideMotorbike [size]="13" class="shrink-0 text-slate-500"></svg>
                      }
                      <span class="font-semibold text-white">{{ s.placa }}</span>
                    </span>
                    <span class="text-xs text-slate-500">{{ s.plazaCodigo }}</span>
                  </div>
                  <p class="mt-0.5 text-[11px] text-slate-500">Desde {{ s.horaEntrada | date: 'short' }}</p>
                </div>
              }
              @if (sesionesActivas().length === 0) {
                <p class="py-10 text-center text-sm text-slate-500">No hay vehiculos estacionados actualmente.</p>
              }
            </div>
          </app-glass-card>
        </div>
      </div>
    </div>

    @if (sesionSeleccionada(); as s) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" (click)="cerrarPanelSalida()">
        <div class="w-full max-w-md animate-fade-in" (click)="$event.stopPropagation()">
          <app-glass-card padding="lg" [hoverable]="false">
            @if (reciboSalida(); as r) {
              <div class="flex flex-col items-center text-center">
                <p class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-accent-400">
                  <svg lucideCircleCheckBig [size]="17"></svg> Comprobante
                </p>
                <p class="text-sm text-slate-300">Placa: <b class="text-white">{{ r.sesion.placa }}</b></p>
                <p class="text-sm text-slate-300">Duracion: {{ r.sesion.duracionMinutos }} min</p>
                <p class="text-sm text-slate-300">Metodo de pago: {{ r.pago.metodo }}</p>
                <p class="mt-2 text-3xl font-bold text-white">S/ {{ r.pago.monto.toFixed(2) }}</p>
                <div class="mt-4 flex gap-2">
                  <button (click)="imprimirRecibo(r)" class="btn-ghost">
                    <svg lucidePrinter [size]="15"></svg>
                    Imprimir
                  </button>
                  <button (click)="cerrarPanelSalida()" class="btn-primary">Cerrar</button>
                </div>
              </div>
            } @else {
              <div class="mb-4 flex items-center justify-between">
                <p class="label-eyebrow">Plaza {{ s.plazaCodigo }}</p>
                <button (click)="cerrarPanelSalida()" class="text-slate-500 transition-colors hover:text-white">
                  <svg lucideX [size]="18"></svg>
                </button>
              </div>
              <div class="mb-3 h-32 w-full">
                <app-vehicle-preview [tipo]="s.tipoVehiculo" [seed]="s.codigoQr" />
              </div>
              <p class="text-sm text-slate-300"><b class="text-white">Placa:</b> {{ s.placa }} ({{ s.tipoVehiculo }})</p>
              <p class="text-sm text-slate-300"><b class="text-white">Entrada:</b> {{ s.horaEntrada | date: 'short' }}</p>
              <p class="text-sm text-slate-300"><b class="text-white">Tiempo transcurrido:</b> {{ s.duracionMinutos }} min</p>
              <p class="text-lg font-bold text-accent-400">
                {{ s.membresiaAplicada ? 'Membresia activa: sin cargo' : 'Monto estimado: S/ ' + s.montoCobrado?.toFixed(2) }}
              </p>
              <div class="mt-3 border-t border-white/[0.08] pt-3">
                <label class="label-eyebrow mb-1.5 block">Metodo de pago</label>
                <select [(ngModel)]="metodoPagoSalida" [ngModelOptions]="{standalone: true}" class="glass-input mb-3">
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="OTRO">Otro</option>
                </select>
                <button (click)="confirmarSalidaDesdeMapa(s)" [disabled]="procesandoSalida()" class="btn-primary w-full !py-2.5">
                  {{ procesandoSalida() ? 'Procesando...' : 'Confirmar salida y cobrar' }}
                </button>
              </div>
            }
          </app-glass-card>
        </div>
      </div>
    }

    @if (plazaLibreSeleccionada(); as p) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" (click)="cerrarPanelIngreso()">
        <div class="w-full max-w-md animate-fade-in" (click)="$event.stopPropagation()">
          <app-glass-card padding="lg" [hoverable]="false">
            @if (ultimoIngresoDesdeMapa(); as s) {
              <div class="flex flex-col items-center text-center">
                <p class="label-eyebrow mb-2">Ticket generado</p>
                <div class="mb-2 h-32 w-full max-w-[200px]">
                  <app-vehicle-preview [tipo]="s.tipoVehiculo" [seed]="s.codigoQr" />
                </div>
                <img [src]="s.qrImageBase64" alt="QR" class="mb-3 h-24 w-24 rounded-lg border border-white/10 bg-white p-1" />
                <p class="text-sm text-slate-300">Placa: <b class="text-white">{{ s.placa }}</b></p>
                <p class="text-sm text-slate-300">Plaza asignada: <b class="text-white">{{ s.plazaCodigo }}</b></p>
                <p class="mt-2 flex items-center gap-1 text-[11px] text-slate-600">
                  <svg lucideHash [size]="11"></svg>{{ s.codigoQr }}
                </p>
                <div class="mt-4 flex gap-2">
                  <button (click)="imprimirTicket(s)" class="btn-ghost">
                    <svg lucidePrinter [size]="15"></svg>
                    Imprimir
                  </button>
                  <button (click)="cerrarPanelIngreso()" class="btn-primary">Cerrar</button>
                </div>
              </div>
            } @else {
              <div class="mb-4 flex items-center justify-between">
                <p class="label-eyebrow flex items-center gap-1.5">
                  <svg lucideLogIn [size]="14"></svg> Ingreso en plaza {{ p.codigo }} ({{ p.tipo }})
                </p>
                <button (click)="cerrarPanelIngreso()" class="text-slate-500 transition-colors hover:text-white">
                  <svg lucideX [size]="18"></svg>
                </button>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="label-eyebrow mb-1.5 block">Placa</label>
                  <input [(ngModel)]="placaIngreso" [ngModelOptions]="{standalone: true}" type="text" class="glass-input uppercase" placeholder="ABC-123" />
                </div>
                <div>
                  <label class="label-eyebrow mb-1.5 block">Modelo (opcional)</label>
                  <input [(ngModel)]="modeloIngreso" [ngModelOptions]="{standalone: true}" type="text" class="glass-input" />
                </div>
                <div>
                  <label class="label-eyebrow mb-1.5 block">ID de cliente (opcional, para membresias)</label>
                  <input [(ngModel)]="clienteIdIngreso" [ngModelOptions]="{standalone: true}" type="number" class="glass-input" />
                </div>
                <button (click)="registrarIngresoDesdeMapa(p)" [disabled]="!placaIngreso.trim() || procesandoIngreso()" class="btn-primary w-full !py-2.5">
                  {{ procesandoIngreso() ? 'Procesando...' : 'Registrar ingreso' }}
                </button>
              </div>
            }
          </app-glass-card>
        </div>
      </div>
    }
  `
})
export class DashboardComponent implements OnInit {
  plazas = signal<Plaza[]>([]);
  sesionesActivas = signal<Sesion[]>([]);

  sesionSeleccionada = signal<Sesion | null>(null);
  reciboSalida = signal<Recibo | null>(null);
  procesandoSalida = signal(false);
  metodoPagoSalida: MetodoPago = 'EFECTIVO';

  plazaLibreSeleccionada = signal<Plaza | null>(null);
  ultimoIngresoDesdeMapa = signal<Sesion | null>(null);
  procesandoIngreso = signal(false);
  placaIngreso = '';
  modeloIngreso = '';
  clienteIdIngreso: number | null = null;

  libres = computed(() => this.plazas().filter((p) => p.estado === 'LIBRE').length);
  ocupadas = computed(() => this.plazas().filter((p) => p.estado === 'OCUPADA').length);
  porcentajeOcupacion = computed(() => {
    const total = this.plazas().length;
    return total === 0 ? 0 : Math.round((this.ocupadas() * 1000) / total) / 10;
  });

  zonaSeleccionada = signal<string | null>(null);
  zonasDisponibles = computed(() => {
    const set = new Set<string>();
    for (const p of this.plazas()) {
      const zona = p.zona?.trim();
      if (zona) set.add(zona);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  });
  plazasFiltradas = computed(() => {
    const zona = this.zonaSeleccionada();
    return zona ? this.plazas().filter((p) => p.zona === zona) : this.plazas();
  });
  sesionesEnMapa = computed(() => {
    const codigos = new Set(this.plazasFiltradas().map((p) => p.codigo));
    return this.sesionesActivas().filter((s) => codigos.has(s.plazaCodigo));
  });

  constructor(private plazaService: PlazaService, private sesionService: SesionService, private toast: ToastService) {}

  colorHex(seed: string): string {
    return '#' + colorForSeed(seed).toString(16).padStart(6, '0');
  }

  onVehicleClick(codigoQr: string): void {
    const sesion = this.sesionesActivas().find((s) => s.codigoQr === codigoQr);
    if (!sesion) return;
    this.reciboSalida.set(null);
    this.metodoPagoSalida = 'EFECTIVO';
    this.sesionSeleccionada.set(sesion);
  }

  cerrarPanelSalida(): void {
    this.sesionSeleccionada.set(null);
    this.reciboSalida.set(null);
  }

  onFreeSlotClick(plazaCodigo: string): void {
    const plaza = this.plazas().find((p) => p.codigo === plazaCodigo);
    if (!plaza || plaza.estado !== 'LIBRE') return;
    this.ultimoIngresoDesdeMapa.set(null);
    this.placaIngreso = '';
    this.modeloIngreso = '';
    this.clienteIdIngreso = null;
    this.plazaLibreSeleccionada.set(plaza);
  }

  cerrarPanelIngreso(): void {
    this.plazaLibreSeleccionada.set(null);
    this.ultimoIngresoDesdeMapa.set(null);
  }

  registrarIngresoDesdeMapa(p: Plaza): void {
    if (!this.placaIngreso.trim()) return;
    this.procesandoIngreso.set(true);
    this.sesionService
      .ingreso({
        placa: this.placaIngreso.toUpperCase(),
        tipo: p.tipo,
        modelo: this.modeloIngreso || undefined,
        clienteId: this.clienteIdIngreso ?? undefined,
        plazaId: p.id
      })
      .subscribe({
        next: (s) => {
          this.ultimoIngresoDesdeMapa.set(s);
          this.toast.exito(`Ingreso registrado en la plaza ${s.plazaCodigo}`);
          this.procesandoIngreso.set(false);
          this.cargar();
        },
        error: (err) => {
          this.toast.error(err.error?.message ?? 'No se pudo registrar el ingreso');
          this.procesandoIngreso.set(false);
        }
      });
  }

  imprimirTicket(s: Sesion): void {
    const w = window.open('', '_blank', 'width=380,height=600');
    if (!w) return;
    w.document.write(`
      <html><head><title>Ticket ${s.placa}</title></head>
      <body style="font-family: monospace; text-align:center; padding:16px;">
        <h2>ParkManager</h2>
        <p>Placa: <b>${s.placa}</b></p>
        <p>Plaza: <b>${s.plazaCodigo}</b></p>
        <p>Entrada: ${new Date(s.horaEntrada).toLocaleString()}</p>
        <img src="${s.qrImageBase64}" width="180" height="180" />
        <p>${s.codigoQr}</p>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    w.document.close();
  }

  confirmarSalidaDesdeMapa(s: Sesion): void {
    this.procesandoSalida.set(true);
    this.sesionService.salida({ codigoQr: s.codigoQr, metodoPago: this.metodoPagoSalida }).subscribe({
      next: (recibo) => {
        this.reciboSalida.set(recibo);
        this.toast.exito('Salida registrada correctamente');
        this.procesandoSalida.set(false);
        this.cargar();
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'No se pudo registrar la salida');
        this.procesandoSalida.set(false);
      }
    });
  }

  imprimirRecibo(r: Recibo): void {
    const w = window.open('', '_blank', 'width=380,height=600');
    if (!w) return;
    w.document.write(`
      <html><head><title>Comprobante ${r.sesion.placa}</title></head>
      <body style="font-family: monospace; text-align:center; padding:16px;">
        <h2>ParkManager</h2>
        <p>Comprobante de pago</p>
        <p>Placa: <b>${r.sesion.placa}</b></p>
        <p>Entrada: ${new Date(r.sesion.horaEntrada).toLocaleString()}</p>
        <p>Salida: ${r.sesion.horaSalida ? new Date(r.sesion.horaSalida).toLocaleString() : '-'}</p>
        <p>Duracion: ${r.sesion.duracionMinutos} min</p>
        <p>Metodo de pago: ${r.pago.metodo}</p>
        <h3>Total: S/ ${r.pago.monto.toFixed(2)}</h3>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    w.document.close();
  }

  ngOnInit(): void {
    this.cargar();
    setInterval(() => this.cargar(), 30000);
  }

  private cargar(): void {
    this.plazaService.listar().subscribe((p) => this.plazas.set(p));
    this.sesionService.activas().subscribe((s) => this.sesionesActivas.set(s));
  }
}
