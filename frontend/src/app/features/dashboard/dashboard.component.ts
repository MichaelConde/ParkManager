import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideCarFront,
  LucideCircleCheckBig,
  LucideGauge,
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
    LucideX
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
            <div class="mb-4 flex items-center justify-between">
              <p class="label-eyebrow">Mapa de plazas</p>
              <p class="text-[11px] text-slate-600">Arrastra para rotar &middot; click en un vehiculo para su salida</p>
            </div>
            <div class="h-[420px] overflow-hidden rounded-xl bg-black/20">
              <app-parking-scene [plazas]="plazas()" [sesiones]="sesionesActivas()" (vehicleClick)="onVehicleClick($event)" />
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
  `
})
export class DashboardComponent implements OnInit {
  plazas = signal<Plaza[]>([]);
  sesionesActivas = signal<Sesion[]>([]);

  sesionSeleccionada = signal<Sesion | null>(null);
  reciboSalida = signal<Recibo | null>(null);
  procesandoSalida = signal(false);
  metodoPagoSalida: MetodoPago = 'EFECTIVO';

  libres = computed(() => this.plazas().filter((p) => p.estado === 'LIBRE').length);
  ocupadas = computed(() => this.plazas().filter((p) => p.estado === 'OCUPADA').length);
  porcentajeOcupacion = computed(() => {
    const total = this.plazas().length;
    return total === 0 ? 0 : Math.round((this.ocupadas() * 1000) / total) / 10;
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
