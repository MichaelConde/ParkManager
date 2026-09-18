import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: 'exito' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private contador = 0;
  readonly toasts = signal<Toast[]>([]);

  exito(mensaje: string): void {
    this.mostrar(mensaje, 'exito');
  }

  error(mensaje: string): void {
    this.mostrar(mensaje, 'error');
  }

  info(mensaje: string): void {
    this.mostrar(mensaje, 'info');
  }

  private mostrar(mensaje: string, tipo: Toast['tipo']): void {
    const id = ++this.contador;
    this.toasts.update((actuales) => [...actuales, { id, mensaje, tipo }]);
    setTimeout(() => this.cerrar(id), 4000);
  }

  cerrar(id: number): void {
    this.toasts.update((actuales) => actuales.filter((t) => t.id !== id));
  }
}
