import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheckBig, LucideInfo, LucideX } from '@lucide/angular';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideCircleCheckBig, LucideCircleAlert, LucideInfo, LucideX],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
      @for (t of toast.toasts(); track t.id) {
        <div class="glass-panel-strong flex animate-fade-in items-start gap-2.5 !p-3.5 text-sm">
          <span class="mt-0.5 shrink-0"
                [class.text-accent-400]="t.tipo === 'exito'"
                [class.text-red-400]="t.tipo === 'error'"
                [class.text-cyan-400]="t.tipo === 'info'">
            @switch (t.tipo) {
              @case ('exito') { <svg lucideCircleCheckBig [size]="17"></svg> }
              @case ('error') { <svg lucideCircleAlert [size]="17"></svg> }
              @default { <svg lucideInfo [size]="17"></svg> }
            }
          </span>
          <span class="flex-1 text-slate-200">{{ t.mensaje }}</span>
          <button (click)="toast.cerrar(t.id)" class="shrink-0 text-slate-500 transition-colors hover:text-white">
            <svg lucideX [size]="14"></svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
