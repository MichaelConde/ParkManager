import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SesionService } from '../../core/services/sesion.service';
import { MetodoPago, Recibo, Sesion, TipoVehiculo } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';

type Tab = 'ingreso' | 'salida';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Ingreso / Salida de vehiculos</h2>
        <p class="text-sm text-slate-500">Registra el ingreso, calcula la tarifa y cobra al salir</p>
      </div>

      <div class="flex gap-2 border-b">
        <button (click)="tab.set('ingreso')" class="px-4 py-2 text-sm font-medium border-b-2 -mb-px"
                [class.border-brand-600]="tab() === 'ingreso'" [class.text-brand-600]="tab() === 'ingreso'"
                [class.border-transparent]="tab() !== 'ingreso'" [class.text-slate-500]="tab() !== 'ingreso'">
          🚗 Ingreso
        </button>
        <button (click)="tab.set('salida')" class="px-4 py-2 text-sm font-medium border-b-2 -mb-px"
                [class.border-brand-600]="tab() === 'salida'" [class.text-brand-600]="tab() === 'salida'"
                [class.border-transparent]="tab() !== 'salida'" [class.text-slate-500]="tab() !== 'salida'">
          💵 Salida
        </button>
      </div>

      <!-- INGRESO -->
      @if (tab() === 'ingreso') {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">Registrar ingreso</h3>
            <form [formGroup]="formIngreso" (ngSubmit)="registrarIngreso()" class="space-y-4">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Placa</label>
                <input formControlName="placa" type="text"
                       class="w-full border rounded-lg px-3 py-2 text-sm uppercase" placeholder="ABC-123" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Tipo de vehiculo</label>
                <select formControlName="tipo" class="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="AUTO">AUTO</option>
                  <option value="MOTO">MOTO</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Modelo (opcional)</label>
                <input formControlName="modelo" type="text" class="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">ID de cliente (opcional, para membresias)</label>
                <input formControlName="clienteId" type="number" class="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <button type="submit" [disabled]="formIngreso.invalid || procesando()"
                      class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg">
                {{ procesando() ? 'Procesando...' : 'Registrar ingreso' }}
              </button>
            </form>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center justify-center">
            @if (ultimoIngreso(); as s) {
              <h3 class="font-semibold text-slate-800 mb-2">Ticket generado</h3>
              <img [src]="s.qrImageBase64" alt="QR" class="w-40 h-40 mb-3" />
              <p class="text-sm text-slate-600">Placa: <b>{{ s.placa }}</b></p>
              <p class="text-sm text-slate-600">Plaza asignada: <b>{{ s.plazaCodigo }}</b></p>
              <p class="text-sm text-slate-600">Hora de entrada: {{ s.horaEntrada | date: 'short' }}</p>
              <p class="text-xs text-slate-400 mt-2">Codigo: {{ s.codigoQr }}</p>
              <button (click)="imprimirTicket(s)" class="mt-4 text-sm bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900">
                🖨️ Imprimir ticket
              </button>
            } @else {
              <p class="text-sm text-slate-400">El ticket con codigo QR aparecera aqui despues de registrar el ingreso.</p>
            }
          </div>
        </div>
      }

      <!-- SALIDA -->
      @if (tab() === 'salida') {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-sm p-5">
            <h3 class="font-semibold text-slate-800 mb-4">Buscar sesion activa</h3>
            <div class="flex gap-2 mb-4">
              <input [(ngModel)]="placaBusqueda" [ngModelOptions]="{standalone: true}" type="text"
                     placeholder="Placa (ej. ABC-123)" class="flex-1 border rounded-lg px-3 py-2 text-sm uppercase" />
              <button (click)="buscarPorPlaca()" class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                Buscar
              </button>
            </div>
            <button (click)="alternarScanner()" class="w-full text-sm border border-dashed rounded-lg py-2 text-slate-600 hover:bg-slate-50 mb-4">
              {{ escaneando() ? '✕ Cerrar camara' : '📷 Escanear QR del ticket' }}
            </button>
            @if (escaneando()) {
              <div id="qr-reader" class="rounded-lg overflow-hidden border mb-4"></div>
            }

            @if (sesionEncontrada(); as s) {
              <div class="border rounded-lg p-4 space-y-1 bg-slate-50">
                <p class="text-sm"><b>Placa:</b> {{ s.placa }} ({{ s.tipoVehiculo }})</p>
                <p class="text-sm"><b>Plaza:</b> {{ s.plazaCodigo }}</p>
                <p class="text-sm"><b>Entrada:</b> {{ s.horaEntrada | date: 'short' }}</p>
                <p class="text-sm"><b>Tiempo transcurrido:</b> {{ s.duracionMinutos }} min</p>
                <p class="text-lg font-bold text-brand-700">
                  {{ s.membresiaAplicada ? 'Membresia activa: sin cargo' : 'Monto estimado: S/ ' + s.montoCobrado?.toFixed(2) }}
                </p>

                <div class="pt-3 border-t mt-3">
                  <label class="block text-xs text-slate-500 mb-1">Metodo de pago</label>
                  <select [(ngModel)]="metodoPago" [ngModelOptions]="{standalone: true}" class="w-full border rounded-lg px-3 py-2 text-sm mb-3">
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="OTRO">Otro</option>
                  </select>
                  <button (click)="confirmarSalida(s)" [disabled]="procesando()"
                          class="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg">
                    {{ procesando() ? 'Procesando...' : 'Confirmar salida y cobrar' }}
                  </button>
                </div>
              </div>
            }
          </div>

          <div class="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center justify-center">
            @if (ultimoRecibo(); as r) {
              <h3 class="font-semibold text-slate-800 mb-2">✅ Comprobante</h3>
              <p class="text-sm text-slate-600">Placa: <b>{{ r.sesion.placa }}</b></p>
              <p class="text-sm text-slate-600">Duracion: {{ r.sesion.duracionMinutos }} min</p>
              <p class="text-sm text-slate-600">Metodo de pago: {{ r.pago.metodo }}</p>
              <p class="text-2xl font-bold text-green-700 mt-2">S/ {{ r.pago.monto.toFixed(2) }}</p>
              <button (click)="imprimirRecibo(r)" class="mt-4 text-sm bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900">
                🖨️ Imprimir comprobante
              </button>
            } @else {
              <p class="text-sm text-slate-400">El comprobante de pago aparecera aqui despues de confirmar la salida.</p>
            }
          </div>
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
        <h3>Total: S/ ${r.pago.monto.toFixed(2)}</h3>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    w.document.close();
  }
}
