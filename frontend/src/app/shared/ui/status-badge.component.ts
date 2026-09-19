import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type StatusTone = 'available' | 'occupied' | 'reserved' | 'alternate' | 'inactive';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
          [ngClass]="wrapperClass">
      <span class="h-1.5 w-1.5 rounded-full" [ngClass]="dotClass" [class.animate-pulse-glow]="pulse"></span>
      {{ label }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() tone: StatusTone = 'inactive';
  @Input() pulse = false;

  private toneMap: Record<StatusTone, { wrapper: string; dot: string }> = {
    available: { wrapper: 'border-accent-500/25 bg-accent-500/10 text-accent-300', dot: 'bg-accent-400' },
    occupied: { wrapper: 'border-violet-400/25 bg-violet-400/10 text-violet-300', dot: 'bg-violet-400' },
    reserved: { wrapper: 'border-red-400/25 bg-red-400/10 text-red-300', dot: 'bg-red-400' },
    alternate: { wrapper: 'border-amber-400/25 bg-amber-400/10 text-amber-300', dot: 'bg-amber-400' },
    inactive: { wrapper: 'border-slate-400/20 bg-slate-400/10 text-slate-400', dot: 'bg-slate-400' },
  };

  get wrapperClass(): string {
    return this.toneMap[this.tone].wrapper;
  }

  get dotClass(): string {
    return this.toneMap[this.tone].dot;
  }
}
