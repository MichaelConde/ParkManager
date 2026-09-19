import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePlus, LucideTicket } from '@lucide/angular';
import { MembresiaService } from '../../core/services/membresia.service';
import { AuthService } from '../../core/services/auth.service';
import { Membresia, PlanMembresia } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';
import { GlassCardComponent } from '../../shared/ui/glass-card.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { GsapRevealDirective } from '../../shared/animations/gsap-reveal.directive';
import { membresiaTone } from '../../shared/ui/status.util';

@Component({
  selector: 'app-memberships',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GlassCardComponent,
    StatusBadgeComponent,
    GsapRevealDirective,
    LucidePlus,
    LucideTicket
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-white">Membresias</h2>
        <p class="text-sm text-slate-500">Planes de suscripcion, asignacion y vigencias</p>
      </div>

      @if (auth.esAdmin()) {
        <app-glass-card padding="lg">
          <div class="mb-4 flex items-center justify-between">
            <p class="label-eyebrow">Planes disponibles</p>
            <button (click)="nuevoPlan()" class="btn-primary !px-4 !py-2 text-xs">
              <svg lucidePlus [size]="14"></svg> Nuevo plan
            </button>
          </div>

          @if (formPlanVisible()) {
            <form [formGroup]="formPlan" (ngSubmit)="guardarPlan()" class="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div>
                <label class="label-eyebrow mb-1.5 block">Nombre</label>
                <input formControlName="nombre" class="glass-input" />
              </div>
              <div>
                <label class="label-eyebrow mb-1.5 block">Duracion (dias)</label>
                <input formControlName="duracionDias" type="number" min="1" class="glass-input w-28" />
              </div>
              <div>
                <label class="label-eyebrow mb-1.5 block">Precio (S/)</label>
                <input formControlName="precio" type="number" step="0.10" min="0.10" class="glass-input w-28" />
              </div>
              <div class="min-w-[160px] flex-1">
                <label class="label-eyebrow mb-1.5 block">Descripcion</label>
                <input formControlName="descripcion" class="glass-input w-full" />
              </div>
              <button type="submit" [disabled]="formPlan.invalid || guardandoPlan()" class="btn-primary">Guardar</button>
              <button type="button" (click)="formPlanVisible.set(false)" class="btn-ghost">Cancelar</button>
            </form>
          }

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            @for (p of planes(); track p.id; let i = $index) {
              <div gsapReveal [gsapIndex]="i" class="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4" [class.opacity-40]="!p.activo">
                <div class="mb-1 flex items-center gap-1.5 text-accent-400">
                  <svg lucideTicket [size]="14"></svg>
                  <p class="font-semibold text-white">{{ p.nombre }}</p>
                </div>
                <p class="mb-2 text-xs text-slate-500">{{ p.descripcion }}</p>
                <p class="text-lg font-bold text-white">S/ {{ p.precio.toFixed(2) }}</p>
                <p class="text-xs text-slate-500">{{ p.duracionDias }} dias</p>
                @if (p.activo) {
                  <button (click)="desactivarPlan(p)" class="mt-2 text-xs font-medium text-red-400 hover:text-red-300">Desactivar</button>
                }
              </div>
            }
          </div>
        </app-glass-card>
      }

      <app-glass-card padding="lg">
        <p class="label-eyebrow mb-4">Asignar membresia a un cliente</p>
        <form [formGroup]="formAsignar" (ngSubmit)="asignar()" class="flex flex-wrap items-end gap-3">
          <div>
            <label class="label-eyebrow mb-1.5 block">ID de cliente</label>
            <input formControlName="clienteId" type="number" class="glass-input w-32" />
          </div>
          <div>
            <label class="label-eyebrow mb-1.5 block">Plan</label>
            <select formControlName="planId" class="glass-input">
              @for (p of planesActivos(); track p.id) {
                <option [value]="p.id">{{ p.nombre }} (S/ {{ p.precio.toFixed(2) }})</option>
              }
            </select>
          </div>
          <div>
            <label class="label-eyebrow mb-1.5 block">Fecha de inicio</label>
            <input formControlName="fechaInicio" type="date" class="glass-input" />
          </div>
          <button type="submit" [disabled]="formAsignar.invalid || asignando()" class="btn-primary">
            Asignar
          </button>
        </form>
      </app-glass-card>

      <app-glass-card padding="lg">
        <p class="label-eyebrow mb-4">Membresias registradas</p>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/[0.08] text-left text-xs uppercase tracking-wide text-slate-500">
              <th class="py-2 font-medium">Cliente</th>
              <th class="font-medium">Plan</th>
              <th class="font-medium">Inicio</th>
              <th class="font-medium">Fin</th>
              <th class="font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (m of membresias(); track m.id; let i = $index) {
              <tr gsapReveal [gsapIndex]="i" class="table-row-glass">
                <td class="py-2.5 font-semibold text-white">{{ m.clienteNombre }}</td>
                <td class="text-slate-400">{{ m.planNombre }}</td>
                <td class="text-slate-400">{{ m.fechaInicio }}</td>
                <td class="text-slate-400">{{ m.fechaFin }}</td>
                <td>
                  <app-status-badge [label]="esVigente(m) ? 'Vigente' : 'Vencida'" [tone]="tone(esVigente(m))" />
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (membresias().length === 0) {
          <p class="py-8 text-center text-sm text-slate-500">No hay membresias asignadas todavia.</p>
        }
      </app-glass-card>
    </div>
  `
})
export class MembershipsComponent implements OnInit {
  planes = signal<PlanMembresia[]>([]);
  membresias = signal<Membresia[]>([]);
  formPlanVisible = signal(false);
  guardandoPlan = signal(false);
  asignando = signal(false);

  tone = membresiaTone;

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
