import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideIdCard, LucidePencil, LucidePlus, LucideSearch } from '@lucide/angular';
import { ClienteService } from '../../core/services/cliente.service';
import { VehiculoService } from '../../core/services/vehiculo.service';
import { Cliente, HistorialItem, TipoVehiculo, Vehiculo } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';
import { GlassCardComponent } from '../../shared/ui/glass-card.component';
import { GsapRevealDirective } from '../../shared/animations/gsap-reveal.directive';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    GlassCardComponent,
    GsapRevealDirective,
    LucidePlus,
    LucidePencil,
    LucideSearch,
    LucideIdCard
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Clientes y vehiculos</h2>
          <p class="text-sm text-slate-500">Historial por placa, datos de contacto y vehiculos asociados</p>
        </div>
        <button (click)="nuevoCliente()" class="btn-primary !px-4 !py-2 text-xs">
          <svg lucidePlus [size]="14"></svg> Nuevo cliente
        </button>
      </div>

      <app-glass-card padding="lg">
        <div class="relative mb-4">
          <svg lucideSearch [size]="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"></svg>
          <input [(ngModel)]="busqueda" (ngModelChange)="buscar()" type="text" placeholder="Buscar por nombre o documento..."
                 class="glass-input !pl-10" />
        </div>

        @if (formVisible()) {
          <form [formGroup]="form" (ngSubmit)="guardar()" class="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div>
              <label class="label-eyebrow mb-1.5 block">Nombre</label>
              <input formControlName="nombre" type="text" class="glass-input" />
            </div>
            <div>
              <label class="label-eyebrow mb-1.5 block">Contacto</label>
              <input formControlName="contacto" type="text" class="glass-input" />
            </div>
            <div>
              <label class="label-eyebrow mb-1.5 block">Documento</label>
              <input formControlName="documento" type="text" class="glass-input" />
            </div>
            <button type="submit" [disabled]="form.invalid || guardando()" class="btn-primary">Guardar</button>
            <button type="button" (click)="formVisible.set(false)" class="btn-ghost">Cancelar</button>
          </form>
        }

        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/[0.08] text-left text-xs uppercase tracking-wide text-slate-500">
              <th class="py-2 font-medium">Nombre</th>
              <th class="font-medium">Contacto</th>
              <th class="font-medium">Documento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of clientes(); track c.id; let i = $index) {
              <tr gsapReveal [gsapIndex]="i" class="table-row-glass cursor-pointer" (click)="seleccionar(c)">
                <td class="py-2.5 font-semibold text-white">{{ c.nombre }}</td>
                <td class="text-slate-400">{{ c.contacto || '-' }}</td>
                <td class="text-slate-400">{{ c.documento || '-' }}</td>
                <td class="text-right">
                  <button (click)="editar(c); $event.stopPropagation()" class="btn-icon !h-8 !w-8">
                    <svg lucidePencil [size]="13"></svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (clientes().length === 0) {
          <p class="py-8 text-center text-sm text-slate-500">No hay clientes registrados.</p>
        }
      </app-glass-card>

      @if (seleccionado(); as c) {
        <app-glass-card padding="lg" [glow]="true">
          <h3 class="text-lg font-bold text-white">{{ c.nombre }}</h3>
          <p class="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
            <svg lucideIdCard [size]="13"></svg>
            ID de cliente: {{ c.id }} (usalo en el formulario de ingreso para aplicar membresias)
          </p>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p class="label-eyebrow mb-2">Vehiculos</p>
              <div class="space-y-2">
                @for (v of vehiculos(); track v.id) {
                  <div class="flex justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-sm">
                    <span class="text-slate-200"><b class="text-white">{{ v.placa }}</b> &middot; {{ v.tipo }}</span>
                    <span class="text-slate-500">{{ v.modelo }}</span>
                  </div>
                }
                @if (vehiculos().length === 0) {
                  <p class="text-sm text-slate-500">Sin vehiculos registrados.</p>
                }
              </div>

              <form [formGroup]="formVehiculo" (ngSubmit)="agregarVehiculo(c)" class="mt-3 flex gap-2">
                <input formControlName="placa" placeholder="Placa" class="glass-input w-24 uppercase" />
                <select formControlName="tipo" class="glass-input w-24">
                  <option value="AUTO">AUTO</option>
                  <option value="MOTO">MOTO</option>
                </select>
                <input formControlName="modelo" placeholder="Modelo" class="glass-input flex-1" />
                <button type="submit" [disabled]="formVehiculo.invalid || guardandoVehiculo()" class="btn-primary !px-3.5">
                  <svg lucidePlus [size]="15"></svg>
                </button>
              </form>
            </div>

            <div>
              <p class="label-eyebrow mb-2">Historial de visitas</p>
              <div class="max-h-64 space-y-2 overflow-y-auto">
                @for (h of historial(); track h.sesionId) {
                  <div class="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-xs">
                    <div class="flex justify-between">
                      <span class="font-semibold text-white">{{ h.placa }}</span>
                      <span class="text-slate-300">{{ h.montoCobrado != null ? 'S/ ' + h.montoCobrado.toFixed(2) : 'En curso' }}</span>
                    </div>
                    <p class="mt-0.5 text-slate-500">{{ h.horaEntrada | date: 'short' }} &mdash; {{ h.horaSalida ? (h.horaSalida | date: 'short') : 'activa' }}</p>
                  </div>
                }
                @if (historial().length === 0) {
                  <p class="text-sm text-slate-500">Sin visitas registradas aun.</p>
                }
              </div>
            </div>
          </div>
        </app-glass-card>
      }
    </div>
  `
})
export class ClientsComponent implements OnInit {
  clientes = signal<Cliente[]>([]);
  seleccionado = signal<Cliente | null>(null);
  vehiculos = signal<Vehiculo[]>([]);
  historial = signal<HistorialItem[]>([]);
  formVisible = signal(false);
  guardando = signal(false);
  guardandoVehiculo = signal(false);
  editandoId: number | null = null;
  busqueda = '';

  private fb = inject(FormBuilder);

  form = this.fb.group({
    nombre: ['', Validators.required],
    contacto: [''],
    documento: ['']
  });

  formVehiculo = this.fb.group({
    placa: ['', Validators.required],
    tipo: ['AUTO' as TipoVehiculo, Validators.required],
    modelo: ['']
  });

  constructor(
    private clienteService: ClienteService,
    private vehiculoService: VehiculoService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.clienteService.listar(this.busqueda || undefined).subscribe((c) => this.clientes.set(c));
  }

  nuevoCliente(): void {
    this.editandoId = null;
    this.form.reset({ nombre: '', contacto: '', documento: '' });
    this.formVisible.set(true);
  }

  editar(c: Cliente): void {
    this.editandoId = c.id;
    this.form.reset({ nombre: c.nombre, contacto: c.contacto ?? '', documento: c.documento ?? '' });
    this.formVisible.set(true);
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    const valor = this.form.getRawValue() as { nombre: string; contacto?: string; documento?: string };
    const obs = this.editandoId
      ? this.clienteService.actualizar(this.editandoId, valor)
      : this.clienteService.crear(valor);

    obs.subscribe({
      next: () => {
        this.toast.exito('Cliente guardado');
        this.formVisible.set(false);
        this.guardando.set(false);
        this.buscar();
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'No se pudo guardar el cliente');
        this.guardando.set(false);
      }
    });
  }

  seleccionar(c: Cliente): void {
    this.seleccionado.set(c);
    this.clienteService.vehiculos(c.id).subscribe((v) => this.vehiculos.set(v));
    this.clienteService.historial(c.id).subscribe((h) => this.historial.set(h.content));
    this.formVehiculo.reset({ tipo: 'AUTO', placa: '', modelo: '' });
  }

  agregarVehiculo(c: Cliente): void {
    if (this.formVehiculo.invalid || this.guardandoVehiculo()) return;
    this.guardandoVehiculo.set(true);
    const v = this.formVehiculo.getRawValue();
    this.vehiculoService
      .crear({ placa: v.placa!.toUpperCase(), tipo: v.tipo!, modelo: v.modelo || undefined, clienteId: c.id })
      .subscribe({
        next: () => {
          this.toast.exito('Vehiculo agregado');
          this.guardandoVehiculo.set(false);
          this.seleccionar(c);
        },
        error: (err) => {
          this.toast.error(err.error?.message ?? 'No se pudo agregar el vehiculo');
          this.guardandoVehiculo.set(false);
        }
      });
  }
}
