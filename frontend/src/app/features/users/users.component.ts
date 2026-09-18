import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { Rol, Usuario } from '../../core/models/models';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Usuarios del sistema</h2>
          <p class="text-sm text-slate-500">Cuentas de administradores y cajeros</p>
        </div>
        <button (click)="formVisible.set(true)" class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Nuevo usuario
        </button>
      </div>

      @if (formVisible()) {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="bg-white rounded-xl shadow-sm p-5 flex flex-wrap items-end gap-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Usuario</label>
            <input formControlName="username" class="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Contrasena</label>
            <input formControlName="password" type="password" class="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Rol</label>
            <select formControlName="rol" class="border rounded-lg px-3 py-2 text-sm">
              <option value="CAJERO">CAJERO</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button type="submit" [disabled]="form.invalid || guardando()" class="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
            Crear
          </button>
          <button type="button" (click)="formVisible.set(false)" class="text-sm text-slate-500 hover:underline">Cancelar</button>
        </form>
      }

      <div class="bg-white rounded-xl shadow-sm p-5">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-slate-500 border-b">
              <th class="py-2">Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (u of usuarios(); track u.id) {
              <tr class="border-b last:border-0">
                <td class="py-2 font-medium">{{ u.username }}</td>
                <td>{{ u.rol }}</td>
                <td>
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [class.bg-green-100]="u.activo" [class.text-green-700]="u.activo"
                        [class.bg-gray-100]="!u.activo" [class.text-gray-500]="!u.activo">
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="text-right">
                  <button (click)="cambiarEstado(u)" class="text-brand-600 hover:underline text-xs">
                    {{ u.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  usuarios = signal<Usuario[]>([]);
  formVisible = signal(false);
  guardando = signal(false);

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
