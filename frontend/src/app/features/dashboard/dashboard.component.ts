import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { LucideCarFront, LucideGauge, LucideMotorbike, LucideSquareParking, LucideUsers } from '@lucide/angular';
import { PlazaService } from '../../core/services/plaza.service';
import { SesionService } from '../../core/services/sesion.service';
import { Plaza, Sesion } from '../../core/models/models';
import { GlassCardComponent } from '../../shared/ui/glass-card.component';
import { StatTileComponent } from '../../shared/ui/stat-tile.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { GsapRevealDirective } from '../../shared/animations/gsap-reveal.directive';
import { ParkingSceneComponent } from './parking-3d/parking-scene.component';
import { colorForSeed } from '../../shared/three/car-palette';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    GlassCardComponent,
    StatTileComponent,
    StatusBadgeComponent,
    GsapRevealDirective,
    ParkingSceneComponent,
    LucideCarFront,
    LucideMotorbike,
    LucideSquareParking,
    LucideUsers,
    LucideGauge
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
              <p class="text-[11px] text-slate-600">Arrastra para rotar</p>
            </div>
            <div class="h-[420px] overflow-hidden rounded-xl bg-black/20">
              <app-parking-scene [plazas]="plazas()" [sesiones]="sesionesActivas()" />
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
                <div gsapReveal [gsapIndex]="i" class="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-sm transition-colors hover:bg-white/[0.05]">
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
  `
})
export class DashboardComponent implements OnInit {
  plazas = signal<Plaza[]>([]);
  sesionesActivas = signal<Sesion[]>([]);

  libres = computed(() => this.plazas().filter((p) => p.estado === 'LIBRE').length);
  ocupadas = computed(() => this.plazas().filter((p) => p.estado === 'OCUPADA').length);
  porcentajeOcupacion = computed(() => {
    const total = this.plazas().length;
    return total === 0 ? 0 : Math.round((this.ocupadas() * 1000) / total) / 10;
  });

  constructor(private plazaService: PlazaService, private sesionService: SesionService) {}

  colorHex(seed: string): string {
    return '#' + colorForSeed(seed).toString(16).padStart(6, '0');
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
