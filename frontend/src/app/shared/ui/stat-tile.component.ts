import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type StatTone = 'accent' | 'cyan' | 'violet' | 'amber' | 'red';

@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel flex items-center gap-3.5 p-4" [ngClass]="borderClass">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" [ngClass]="iconBgClass">
        <ng-content select="[icon]" />
      </div>
      <div class="min-w-0">
        <p class="label-eyebrow truncate">{{ label }}</p>
        <p class="mt-0.5 text-2xl font-bold tracking-tight text-white">{{ value }}</p>
      </div>
    </div>
  `
})
export class StatTileComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() tone: StatTone = 'accent';

  private toneMap: Record<StatTone, { icon: string; border: string }> = {
    accent: { icon: 'bg-accent-500/15 text-accent-400', border: 'border-l-2 !border-l-accent-500/70' },
    cyan: { icon: 'bg-cyan-500/15 text-cyan-400', border: 'border-l-2 !border-l-cyan-400/70' },
    violet: { icon: 'bg-violet-500/15 text-violet-300', border: 'border-l-2 !border-l-violet-400/70' },
    amber: { icon: 'bg-amber-500/15 text-amber-300', border: 'border-l-2 !border-l-amber-400/70' },
    red: { icon: 'bg-red-500/15 text-red-300', border: 'border-l-2 !border-l-red-400/70' },
  };

  get iconBgClass(): string {
    return this.toneMap[this.tone].icon;
  }

  get borderClass(): string {
    return this.toneMap[this.tone].border;
  }
}
