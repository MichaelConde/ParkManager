import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePlus } from '@lucide/angular';
import { UsuarioService } from '../../core/services/usuario.service';
import { Rol, Usuario } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';
import { GlassCardComponent } from '../../shared/ui/glass-card.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { GsapRevealDirective } from '../../shared/animations/gsap-reveal.directive';
import { boolTone } from '../../shared/ui/status.util';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GlassCardComponent, StatusBadgeComponent, GsapRevealDirective, LucidePlus],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Usuarios del sistema</h2>
          <p class="text-sm text-slate-500">Cuentas de administradores y cajeros</p>
        </div>
        <button (click)="formVisible.set(true)" class="btn-primary !px-4 !py-2 text-xs">
          <svg lucidePlus [size]="14"></svg> Nuevo usuario
        </button>
      </div>

      @if (formVisible()) {
        <app-glass-card padding="lg">
          <form [formGroup]="form" (ngSubmit)="guardar()" class="flex flex-wrap items-end gap-3">
            <div>
              <label class="label-eyebrow mb-1.5 block">Usuario</label>
              <input formControlName="username" class="glass-input" />
            </div>
            <div>
              <label class="label-eyebrow mb-1.5 block">Contrasena</label>
              <input formControlName="password" type="password" class="glass-input" />
            </div>
            <div>
              <label class="label-eyebrow mb-1.5 block">Rol</label>
              <select formControlName="rol" class="glass-input">
                <option value="CAJERO">CAJERO</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <button type="submit" [disabled]="form.invalid || guardando()" class="btn-primary">Crear</button>
            <button type="button" (click)="formVisible.set(false)" class="btn-ghost">Cancelar</button>
          </form>
        </app-glass-card>
      }

      <app-glass-card padding="lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/[0.08] text-left text-xs uppercase tracking-wide text-slate-500">
              <th class="py-2 font-medium">Usuario</th>
              <th class="font-medium">Rol</th>
              <th class="font-medium">Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (u of usuarios(); track u.id; let i = $index) {
              <tr gsapReveal [gsapIndex]="i" class="table-row-glass">
                <td class="py-2.5 font-semibold text-white">{{ u.username }}</td>
                <td class="text-slate-400">{{ u.rol }}</td>
                <td><app-status-badge [label]="u.activo ? 'Activo' : 'Inactivo'" [tone]="tone(u.activo)" /></td>
                <td class="text-right">
                  <button (click)="cambiarEstado(u)" class="text-xs font-medium text-accent-400 hover:text-accent-300">
                    {{ u.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </app-glass-card>
    </div>
  `
})
export class UsersComponent implements OnInit {
  usuarios = signal<Usuario[]>([]);
  formVisible = signal(false);
  guardando = signal(false);

  tone = boolTone;

  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['CAJERO' as Rol, Validators.required]
  });

  constructor(private usuarioService: UsuarioService, private toast: ToastService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.usuarioService.listar().subscribe((u) => this.usuarios.set(u));
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    const v = this.form.getRawValue();
    this.usuarioService.crear({ username: v.username!, password: v.password!, rol: v.rol! }).subscribe({
      next: () => {
        this.toast.exito('Usuario creado');
        this.formVisible.set(false);
        this.guardando.set(false);
        this.form.reset({ rol: 'CAJERO' });
        this.cargar();
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'No se pudo crear el usuario');
        this.guardando.set(false);
      }
    });
  }

  cambiarEstado(u: Usuario): void {
    this.usuarioService.cambiarEstado(u.id, !u.activo).subscribe(() => {
      this.toast.exito(`Usuario ${!u.activo ? 'activado' : 'desactivado'}`);
      this.cargar();
    });
  }
}
