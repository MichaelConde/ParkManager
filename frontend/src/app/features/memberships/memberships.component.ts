import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MembresiaService } from '../../core/services/membresia.service';
import { AuthService } from '../../core/services/auth.service';
import { Membresia, PlanMembresia } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-memberships',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Membresias</h2>
        <p class="text-sm text-slate-500">Planes de suscripcion, asignacion y vigencias</p>
      </div>

      @if (auth.esAdmin()) {
        <div class="bg-white rounded-xl shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-slate-800">Planes disponibles</h3>
            <button (click)="nuevoPlan()" class="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg">+ Nuevo plan</button>
          </div>

          @if (formPlanVisible()) {
            <form [formGroup]="formPlan" (ngSubmit)="guardarPlan()" class="flex flex-wrap items-end gap-3 border rounded-lg p-4 mb-4 bg-slate-50">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Nombre</label>
                <input formControlName="nombre" class="border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Duracion (dias)</label>
                <input formControlName="duracionDias" type="number" min="1" class="border rounded-lg px-3 py-2 text-sm w-28" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Precio (S/)</label>
                <input formControlName="precio" type="number" step="0.10" min="0.10" class="border rounded-lg px-3 py-2 text-sm w-28" />
              </div>
              <div class="flex-1 min-w-[160px]">
                <label class="block text-xs text-slate-500 mb-1">Descripcion</label>
                <input formControlName="descripcion" class="border rounded-lg px-3 py-2 text-sm w-full" />
              </div>
              <button type="submit" [disabled]="formPlan.invalid || guardandoPlan()" class="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">Guardar</button>
              <button type="button" (click)="formPlanVisible.set(false)" class="text-sm text-slate-500 hover:underline">Cancelar</button>
            </form>
          }

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            @for (p of planes(); track p.id) {
              <div class="border rounded-lg p-4" [class.opacity-50]="!p.activo">
                <p class="font-semibold text-slate-800">{{ p.nombre }}</p>
                <p class="text-xs text-slate-500 mb-2">{{ p.descripcion }}</p>
                <p class="text-lg font-bold text-brand-700">S/ {{ p.precio.toFixed(2) }}</p>
                <p class="text-xs text-slate-400">{{ p.duracionDias }} dias</p>
                @if (p.activo) {
                  <button (click)="desactivarPlan(p)" class="text-xs text-red-600 hover:underline mt-2">Desactivar</button>
                }
              </div>
            }
          </div>
        </div>
      }

      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="font-semibold text-slate-800 mb-4">Asignar membresia a un cliente</h3>
        <form [formGroup]="formAsignar" (ngSubmit)="asignar()" class="flex flex-wrap items-end gap-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">ID de cliente</label>
            <input formControlName="clienteId" type="number" class="border rounded-lg px-3 py-2 text-sm w-32" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Plan</label>
            <select formControlName="planId" class="border rounded-lg px-3 py-2 text-sm">
              @for (p of planesActivos(); track p.id) {
                <option [value]="p.id">{{ p.nombre }} (S/ {{ p.precio.toFixed(2) }})</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Fecha de inicio</label>
            <input formControlName="fechaInicio" type="date" class="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" [disabled]="formAsignar.invalid || asignando()" class="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
            Asignar
          </button>
        </form>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="font-semibold text-slate-800 mb-4">Membresias registradas</h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-slate-500 border-b">
              <th class="py-2">Cliente</th>
              <th>Plan</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (m of membresias(); track m.id) {
              <tr class="border-b last:border-0">
                <td class="py-2">{{ m.clienteNombre }}</td>
                <td>{{ m.planNombre }}</td>
                <td>{{ m.fechaInicio }}</td>
                <td>{{ m.fechaFin }}</td>
                <td>
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [class.bg-green-100]="esVigente(m)" [class.text-green-700]="esVigente(m)"
                        [class.bg-gray-100]="!esVigente(m)" [class.text-gray-500]="!esVigente(m)">
                    {{ esVigente(m) ? 'Vigente' : 'Vencida' }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (membresias().length === 0) {
          <p class="text-sm text-slate-400 text-center py-6">No hay membresias asignadas todavia.</p>
        }
      </div>
    </div>
  `
})
export class MembershipsComponent implements OnInit {
  planes = signal<PlanMembresia[]>([]);
  membresias = signal<Membresia[]>([]);
  formPlanVisible = signal(false);
  guardandoPlan = signal(false);
  asignando = signal(false);

  private fb = inject(FormBuilder);

  formPlan = this.fb.group({
    nombre: ['', Validators.required],
    duracionDias: [30, [Validators.required, Validators.min(1)]],
    precio: [0, [Validators.required, Validators.min(0.1)]],
    descripcion: ['']
  });

  formAsignar = this.fb.group({
    clienteId: [null as number | null, Validators.required],
    planId: [null as number | null, Validators.required],
    fechaInicio: [new Date().toISOString().substring(0, 10)]
  });

  constructor(
    private membresiaService: MembresiaService,
    public auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarPlanes();
    this.cargarMembresias();
  }

  planesActivos() {
    return this.planes().filter((p) => p.activo);
  }

  esVigente(m: Membresia): boolean {
    const hoy = new Date().toISOString().substring(0, 10);
    return m.activa && m.fechaFin >= hoy;
  }

  cargarPlanes(): void {
    this.membresiaService.listarPlanes().subscribe((p) => {
      this.planes.set(p);
      const activos = p.filter((plan) => plan.activo);
      if (!this.formAsignar.controls.planId.value && activos.length > 0) {
        this.formAsignar.patchValue({ planId: activos[0].id });
      }
    });
  }

  cargarMembresias(): void {
    this.membresiaService.listar().subscribe((m) => this.membresias.set(m));
  }

  nuevoPlan(): void {
    this.formPlan.reset({ nombre: '', duracionDias: 30, precio: 0, descripcion: '' });
    this.formPlanVisible.set(true);
  }

  guardarPlan(): void {
    if (this.formPlan.invalid || this.guardandoPlan()) return;
    this.guardandoPlan.set(true);
    const v = this.formPlan.getRawValue();
    this.membresiaService
      .crearPlan({ nombre: v.nombre!, duracionDias: v.duracionDias!, precio: v.precio!, descripcion: v.descripcion || undefined })
      .subscribe({
        next: () => {
          this.toast.exito('Plan creado');
          this.formPlanVisible.set(false);
          this.guardandoPlan.set(false);
          this.cargarPlanes();
        },
        error: (err) => {
          this.toast.error(err.error?.message ?? 'No se pudo crear el plan');
          this.guardandoPlan.set(false);
        }
      });
  }

  desactivarPlan(p: PlanMembresia): void {
    if (!confirm(`Desactivar el plan ${p.nombre}?`)) return;
    this.membresiaService.desactivarPlan(p.id).subscribe(() => {
      this.toast.exito('Plan desactivado');
      this.cargarPlanes();
    });
  }

  asignar(): void {
    if (this.formAsignar.invalid || this.asignando()) return;
    this.asignando.set(true);
    const v = this.formAsignar.getRawValue();
    this.membresiaService
      .asignar({ clienteId: v.clienteId!, planId: v.planId!, fechaInicio: v.fechaInicio || undefined })
      .subscribe({
        next: () => {
          this.toast.exito('Membresia asignada');
          this.asignando.set(false);
          this.cargarMembresias();
        },
        error: (err) => {
          this.toast.error(err.error?.message ?? 'No se pudo asignar la membresia');
          this.asignando.set(false);
        }
      });
  }
}
