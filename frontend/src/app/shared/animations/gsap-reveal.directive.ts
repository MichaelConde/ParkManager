import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';
import gsap from 'gsap';

/**
 * Anima la entrada del elemento host (fade + translateY + leve escala).
 * Usar [gsapIndex] en listas/grids para escalonar (stagger) la entrada
 * de cada item segun su posicion.
 */
@Directive({
  selector: '[gsapReveal]',
  standalone: true
})
export class GsapRevealDirective implements AfterViewInit {
  @Input() gsapIndex = 0;
  @Input() gsapDuration = 0.5;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    gsap.fromTo(
      this.el.nativeElement,
      { opacity: 0, y: 14, scale: 0.985 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: this.gsapDuration,
        delay: this.gsapIndex * 0.055,
        ease: 'power3.out',
        clearProps: 'transform'
      }
    );
  }
}
