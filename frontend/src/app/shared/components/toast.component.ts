import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      @for (t of toast.toasts(); track t.id) {
        <div class="rounded-lg shadow-lg px-4 py-3 text-sm text-white flex items-start justify-between gap-2 animate-fade-in"
             [class.bg-green-600]="t.tipo === 'exito'"
             [class.bg-red-600]="t.tipo === 'error'"
             [class.bg-slate-700]="t.tipo === 'info'">
          <span>{{ t.mensaje }}</span>
          <button (click)="toast.cerrar(t.id)" class="opacity-70 hover:opacity-100">✕</button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
