import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideBanknote, LucideDownload, LucideReceipt } from '@lucide/angular';
import { ReporteService } from '../../core/services/reporte.service';
import { ReporteIngresos, ReporteOcupacion } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';
import { GlassCardComponent } from '../../shared/ui/glass-card.component';
import { StatTileComponent } from '../../shared/ui/stat-tile.component';
import { GsapRevealDirective } from '../../shared/animations/gsap-reveal.directive';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GlassCardComponent,
    StatTileComponent,
    GsapRevealDirective,
    LucideDownload,
    LucideBanknote,
    LucideReceipt
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Reportes</h2>
          <p class="text-sm text-slate-500">Ingresos, ocupacion y desempeno del estacionamiento</p>
        </div>
        <div class="flex items-end gap-2">
          <div>
            <label class="label-eyebrow mb-1.5 block">Desde</label>
            <input type="date" [(ngModel)]="desde" class="glass-input" />
          </div>
          <div>
            <label class="label-eyebrow mb-1.5 block">Hasta</label>
            <input type="date" [(ngModel)]="hasta" class="glass-input" />
          </div>
          <button (click)="cargar()" class="btn-primary">Consultar</button>
          <button (click)="exportar()" class="btn-ghost">
            <svg lucideDownload [size]="15"></svg> Excel
          </button>
        </div>
      </div>

      @if (ingresos(); as r) {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div gsapReveal [gsapIndex]="0">
            <app-stat-tile label="Total ingresos" [value]="'S/ ' + r.totalIngresos.toFixed(2)" tone="accent">
              <svg icon lucideBanknote [size]="19"></svg>
            </app-stat-tile>
          </div>
          <div gsapReveal [gsapIndex]="1">
            <app-stat-tile label="Sesiones cobradas" [value]="r.totalSesiones" tone="cyan">
              <svg icon lucideReceipt [size]="19"></svg>
            </app-stat-tile>
          </div>
          <div gsapReveal [gsapIndex]="2">
            <app-stat-tile label="Ticket promedio" [value]="'S/ ' + ticketPromedio(r)" tone="amber">
              <svg icon lucideBanknote [size]="19"></svg>
            </app-stat-tile>
          </div>
        </div>

        <app-glass-card padding="lg">
          <p class="label-eyebrow mb-4">Ingresos por dia</p>
          <canvas #ingresosChart height="90"></canvas>
        </app-glass-card>
      }

      @if (ocupacion(); as o) {
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <app-glass-card padding="lg">
            <p class="label-eyebrow mb-4">Ocupacion actual por tipo</p>
            <div class="space-y-4">
              @for (t of o.porTipo; track t.tipo) {
                <div>
                  <div class="mb-1.5 flex justify-between text-sm">
                    <span class="text-slate-300">{{ t.tipo }} ({{ t.ocupadas }}/{{ t.total }})</span>
                    <span class="font-semibold text-white">{{ t.porcentajeOcupacion }}%</span>
                  </div>
                  <div class="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div class="h-2 rounded-full bg-gradient-to-r from-accent-500 to-cyan-400 transition-all duration-500" [style.width.%]="t.porcentajeOcupacion"></div>
                  </div>
                </div>
              }
            </div>
          </app-glass-card>
          <app-glass-card padding="lg">
            <p class="label-eyebrow mb-4">Plazas mas utilizadas</p>
            <div class="space-y-1">
              @for (p of o.plazasMasUsadas; track p.codigo) {
                <div class="flex justify-between border-b border-white/[0.06] py-2 text-sm last:border-0">
                  <span class="text-slate-300">{{ p.codigo }}</span>
                  <span class="font-semibold text-white">{{ p.totalSesiones }} sesiones</span>
                </div>
              }
              @if (o.plazasMasUsadas.length === 0) {
                <p class="py-6 text-center text-sm text-slate-500">Sin datos en el periodo seleccionado.</p>
              }
            </div>
          </app-glass-card>
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

    const gridColor = 'rgba(255,255,255,0.06)';
    const textColor = '#8B93A7';

    this.chart?.destroy();
    this.chart = new Chart(this.ingresosChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: r.porDia.map((d) => d.fecha),
        datasets: [
          {
            label: 'Ingresos (S/)',
            data: r.porDia.map((d) => d.total),
            backgroundColor: '#22c55e',
            borderRadius: 6,
            maxBarThickness: 36
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d1424',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
          x: { grid: { display: false }, ticks: { color: textColor } }
        }
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
