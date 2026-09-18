import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlazaService } from '../../core/services/plaza.service';
import { SesionService } from '../../core/services/sesion.service';
import { Plaza, Sesion } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p class="text-sm text-slate-500">Vision general de ocupacion e ingresos en tiempo real</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 border-brand-500">
          <p class="text-xs text-slate-500 uppercase tracking-wide">Sesiones activas</p>
          <p class="text-3xl font-bold text-slate-800 mt-1">{{ sesionesActivas().length }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
          <p class="text-xs text-slate-500 uppercase tracking-wide">Plazas libres</p>
          <p class="text-3xl font-bold text-slate-800 mt-1">{{ libres() }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
          <p class="text-xs text-slate-500 uppercase tracking-wide">Plazas ocupadas</p>
          <p class="text-3xl font-bold text-slate-800 mt-1">{{ ocupadas() }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500">
          <p class="text-xs text-slate-500 uppercase tracking-wide">Ocupacion total</p>
          <p class="text-3xl font-bold text-slate-800 mt-1">{{ porcentajeOcupacion() }}%</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-slate-800">Mapa de plazas</h3>
            <a routerLink="/sesiones" class="text-sm text-brand-600 hover:underline">Ir a ingreso/salida →</a>
          </div>
          <div class="grid grid-cols-6 sm:grid-cols-8 gap-2">
            @for (p of plazas(); track p.id) {
              <div class="aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold text-white"
                   [class.bg-red-500]="p.estado === 'OCUPADA'"
                   [class.bg-green-500]="p.estado === 'LIBRE'"
                   [title]="p.codigo + ' - ' + p.tipo + ' - ' + p.estado">
                {{ p.codigo }}
              </div>
            }
          </div>
          @if (plazas().length === 0) {
            <p class="text-sm text-slate-400 text-center py-6">No hay plazas configuradas todavia.</p>
          }
        </div>

        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-slate-800 mb-4">Sesiones activas</h3>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            @for (s of sesionesActivas(); track s.id) {
              <div class="border rounded-lg px-3 py-2 text-sm">
                <div class="flex justify-between">
                  <span class="font-semibold">{{ s.placa }}</span>
                  <span class="text-slate-500">{{ s.plazaCodigo }}</span>
                </div>
                <p class="text-xs text-slate-400">Desde {{ s.horaEntrada | date: 'short' }}</p>
              </div>
            }
            @if (sesionesActivas().length === 0) {
              <p class="text-sm text-slate-400 text-center py-6">No hay vehiculos estacionados actualmente.</p>
            }
          </div>
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

  ngOnInit(): void {
    this.cargar();
    setInterval(() => this.cargar(), 30000);
  }

  private cargar(): void {
    this.plazaService.listar().subscribe((p) => this.plazas.set(p));
    this.sesionService.activas().subscribe((s) => this.sesionesActivas.set(s));
  }
}
