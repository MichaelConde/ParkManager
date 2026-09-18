import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';
import { ReporteIngresos, ReporteOcupacion } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Reportes</h2>
          <p class="text-sm text-slate-500">Ingresos, ocupacion y desempeno del estacionamiento</p>
        </div>
        <div class="flex items-end gap-2">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Desde</label>
            <input type="date" [(ngModel)]="desde" class="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Hasta</label>
            <input type="date" [(ngModel)]="hasta" class="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button (click)="cargar()" class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            Consultar
          </button>
          <button (click)="exportar()" class="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg">
            📥 Excel
          </button>
        </div>
      </div>

      @if (ingresos(); as r) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 border-brand-500">
            <p class="text-xs text-slate-500 uppercase">Total ingresos</p>
            <p class="text-2xl font-bold text-slate-800">S/ {{ r.totalIngresos.toFixed(2) }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
            <p class="text-xs text-slate-500 uppercase">Sesiones cobradas</p>
            <p class="text-2xl font-bold text-slate-800">{{ r.totalSesiones }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500">
            <p class="text-xs text-slate-500 uppercase">Ticket promedio</p>
            <p class="text-2xl font-bold text-slate-800">S/ {{ ticketPromedio(r) }}</p>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-slate-800 mb-4">Ingresos por dia</h3>
          <canvas #ingresosChart height="90"></canvas>
        </div>
      }

      @if (ocupacion(); as o) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">Ocupacion actual por tipo</h3>
            <div class="space-y-3">
              @for (t of o.porTipo; track t.tipo) {
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span>{{ t.tipo }} ({{ t.ocupadas }}/{{ t.total }})</span>
                    <span>{{ t.porcentajeOcupacion }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2.5">
                    <div class="bg-brand-600 h-2.5 rounded-full" [style.width.%]="t.porcentajeOcupacion"></div>
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">Plazas mas utilizadas</h3>
            <div class="space-y-2">
              @for (p of o.plazasMasUsadas; track p.codigo) {
                <div class="flex justify-between text-sm border-b py-1.5">
                  <span>{{ p.codigo }}</span>
                  <span class="font-semibold">{{ p.totalSesiones }} sesiones</span>
                </div>
              }
              @if (o.plazasMasUsadas.length === 0) {
                <p class="text-sm text-slate-400">Sin datos en el periodo seleccionado.</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ReportsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ingresosChart') ingresosChartRef?: ElementRef<HTMLCanvasElement>;

  desde = this.hace30Dias();
  hasta = this.hoy();

  ingresos = signal<ReporteIngresos | null>(null);
  ocupacion = signal<ReporteOcupacion | null>(null);

  private chart: any = null;

  constructor(private reporteService: ReporteService, private toast: ToastService) {}

  ngAfterViewInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  cargar(): void {
    this.reporteService.ingresos(this.desde, this.hasta).subscribe((r) => {
      this.ingresos.set(r);
      setTimeout(() => this.pintarGrafica(r), 0);
    });
    this.reporteService.ocupacion(this.desde, this.hasta).subscribe((o) => this.ocupacion.set(o));
  }

  ticketPromedio(r: ReporteIngresos): string {
    if (r.totalSesiones === 0) return '0.00';
    return (r.totalIngresos / r.totalSesiones).toFixed(2);
  }

  exportar(): void {
    this.reporteService.descargarExcel(this.desde, this.hasta).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-ingresos-${this.desde}_a_${this.hasta}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('No se pudo generar el archivo Excel')
    });
  }

  private async pintarGrafica(r: ReporteIngresos): Promise<void> {
    if (!this.ingresosChartRef) return;
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    this.chart?.destroy();
    this.chart = new Chart(this.ingresosChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: r.porDia.map((d) => d.fecha),
        datasets: [
          {
            label: 'Ingresos (S/)',
            data: r.porDia.map((d) => d.total),
            backgroundColor: '#2563eb'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private hoy(): string {
    return new Date().toISOString().substring(0, 10);
  }

  private hace30Dias(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().substring(0, 10);
  }
}
