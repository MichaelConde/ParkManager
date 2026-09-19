import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-glass-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel" [ngClass]="classes">
      <ng-content />
    </div>
  `
})
export class GlassCardComponent {
  @Input() glow = false;
  @Input() hoverable = false;
  @Input() padding: 'sm' | 'md' | 'lg' = 'md';

  get classes(): string {
    const padMap = { sm: 'p-4', md: 'p-5', lg: 'p-6' } as const;
    return [
      padMap[this.padding],
      this.glow ? 'shadow-glow-cyan' : '',
      this.hoverable ? 'transition-all duration-300 hover:border-white/[0.14] hover:-translate-y-0.5' : ''
    ].join(' ');
  }
}
