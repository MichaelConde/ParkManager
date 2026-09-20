import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import * as THREE from 'three';
import gsap from 'gsap';
import { TipoVehiculo } from '../../core/models/models';
import { VehicleModelService } from '../../core/services/vehicle-model.service';

@Component({
  selector: 'app-vehicle-preview',
  standalone: true,
  template: `
    <div #host class="h-full w-full">
      <canvas #canvas class="block h-full w-full"></canvas>
    </div>
  `
})
export class VehiclePreviewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) tipo!: TipoVehiculo;
  @Input({ required: true }) seed!: string;

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private raf = 0;
  private rig = new THREE.Group();
  private resizeObserver?: ResizeObserver;
  private viewReady = false;
  private currentInstance?: THREE.Group;
  private loadToken = 0;

  constructor(private vehicleModelService: VehicleModelService) {}

  async ngAfterViewInit(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    const host = this.hostRef.nativeElement;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, host.clientWidth / host.clientHeight, 0.1, 50);
    this.camera.position.set(4.2, 2.6, 4.2);
    this.camera.lookAt(0, 0.3, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(host.clientWidth, host.clientHeight);

    this.scene.add(new THREE.HemisphereLight(0x9fd8ff, 0x0a0e1a, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(4, 6, 3);
    this.scene.add(dir);

    this.scene.add(this.rig);

    this.viewReady = true;
    await this.loadModel();

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(host);

    this.animate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // El primer set de inputs se resuelve en ngAfterViewInit, cuando la
    // escena ya existe; aqui solo reaccionamos a cambios posteriores
    // (p.ej. se registra un nuevo vehiculo sin recrear este componente).
    if (!this.viewReady) return;
    if (changes['tipo'] || changes['seed']) {
      this.loadModel();
    }
  }

  private async loadModel(): Promise<void> {
    const token = ++this.loadToken;
    const instance = await this.vehicleModelService.createInstance(this.tipo, this.seed);
    if (token !== this.loadToken) {
      // Llego una recarga mas reciente mientras esta se resolvia: descartar.
      this.vehicleModelService.disposeInstance(instance);
      return;
    }

    if (this.currentInstance) {
      this.rig.remove(this.currentInstance);
      this.vehicleModelService.disposeInstance(this.currentInstance);
    }
    this.currentInstance = instance;
    this.rig.add(instance);

    gsap.killTweensOf(this.rig.scale);
    gsap.killTweensOf(this.rig.rotation);
    this.rig.scale.set(0, 0, 0);
    this.rig.rotation.set(0, 0, 0);
    gsap.fromTo(this.rig.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.7)' });
    gsap.to(this.rig.rotation, { y: Math.PI * 2, duration: 9, repeat: -1, ease: 'none' });
  }

  private onResize(): void {
    const host = this.hostRef.nativeElement;
    if (!host.clientWidth || !host.clientHeight) return;
    this.camera.aspect = host.clientWidth / host.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(host.clientWidth, host.clientHeight);
  }

  private animate = (): void => {
    this.raf = requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    gsap.killTweensOf(this.rig.scale);
    gsap.killTweensOf(this.rig.rotation);
    this.rig.children.forEach((child) => this.vehicleModelService.disposeInstance(child as THREE.Group));
    this.renderer?.dispose();
  }
}
