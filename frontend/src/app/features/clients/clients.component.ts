import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../../core/services/cliente.service';
import { VehiculoService } from '../../core/services/vehiculo.service';
import { Cliente, HistorialItem, TipoVehiculo, Vehiculo } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Clientes y vehiculos</h2>
          <p class="text-sm text-slate-500">Historial por placa, datos de contacto y vehiculos asociados</p>
        </div>
        <button (click)="nuevoCliente()" class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Nuevo cliente
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex gap-2 mb-4">
          <input [(ngModel)]="busqueda" (ngModelChange)="buscar()" type="text" placeholder="Buscar por nombre o documento..."
                 class="flex-1 border rounded-lg px-3 py-2 text-sm" />
        </div>

        @if (formVisible()) {
          <form [formGroup]="form" (ngSubmit)="guardar()" class="flex flex-wrap items-end gap-3 border rounded-lg p-4 mb-4 bg-slate-50">
            <div>
              <label class="block text-xs text-slate-500 mb-1">Nombre</label>
              <input formControlName="nombre" type="text" class="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Contacto</label>
              <input formControlName="contacto" type="text" class="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Documento</label>
              <input formControlName="documento" type="text" class="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <button type="submit" [disabled]="form.invalid || guardando()"
                    class="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              Guardar
            </button>
            <button type="button" (click)="formVisible.set(false)" class="text-sm text-slate-500 hover:underline">Cancelar</button>
          </form>
        }

        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-slate-500 border-b">
              <th class="py-2">Nombre</th>
              <th>Contacto</th>
              <th>Documento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of clientes(); track c.id) {
              <tr class="border-b last:border-0 hover:bg-slate-50 cursor-pointer" (click)="seleccionar(c)">
                <td class="py-2 font-medium">{{ c.nombre }}</td>
                <td>{{ c.contacto || '-' }}</td>
                <td>{{ c.documento || '-' }}</td>
                <td class="text-right">
                  <button (click)="editar(c); $event.stopPropagation()" class="text-brand-600 hover:underline text-xs">Editar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (clientes().length === 0) {
          <p class="text-sm text-slate-400 text-center py-6">No hay clientes registrados.</p>
        }
      </div>

      @if (seleccionado(); as c) {
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-slate-800 mb-1">{{ c.nombre }}</h3>
          <p class="text-xs text-slate-400 mb-4">ID de cliente: {{ c.id }} (usalo en el formulario de ingreso para aplicar membresias)</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-semibold text-slate-700 mb-2">Vehiculos</h4>
              <div class="space-y-2">
                @for (v of vehiculos(); track v.id) {
                  <div class="border rounded-lg px-3 py-2 text-sm flex justify-between">
                    <span><b>{{ v.placa }}</b> · {{ v.tipo }}</span>
                    <span class="text-slate-400">{{ v.modelo }}</span>
                  </div>
                }
                @if (vehiculos().length === 0) {
                  <p class="text-sm text-slate-400">Sin vehiculos registrados.</p>
                }
              </div>

              <form [formGroup]="formVehiculo" (ngSubmit)="agregarVehiculo(c)" class="flex gap-2 mt-3">
                <input formControlName="placa" placeholder="Placa" class="border rounded-lg px-2 py-1.5 text-sm w-24 uppercase" />
                <select formControlName="tipo" class="border rounded-lg px-2 py-1.5 text-sm">
                  <option value="AUTO">AUTO</option>
                  <option value="MOTO">MOTO</option>
                </select>
                <input formControlName="modelo" placeholder="Modelo" class="border rounded-lg px-2 py-1.5 text-sm flex-1" />
                <button type="submit" [disabled]="formVehiculo.invalid || guardandoVehiculo()" class="text-sm bg-slate-800 text-white px-3 rounded-lg disabled:opacity-50">+</button>
              </form>
            </div>

            <div>
              <h4 class="text-sm font-semibold text-slate-700 mb-2">Historial de visitas</h4>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                @for (h of historial(); track h.sesionId) {
                  <div class="border rounded-lg px-3 py-2 text-xs">
                    <div class="flex justify-between">
                      <span class="font-semibold">{{ h.placa }}</span>
                      <span>{{ h.montoCobrado != null ? 'S/ ' + h.montoCobrado.toFixed(2) : 'En curso' }}</span>
                    </div>
                    <p class="text-slate-400">{{ h.horaEntrada | date: 'short' }} — {{ h.horaSalida ? (h.horaSalida | date: 'short') : 'activa' }}</p>
                  </div>
                }
                @if (historial().length === 0) {
                  <p class="text-sm text-slate-400">Sin visitas registradas aun.</p>
                }
              </div>
            </div>
          </div>
        </div>
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
