import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideCamera,
  LucideCircleCheckBig,
  LucideHash,
  LucideIdCard,
  LucideLogIn,
  LucideLogOut,
  LucidePrinter,
  LucideScanLine,
  LucideSearch,
  LucideX
} from '@lucide/angular';
import { SesionService } from '../../core/services/sesion.service';
import { MetodoPago, Recibo, Sesion, TipoVehiculo } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';
import { GlassCardComponent } from '../../shared/ui/glass-card.component';
import { VehiclePreviewComponent } from '../../shared/three/vehicle-preview.component';

type Tab = 'ingreso' | 'salida';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    GlassCardComponent,
    VehiclePreviewComponent,
    LucideLogIn,
    LucideLogOut,
    LucidePrinter,
    LucideScanLine,
    LucideCamera,
    LucideSearch,
    LucideCircleCheckBig,
    LucideX,
    LucideIdCard,
    LucideHash
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-white">Ingreso / Salida de vehiculos</h2>
        <p class="text-sm text-slate-500">Registra el ingreso, calcula la tarifa y cobra al salir</p>
      </div>

      <div class="pill-toggle w-fit">
        <button (click)="tab.set('ingreso')"
                class="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200"
                [ngClass]="tab() === 'ingreso' ? 'bg-accent-500 text-ink-950 shadow-glow-sm' : 'text-slate-400 hover:text-white'">
          <svg lucideLogIn [size]="15"></svg>
          Ingreso
        </button>
        <button (click)="tab.set('salida')"
                class="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200"
                [ngClass]="tab() === 'salida' ? 'bg-accent-500 text-ink-950 shadow-glow-sm' : 'text-slate-400 hover:text-white'">
          <svg lucideLogOut [size]="15"></svg>
          Salida
        </button>
      </div>

      <!-- INGRESO -->
      @if (tab() === 'ingreso') {
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <app-glass-card padding="lg">
            <p class="label-eyebrow mb-4">Registrar ingreso</p>
            <form [formGroup]="formIngreso" (ngSubmit)="registrarIngreso()" class="space-y-4">
              <div>
                <label class="label-eyebrow mb-1.5 block">Placa</label>
                <input formControlName="placa" type="text" class="glass-input uppercase" placeholder="ABC-123" />
              </div>
              <div>
                <label class="label-eyebrow mb-1.5 block">Tipo de vehiculo</label>
                <select formControlName="tipo" class="glass-input">
                  <option value="AUTO">AUTO</option>
                  <option value="MOTO">MOTO</option>
                </select>
              </div>
              <div>
                <label class="label-eyebrow mb-1.5 block">Modelo (opcional)</label>
                <input formControlName="modelo" type="text" class="glass-input" />
              </div>
              <div>
                <label class="label-eyebrow mb-1.5 block">ID de cliente (opcional, para membresias)</label>
                <input formControlName="clienteId" type="number" class="glass-input" />
              </div>
              <button type="submit" [disabled]="formIngreso.invalid || procesando()" class="btn-primary w-full !py-2.5">
                {{ procesando() ? 'Procesando...' : 'Registrar ingreso' }}
              </button>
            </form>
          </app-glass-card>

          <app-glass-card padding="lg" [hoverable]="false">
            @if (ultimoIngreso(); as s) {
              <div class="flex flex-col items-center text-center">
                <p class="label-eyebrow mb-2">Ticket generado</p>
                <div class="mb-2 h-40 w-full max-w-[220px]">
                  <app-vehicle-preview [tipo]="s.tipoVehiculo" [seed]="s.codigoQr" />
                </div>
                <img [src]="s.qrImageBase64" alt="QR" class="mb-3 h-28 w-28 rounded-lg border border-white/10 bg-white p-1" />
                <p class="text-sm text-slate-300">Placa: <b class="text-white">{{ s.placa }}</b></p>
                <p class="text-sm text-slate-300">Plaza asignada: <b class="text-white">{{ s.plazaCodigo }}</b></p>
                <p class="text-sm text-slate-300">Hora de entrada: {{ s.horaEntrada | date: 'short' }}</p>
                <p class="mt-2 flex items-center gap-1 text-[11px] text-slate-600">
                  <svg lucideHash [size]="11"></svg>{{ s.codigoQr }}
                </p>
                <button (click)="imprimirTicket(s)" class="btn-ghost mt-4">
                  <svg lucidePrinter [size]="15"></svg>
                  Imprimir ticket
                </button>
              </div>
            } @else {
              <div class="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                <p class="text-sm text-slate-500">El ticket con codigo QR aparecera aqui despues de registrar el ingreso.</p>
              </div>
            }
          </app-glass-card>
        </div>
      }

      <!-- SALIDA -->
      @if (tab() === 'salida') {
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <app-glass-card padding="lg">
            <p class="label-eyebrow mb-4">Buscar sesion activa</p>
            <div class="mb-4 flex gap-2">
              <input [(ngModel)]="placaBusqueda" [ngModelOptions]="{standalone: true}" type="text"
                     placeholder="Placa (ej. ABC-123)" class="glass-input flex-1 uppercase" />
              <button (click)="buscarPorPlaca()" class="btn-primary !px-4">
                <svg lucideSearch [size]="15"></svg>
              </button>
            </div>
            <button (click)="alternarScanner()" class="btn-ghost mb-4 w-full">
              @if (escaneando()) {
                <svg lucideX [size]="15"></svg> Cerrar camara
              } @else {
                <svg lucideScanLine [size]="15"></svg> Escanear QR del ticket
              }
            </button>
            @if (escaneando()) {
              <div id="qr-reader" class="mb-4 overflow-hidden rounded-xl border border-white/10"></div>
            }

            @if (sesionEncontrada(); as s) {
              <div class="animate-fade-in space-y-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p class="text-sm text-slate-300"><b class="text-white">Placa:</b> {{ s.placa }} ({{ s.tipoVehiculo }})</p>
                <p class="text-sm text-slate-300"><b class="text-white">Plaza:</b> {{ s.plazaCodigo }}</p>
                <p class="text-sm text-slate-300"><b class="text-white">Entrada:</b> {{ s.horaEntrada | date: 'short' }}</p>
                <p class="text-sm text-slate-300"><b class="text-white">Tiempo transcurrido:</b> {{ s.duracionMinutos }} min</p>
                <p class="text-lg font-bold text-accent-400">
                  {{ s.membresiaAplicada ? 'Membresia activa: sin cargo' : 'Monto estimado: $' + s.montoCobrado?.toFixed(2) }}
                </p>

                <div class="mt-3 border-t border-white/[0.08] pt-3">
                  <label class="label-eyebrow mb-1.5 block">Metodo de pago</label>
                  <select [(ngModel)]="metodoPago" [ngModelOptions]="{standalone: true}" class="glass-input mb-3">
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="OTRO">Otro</option>
                  </select>
                  <button (click)="confirmarSalida(s)" [disabled]="procesando()" class="btn-primary w-full !py-2.5">
                    {{ procesando() ? 'Procesando...' : 'Confirmar salida y cobrar' }}
                  </button>
                </div>
              </div>
            }
          </app-glass-card>

          <app-glass-card padding="lg">
            @if (ultimoRecibo(); as r) {
              <div class="flex flex-col items-center text-center">
                <p class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-accent-400">
                  <svg lucideCircleCheckBig [size]="17"></svg> Comprobante
                </p>
                <p class="text-sm text-slate-300">Placa: <b class="text-white">{{ r.sesion.placa }}</b></p>
                <p class="text-sm text-slate-300">Duracion: {{ r.sesion.duracionMinutos }} min</p>
                <p class="text-sm text-slate-300">Metodo de pago: {{ r.pago.metodo }}</p>
                <p class="mt-2 text-3xl font-bold text-white">\${{ r.pago.monto.toFixed(2) }}</p>
                <button (click)="imprimirRecibo(r)" class="btn-ghost mt-4">
                  <svg lucidePrinter [size]="15"></svg>
                  Imprimir comprobante
                </button>
              </div>
            } @else {
              <div class="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                <p class="text-sm text-slate-500">El comprobante de pago aparecera aqui despues de confirmar la salida.</p>
              </div>
            }
          </app-glass-card>
        </div>
      }
    </div>
  `
})
export class SessionsComponent implements OnDestroy {
  tab = signal<Tab>('ingreso');
  procesando = signal(false);
  escaneando = signal(false);

  ultimoIngreso = signal<Sesion | null>(null);
  sesionEncontrada = signal<Sesion | null>(null);
  ultimoRecibo = signal<Recibo | null>(null);

  placaBusqueda = '';
  metodoPago: MetodoPago = 'EFECTIVO';

  private html5Qrcode: any = null;
  private fb = inject(FormBuilder);

  formIngreso = this.fb.group({
    placa: ['', Validators.required],
    tipo: ['AUTO' as TipoVehiculo, Validators.required],
    modelo: [''],
    clienteId: [null as number | null]
  });

  constructor(private sesionService: SesionService, private toast: ToastService) {}

  registrarIngreso(): void {
    if (this.formIngreso.invalid) return;
    const v = this.formIngreso.getRawValue();
    this.procesando.set(true);
    this.sesionService
      .ingreso({
        placa: v.placa!.toUpperCase(),
        tipo: v.tipo!,
        modelo: v.modelo || undefined,
        clienteId: v.clienteId ?? undefined
      })
      .subscribe({
        next: (s) => {
          this.ultimoIngreso.set(s);
          this.toast.exito(`Ingreso registrado. Plaza asignada: ${s.plazaCodigo}`);
          this.formIngreso.reset({ tipo: 'AUTO', placa: '', modelo: '', clienteId: null });
          this.procesando.set(false);
        },
        error: (err) => {
          this.toast.error(err.error?.message ?? 'No se pudo registrar el ingreso');
          this.procesando.set(false);
        }
      });
  }

  buscarPorPlaca(): void {
    if (!this.placaBusqueda) return;
    this.sesionService.activaPorPlaca(this.placaBusqueda.toUpperCase()).subscribe({
      next: (s) => this.sesionEncontrada.set(s),
      error: (err) => this.toast.error(err.error?.message ?? 'No se encontro una sesion activa para esa placa')
    });
  }

  confirmarSalida(s: Sesion): void {
    this.procesando.set(true);
    this.sesionService.salida({ sesionId: s.id, metodoPago: this.metodoPago }).subscribe({
      next: (recibo) => {
        this.ultimoRecibo.set(recibo);
        this.sesionEncontrada.set(null);
        this.placaBusqueda = '';
        this.toast.exito('Salida registrada correctamente');
        this.procesando.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'No se pudo registrar la salida');
        this.procesando.set(false);
      }
    });
  }

  alternarScanner(): void {
    if (this.escaneando()) {
      this.detenerScanner();
      return;
    }
    this.escaneando.set(true);
    setTimeout(() => this.iniciarScanner(), 50);
  }

  private async iniciarScanner(): Promise<void> {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      this.html5Qrcode = new Html5Qrcode('qr-reader');
      await this.html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (decodedText: string) => {
          this.detenerScanner();
          this.sesionService.buscarPorCodigo(decodedText).subscribe({
            next: (s) => this.sesionEncontrada.set(s),
            error: () => this.toast.error('Codigo QR no reconocido')
          });
        },
        () => {}
      );
    } catch (e) {
      this.toast.error('No se pudo acceder a la camara');
      this.escaneando.set(false);
    }
  }

  private detenerScanner(): void {
    if (this.html5Qrcode) {
      this.html5Qrcode.stop().catch(() => {});
      this.html5Qrcode = null;
    }
    this.escaneando.set(false);
  }

  ngOnDestroy(): void {
    this.detenerScanner();
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
        <h3>Total: $${r.pago.monto.toFixed(2)}</h3>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    w.document.close();
  }
}
