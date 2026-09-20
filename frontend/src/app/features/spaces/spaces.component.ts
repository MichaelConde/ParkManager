import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideLayers, LucidePencil, LucidePlus, LucideTrash } from '@lucide/angular';
import { PlazaService } from '../../core/services/plaza.service';
import { TarifaService } from '../../core/services/tarifa.service';
import { EstadoPlaza, Plaza, Tarifa, TipoVehiculo } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';
import { GlassCardComponent } from '../../shared/ui/glass-card.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { GsapRevealDirective } from '../../shared/animations/gsap-reveal.directive';
import { plazaTone } from '../../shared/ui/status.util';

interface ZonaResumen {
  zona: string;
  tipo: TipoVehiculo;
  total: number;
  libres: number;
  ocupadas: number;
}

@Component({
  selector: 'app-spaces',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    GlassCardComponent,
    StatusBadgeComponent,
    GsapRevealDirective,
    LucidePlus,
    LucidePencil,
    LucideTrash,
    LucideLayers
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-white">Plazas y tarifas</h2>
        <p class="text-sm text-slate-500">Configuracion dinamica de espacios y precios por hora</p>
      </div>

      <!-- Tarifas -->
      <app-glass-card padding="lg">
        <p class="label-eyebrow mb-4">Tarifas vigentes</p>
        <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          @for (t of tarifas(); track t.id; let i = $index) {
            <div gsapReveal [gsapIndex]="i" class="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5">
              <div>
                <p class="text-xs text-slate-500">{{ t.tipoVehiculo }}</p>
                <p class="text-xl font-bold text-white">S/ {{ t.precioHora.toFixed(2) }} <span class="text-sm font-normal text-slate-500">/ hora</span></p>
              </div>
              <button (click)="editarTarifa(t)" class="btn-icon">
                <svg lucidePencil [size]="14"></svg>
              </button>
            </div>
          }
        </div>

        @if (formTarifaVisible()) {
          <form [formGroup]="formTarifa" (ngSubmit)="guardarTarifa()" class="flex flex-wrap items-end gap-3 border-t border-white/[0.08] pt-4">
            <div>
              <label class="label-eyebrow mb-1.5 block">Tipo</label>
              <select formControlName="tipoVehiculo" class="glass-input w-32">
                <option value="AUTO">AUTO</option>
                <option value="MOTO">MOTO</option>
              </select>
            </div>
            <div>
              <label class="label-eyebrow mb-1.5 block">Precio por hora (S/)</label>
              <input formControlName="precioHora" type="number" step="0.10" min="0.10" class="glass-input w-32" />
            </div>
            <button type="submit" [disabled]="formTarifa.invalid || guardandoTarifa()" class="btn-primary">Guardar</button>
            <button type="button" (click)="formTarifaVisible.set(false)" class="btn-ghost">Cancelar</button>
          </form>
        } @else {
          <button (click)="nuevaTarifa()" class="flex items-center gap-1.5 text-sm font-medium text-accent-400 hover:text-accent-300">
            <svg lucidePlus [size]="15"></svg> Actualizar tarifa
          </button>
        }
      </app-glass-card>

      <!-- Zonas / pisos -->
      <app-glass-card padding="lg">
        <div class="mb-4 flex items-center justify-between">
          <p class="label-eyebrow flex items-center gap-1.5">
            <svg lucideLayers [size]="14"></svg> Zonas y pisos
          </p>
          <button (click)="nuevaZona()" class="btn-primary !px-4 !py-2 text-xs">
            <svg lucidePlus [size]="14"></svg> Nueva zona / piso
          </button>
        </div>
        <p class="mb-4 -mt-2 text-xs text-slate-500">
          Una zona agrupa varias plazas individuales (por ejemplo un piso o un sector). Crea una zona nueva con
          la cantidad de plazas que necesites, o ajusta cuantas tiene una zona existente.
        </p>

        @if (formZonaVisible()) {
          <form [formGroup]="formZona" (ngSubmit)="guardarZona()" class="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div>
              <label class="label-eyebrow mb-1.5 block">Nombre de zona / piso</label>
              <input formControlName="zona" type="text" class="glass-input w-40" placeholder="Piso 2" />
            </div>
            <div>
              <label class="label-eyebrow mb-1.5 block">Tipo</label>
              <select formControlName="tipo" class="glass-input w-28">
                <option value="AUTO">AUTO</option>
                <option value="MOTO">MOTO</option>
              </select>
            </div>
            <div>
              <label class="label-eyebrow mb-1.5 block">Prefijo de codigo</label>
              <input formControlName="prefijo" type="text" class="glass-input w-24 uppercase" placeholder="C" maxlength="6" />
            </div>
            <div>
              <label class="label-eyebrow mb-1.5 block">Cantidad de plazas</label>
              <input formControlName="cantidad" type="number" min="1" max="200" class="glass-input w-28" />
            </div>
            <button type="submit" [disabled]="formZona.invalid || guardandoZona()" class="btn-primary">Crear</button>
            <button type="button" (click)="formZonaVisible.set(false)" class="btn-ghost">Cancelar</button>
          </form>
        }

        <div class="space-y-2">
          @for (z of zonas(); track z.zona + '|' + z.tipo) {
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <div>
                <p class="font-semibold text-white">{{ z.zona }} <span class="text-xs font-normal text-slate-500">({{ z.tipo }})</span></p>
                <p class="text-xs text-slate-500">{{ z.libres }} libres &middot; {{ z.ocupadas }} ocupadas &middot; {{ z.total }} en total</p>
              </div>
              <div class="flex items-center gap-2">
                <label class="label-eyebrow">Total de plazas</label>
                <input type="number" min="0" max="200"
                       [ngModel]="ajustes[claveZona(z)] ?? z.total"
                       (ngModelChange)="ajustes[claveZona(z)] = $event"
                       [ngModelOptions]="{standalone: true}"
                       class="glass-input w-20 !py-1.5" />
                <button (click)="guardarAjusteZona(z)" [disabled]="guardandoZona()" class="btn-ghost !px-3 !py-1.5 text-xs">Guardar</button>
                <button (click)="eliminarZona(z)" [disabled]="guardandoZona()" class="btn-icon !h-8 !w-8 hover:!border-red-400/25 hover:!bg-red-500/10 hover:!text-red-300 disabled:opacity-30">
                  <svg lucideTrash [size]="13"></svg>
                </button>
              </div>
            </div>
          }
          @if (zonas().length === 0) {
            <p class="py-6 text-center text-sm text-slate-500">Aun no hay zonas creadas.</p>
          }
        </div>
      </app-glass-card>

      <!-- Plazas -->
      <app-glass-card padding="lg">
        <div class="mb-4 flex items-center justify-between">
          <p class="label-eyebrow">Plazas de estacionamiento ({{ plazas().length }})</p>
          <button (click)="nuevaPlaza()" class="btn-primary !px-4 !py-2 text-xs">
            <svg lucidePlus [size]="14"></svg> Nueva plaza
          </button>
        </div>

        @if (formPlazaVisible()) {
          <form [formGroup]="formPlaza" (ngSubmit)="guardarPlaza()" class="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div>
              <label class="label-eyebrow mb-1.5 block">Codigo</label>
              <input formControlName="codigo" type="text" class="glass-input w-28" />
            </div>
            <div>
              <label class="label-eyebrow mb-1.5 block">Tipo</label>
              <select formControlName="tipo" class="glass-input w-28">
                <option value="AUTO">AUTO</option>
                <option value="MOTO">MOTO</option>
              </select>
            </div>
            <div>
              <label class="label-eyebrow mb-1.5 block">Zona</label>
              <input formControlName="zona" type="text" class="glass-input w-32" />
            </div>
            @if (editandoPlazaId() !== null) {
              <div>
                <label class="label-eyebrow mb-1.5 block">Estado</label>
                <select formControlName="estado" class="glass-input w-32">
                  <option value="LIBRE">LIBRE</option>
                  <option value="OCUPADA">OCUPADA</option>
                </select>
              </div>
            }
            <button type="submit" [disabled]="formPlaza.invalid || guardandoPlaza()" class="btn-primary">Guardar</button>
            <button type="button" (click)="formPlazaVisible.set(false)" class="btn-ghost">Cancelar</button>
          </form>
        }

        <div class="mb-3 flex gap-2">
          <select [(ngModel)]="filtroTipo" (ngModelChange)="cargarPlazas()" class="glass-input w-auto !py-1.5 text-xs">
            <option [ngValue]="undefined">Todos los tipos</option>
            <option value="AUTO">AUTO</option>
            <option value="MOTO">MOTO</option>
          </select>
          <select [(ngModel)]="filtroEstado" (ngModelChange)="cargarPlazas()" class="glass-input w-auto !py-1.5 text-xs">
            <option [ngValue]="undefined">Todos los estados</option>
            <option value="LIBRE">LIBRE</option>
            <option value="OCUPADA">OCUPADA</option>
          </select>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/[0.08] text-left text-xs uppercase tracking-wide text-slate-500">
              <th class="py-2 font-medium">Codigo</th>
              <th class="font-medium">Tipo</th>
              <th class="font-medium">Zona</th>
              <th class="font-medium">Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of plazas(); track p.id; let i = $index) {
              <tr gsapReveal [gsapIndex]="i" class="table-row-glass">
                <td class="py-2.5 font-semibold text-white">{{ p.codigo }}</td>
                <td class="text-slate-400">{{ p.tipo }}</td>
                <td class="text-slate-400">{{ p.zona || '-' }}</td>
                <td><app-status-badge [label]="p.estado" [tone]="tone(p.estado)" /></td>
                <td class="space-x-1 text-right">
                  <button (click)="editarPlaza(p)" class="btn-icon !h-8 !w-8">
                    <svg lucidePencil [size]="13"></svg>
                  </button>
                  <button (click)="eliminarPlaza(p)" [disabled]="p.estado === 'OCUPADA'" class="btn-icon !h-8 !w-8 hover:!border-red-400/25 hover:!bg-red-500/10 hover:!text-red-300 disabled:opacity-30">
                    <svg lucideTrash [size]="13"></svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (plazas().length === 0) {
          <p class="py-8 text-center text-sm text-slate-500">No hay plazas registradas.</p>
        }
      </app-glass-card>
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

  formZonaVisible = signal(false);
  guardandoZona = signal(false);
  ajustes: Record<string, number> = {};

  tone = plazaTone;

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

  formZona = this.fb.group({
    zona: ['', Validators.required],
    tipo: ['AUTO' as TipoVehiculo, Validators.required],
    prefijo: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]+$/)]],
    cantidad: [1, [Validators.required, Validators.min(1), Validators.max(200)]]
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

  zonas(): ZonaResumen[] {
    const grupos = new Map<string, ZonaResumen>();
    for (const p of this.plazas()) {
      const zona = p.zona?.trim();
      if (!zona) continue;
      const key = `${zona}|${p.tipo}`;
      const grupo = grupos.get(key) ?? { zona, tipo: p.tipo, total: 0, libres: 0, ocupadas: 0 };
      grupo.total++;
      if (p.estado === 'LIBRE') grupo.libres++;
      else grupo.ocupadas++;
      grupos.set(key, grupo);
    }
    return [...grupos.values()].sort((a, b) => a.zona.localeCompare(b.zona) || a.tipo.localeCompare(b.tipo));
  }

  claveZona(z: { zona: string; tipo: TipoVehiculo }): string {
    return `${z.zona}|${z.tipo}`;
  }

  nuevaZona(): void {
    this.formZona.reset({ zona: '', tipo: 'AUTO', prefijo: '', cantidad: 1 });
    this.formZonaVisible.set(true);
  }

  guardarZona(): void {
    if (this.formZona.invalid || this.guardandoZona()) return;
    this.guardandoZona.set(true);
    const v = this.formZona.getRawValue();
    this.plazaService
      .crearZona({ zona: v.zona!, tipo: v.tipo!, prefijo: v.prefijo!.toUpperCase(), cantidad: v.cantidad! })
      .subscribe({
        next: (creadas) => {
          this.toast.exito(`${creadas.length} plazas creadas en "${v.zona}"`);
          this.formZonaVisible.set(false);
          this.guardandoZona.set(false);
          this.cargarPlazas();
        },
        error: (err) => {
          this.toast.error(err.error?.message ?? 'No se pudo crear la zona');
          this.guardandoZona.set(false);
        }
      });
  }

  guardarAjusteZona(z: ZonaResumen): void {
    const key = this.claveZona(z);
    const nuevoTotal = this.ajustes[key] ?? z.total;
    if (nuevoTotal === z.total) return;
    this.guardandoZona.set(true);
    this.plazaService.ajustarZona({ zona: z.zona, tipo: z.tipo, cantidadTotal: nuevoTotal }).subscribe({
      next: () => {
        this.toast.exito(`Zona "${z.zona}" ajustada a ${nuevoTotal} plazas`);
        delete this.ajustes[key];
        this.guardandoZona.set(false);
        this.cargarPlazas();
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'No se pudo ajustar la zona');
        this.guardandoZona.set(false);
      }
    });
  }

  eliminarZona(z: ZonaResumen): void {
    if (!confirm(`Eliminar la zona "${z.zona}" (${z.tipo})? Se eliminaran sus ${z.total} plazas.`)) return;
    this.guardandoZona.set(true);
    this.plazaService.ajustarZona({ zona: z.zona, tipo: z.tipo, cantidadTotal: 0 }).subscribe({
      next: () => {
        this.toast.exito(`Zona "${z.zona}" eliminada`);
        delete this.ajustes[this.claveZona(z)];
        this.guardandoZona.set(false);
        this.cargarPlazas();
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'No se pudo eliminar la zona');
        this.guardandoZona.set(false);
      }
    });
  }
}
