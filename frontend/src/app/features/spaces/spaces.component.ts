import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlazaService } from '../../core/services/plaza.service';
import { TarifaService } from '../../core/services/tarifa.service';
import { EstadoPlaza, Plaza, Tarifa, TipoVehiculo } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-spaces',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Plazas y tarifas</h2>
        <p class="text-sm text-slate-500">Configuracion dinamica de espacios y precios por hora</p>
      </div>

      <!-- Tarifas -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="font-semibold text-slate-800 mb-4">Tarifas vigentes</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          @for (t of tarifas(); track t.id) {
            <div class="border rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">{{ t.tipoVehiculo }}</p>
                <p class="text-xl font-bold text-slate-800">S/ {{ t.precioHora.toFixed(2) }} / hora</p>
              </div>
              <button (click)="editarTarifa(t)" class="text-sm text-brand-600 hover:underline">Editar</button>
            </div>
          }
        </div>

        @if (formTarifaVisible()) {
          <form [formGroup]="formTarifa" (ngSubmit)="guardarTarifa()" class="flex flex-wrap items-end gap-3 border-t pt-4">
            <div>
              <label class="block text-xs text-slate-500 mb-1">Tipo</label>
              <select formControlName="tipoVehiculo" class="border rounded-lg px-3 py-2 text-sm">
                <option value="AUTO">AUTO</option>
                <option value="MOTO">MOTO</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Precio por hora (S/)</label>
              <input formControlName="precioHora" type="number" step="0.10" min="0.10"
                     class="border rounded-lg px-3 py-2 text-sm w-32" />
            </div>
            <button type="submit" [disabled]="formTarifa.invalid || guardandoTarifa()"
                    class="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              Guardar
            </button>
            <button type="button" (click)="formTarifaVisible.set(false)" class="text-sm text-slate-500 hover:underline">Cancelar</button>
          </form>
        } @else {
          <button (click)="nuevaTarifa()" class="text-sm text-brand-600 hover:underline">+ Actualizar tarifa</button>
        }
      </div>

      <!-- Plazas -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-slate-800">Plazas de estacionamiento ({{ plazas().length }})</h3>
          <button (click)="nuevaPlaza()" class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Nueva plaza
          </button>
        </div>

        @if (formPlazaVisible()) {
          <form [formGroup]="formPlaza" (ngSubmit)="guardarPlaza()" class="flex flex-wrap items-end gap-3 border rounded-lg p-4 mb-4 bg-slate-50">
            <div>
              <label class="block text-xs text-slate-500 mb-1">Codigo</label>
              <input formControlName="codigo" type="text" class="border rounded-lg px-3 py-2 text-sm w-28" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Tipo</label>
              <select formControlName="tipo" class="border rounded-lg px-3 py-2 text-sm">
                <option value="AUTO">AUTO</option>
                <option value="MOTO">MOTO</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Zona</label>
              <input formControlName="zona" type="text" class="border rounded-lg px-3 py-2 text-sm w-32" />
            </div>
            @if (editandoPlazaId() !== null) {
              <div>
                <label class="block text-xs text-slate-500 mb-1">Estado</label>
                <select formControlName="estado" class="border rounded-lg px-3 py-2 text-sm">
                  <option value="LIBRE">LIBRE</option>
                  <option value="OCUPADA">OCUPADA</option>
                </select>
              </div>
            }
            <button type="submit" [disabled]="formPlaza.invalid || guardandoPlaza()"
                    class="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              Guardar
            </button>
            <button type="button" (click)="formPlazaVisible.set(false)" class="text-sm text-slate-500 hover:underline">Cancelar</button>
          </form>
        }

        <div class="flex gap-2 mb-3">
          <select [(ngModel)]="filtroTipo" (ngModelChange)="cargarPlazas()" class="border rounded-lg px-3 py-1.5 text-sm">
            <option [ngValue]="undefined">Todos los tipos</option>
            <option value="AUTO">AUTO</option>
            <option value="MOTO">MOTO</option>
          </select>
          <select [(ngModel)]="filtroEstado" (ngModelChange)="cargarPlazas()" class="border rounded-lg px-3 py-1.5 text-sm">
            <option [ngValue]="undefined">Todos los estados</option>
            <option value="LIBRE">LIBRE</option>
            <option value="OCUPADA">OCUPADA</option>
          </select>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-slate-500 border-b">
              <th class="py-2">Codigo</th>
              <th>Tipo</th>
              <th>Zona</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of plazas(); track p.id) {
              <tr class="border-b last:border-0 hover:bg-slate-50">
                <td class="py-2 font-medium">{{ p.codigo }}</td>
                <td>{{ p.tipo }}</td>
                <td>{{ p.zona || '-' }}</td>
                <td>
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [class.bg-green-100]="p.estado === 'LIBRE'" [class.text-green-700]="p.estado === 'LIBRE'"
                        [class.bg-red-100]="p.estado === 'OCUPADA'" [class.text-red-700]="p.estado === 'OCUPADA'">
                    {{ p.estado }}
                  </span>
                </td>
                <td class="text-right space-x-3">
                  <button (click)="editarPlaza(p)" class="text-brand-600 hover:underline">Editar</button>
                  <button (click)="eliminarPlaza(p)" [disabled]="p.estado === 'OCUPADA'"
                          class="text-red-600 hover:underline disabled:opacity-30 disabled:cursor-not-allowed">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (plazas().length === 0) {
          <p class="text-sm text-slate-400 text-center py-6">No hay plazas registradas.</p>
        }
      </div>
    </div>
  `
})
export class SpacesComponent implements OnInit {
  plazas = signal<Plaza[]>([]);
  tarifas = signal<Tarifa[]>([]);

  filtroTipo?: TipoVehiculo;
  filtroEstado?: EstadoPlaza;

  formPlazaVisible = signal(false);
  editandoPlazaId = signal<number | null>(null);
  formTarifaVisible = signal(false);
  guardandoPlaza = signal(false);
  guardandoTarifa = signal(false);

  private fb = inject(FormBuilder);

  formPlaza = this.fb.group({
    codigo: ['', Validators.required],
    tipo: ['AUTO' as TipoVehiculo, Validators.required],
    zona: [''],
    estado: ['LIBRE' as EstadoPlaza]
  });

  formTarifa = this.fb.group({
    tipoVehiculo: ['AUTO' as TipoVehiculo, Validators.required],
    precioHora: [0, [Validators.required, Validators.min(0.1)]]
  });

  constructor(
    private plazaService: PlazaService,
    private tarifaService: TarifaService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarPlazas();
    this.cargarTarifas();
  }

  cargarPlazas(): void {
    this.plazaService.listar(this.filtroTipo, this.filtroEstado).subscribe((p) => this.plazas.set(p));
  }

  cargarTarifas(): void {
    this.tarifaService.listarVigentes().subscribe((t) => this.tarifas.set(t));
  }

  nuevaPlaza(): void {
    this.editandoPlazaId.set(null);
    this.formPlaza.reset({ tipo: 'AUTO', estado: 'LIBRE', codigo: '', zona: '' });
    this.formPlazaVisible.set(true);
  }

  editarPlaza(p: Plaza): void {
    this.editandoPlazaId.set(p.id);
    this.formPlaza.reset({ codigo: p.codigo, tipo: p.tipo, zona: p.zona ?? '', estado: p.estado });
    this.formPlazaVisible.set(true);
  }

  guardarPlaza(): void {
    if (this.formPlaza.invalid || this.guardandoPlaza()) return;
    this.guardandoPlaza.set(true);
    const valor = this.formPlaza.getRawValue();
    const id = this.editandoPlazaId();

    const obs = id
      ? this.plazaService.actualizar(id, { tipo: valor.tipo!, zona: valor.zona || undefined, estado: valor.estado! })
      : this.plazaService.crear({ codigo: valor.codigo!, tipo: valor.tipo!, zona: valor.zona || undefined });

    obs.subscribe({
      next: () => {
        this.toast.exito(id ? 'Plaza actualizada' : 'Plaza creada');
        this.formPlazaVisible.set(false);
        this.guardandoPlaza.set(false);
        this.cargarPlazas();
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'No se pudo guardar la plaza');
        this.guardandoPlaza.set(false);
      }
    });
  }

  eliminarPlaza(p: Plaza): void {
    if (p.estado === 'OCUPADA') return;
    if (!confirm(`Eliminar la plaza ${p.codigo}?`)) return;
    this.plazaService.eliminar(p.id).subscribe({
      next: () => {
        this.toast.exito('Plaza eliminada');
        this.cargarPlazas();
      },
      error: (err) => this.toast.error(err.error?.message ?? 'No se pudo eliminar la plaza')
    });
  }

  nuevaTarifa(): void {
    this.formTarifa.reset({ tipoVehiculo: 'AUTO', precioHora: 0 });
    this.formTarifaVisible.set(true);
  }

  editarTarifa(t: Tarifa): void {
    this.formTarifa.reset({ tipoVehiculo: t.tipoVehiculo, precioHora: t.precioHora });
    this.formTarifaVisible.set(true);
  }

  guardarTarifa(): void {
    if (this.formTarifa.invalid || this.guardandoTarifa()) return;
    this.guardandoTarifa.set(true);
    const valor = this.formTarifa.getRawValue();
    this.tarifaService.actualizar({ tipoVehiculo: valor.tipoVehiculo!, precioHora: valor.precioHora! }).subscribe({
      next: () => {
        this.toast.exito('Tarifa actualizada. Las sesiones activas conservan su tarifa original.');
        this.formTarifaVisible.set(false);
        this.guardandoTarifa.set(false);
        this.cargarTarifas();
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'No se pudo actualizar la tarifa');
        this.guardandoTarifa.set(false);
      }
    });
  }
}
