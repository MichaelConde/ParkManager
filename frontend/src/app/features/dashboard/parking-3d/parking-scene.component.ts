import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { Plaza, Sesion } from '../../../core/models/models';
import { VehicleModelService } from '../../../core/services/vehicle-model.service';
import { computeParkingLayout, PlazaSlot } from '../../../shared/three/parking-layout';

const STATUS_COLOR = {
  libre: 0x22c55e,
  ocupada: 0xa78bfa
};

@Component({
  selector: 'app-parking-scene',
  standalone: true,
  template: `
    <div #host class="h-full w-full min-h-[320px]">
      <canvas #canvas class="block h-full w-full cursor-grab active:cursor-grabbing"></canvas>
    </div>
  `
})
export class ParkingSceneComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() plazas: Plaza[] = [];
  @Input() sesiones: Sesion[] = [];
  @Output() vehicleClick = new EventEmitter<string>();
  @Output() freeSlotClick = new EventEmitter<string>();

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private raf = 0;
  private resizeObserver?: ResizeObserver;
  private resumeAutoRotateTimeout?: ReturnType<typeof setTimeout>;

  private padsGroup = new THREE.Group();
  private vehiclesGroup = new THREE.Group();
  private slots = new Map<string, PlazaSlot>();
  private instances = new Map<string, THREE.Group>();
  private pendingSpawns = new Set<string>();
  private viewSize = 7;

  private raycaster = new THREE.Raycaster();
  private pointerDownAt: { x: number; y: number } | null = null;
  private readonly CLICK_DRAG_THRESHOLD = 6;

  constructor(private vehicleModelService: VehicleModelService) {}

  ngAfterViewInit(): void {
    this.initScene();
    this.animate();
    this.rebuildPads();
    this.syncVehicles();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.renderer) return;
    // Siempre se reconstruyen los cajones antes de sincronizar vehiculos:
    // si "sesiones" resuelve antes que "plazas" (orden no garantizado de
    // las dos peticiones HTTP del dashboard), evita que un vehiculo se
    // salte por no encontrar aun su cajon en el mapa de slots.
    this.rebuildPads();
    this.syncVehicles();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.resumeAutoRotateTimeout);
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    const canvas = this.canvasRef?.nativeElement;
    canvas?.removeEventListener('pointerdown', this.onPointerDown);
    canvas?.removeEventListener('pointerup', this.onPointerUp);
    canvas?.removeEventListener('pointermove', this.onPointerMove);
    this.instances.forEach((inst) => this.vehicleModelService.disposeInstance(inst));
    this.instances.clear();
    this.renderer?.dispose();
  }

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const host = this.hostRef.nativeElement;

    this.scene = new THREE.Scene();

    const aspect = Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1);
    this.camera = new THREE.OrthographicCamera(
      (-this.viewSize * aspect) / 2,
      (this.viewSize * aspect) / 2,
      this.viewSize / 2,
      -this.viewSize / 2,
      0.1,
      100
    );
    this.camera.position.set(11, 10, 11);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const hemi = new THREE.HemisphereLight(0x9fd8ff, 0x0a0e1a, 0.55);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.15);
    dir.position.set(8, 14, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -14;
    dir.shadow.camera.right = 14;
    dir.shadow.camera.top = 14;
    dir.shadow.camera.bottom = -14;
    dir.shadow.bias = -0.001;
    this.scene.add(dir);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1c, roughness: 0.95, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(60, 60, 0x22d3ee, 0x14203a);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.18;
    this.scene.add(grid);

    this.scene.add(this.padsGroup);
    this.scene.add(this.vehiclesGroup);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minZoom = 0.6;
    this.controls.maxZoom = 2.6;
    this.controls.minPolarAngle = Math.PI / 3.6;
    this.controls.maxPolarAngle = Math.PI / 2.6;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.addEventListener('start', () => {
      this.controls.autoRotate = false;
      clearTimeout(this.resumeAutoRotateTimeout);
    });
    this.controls.addEventListener('end', () => {
      this.resumeAutoRotateTimeout = setTimeout(() => (this.controls.autoRotate = true), 4000);
    });

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(host);

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointermove', this.onPointerMove);
  }

  /**
   * OrbitControls tambien escucha pointerdown/up en el mismo canvas para
   * rotar la camara; distinguimos un click real de un drag de rotacion
   * midiendo cuanto se movio el puntero entre down y up, en vez de asumir
   * que todo pointerup sin drag previo es un click sobre un vehiculo.
   */
  private onPointerDown = (event: PointerEvent): void => {
    this.pointerDownAt = { x: event.clientX, y: event.clientY };
  };

  private onPointerUp = (event: PointerEvent): void => {
    const start = this.pointerDownAt;
    this.pointerDownAt = null;
    if (!start) return;
    const dist = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (dist > this.CLICK_DRAG_THRESHOLD) return;

    const target = this.pickTarget(event);
    if (!target) return;
    if (target.type === 'vehicle') this.vehicleClick.emit(target.codigoQr);
    else this.freeSlotClick.emit(target.plazaCodigo);
  };

  private onPointerMove = (event: PointerEvent): void => {
    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = this.pickTarget(event) ? 'pointer' : '';
  };

  /**
   * Primero intenta contra los vehiculos (prioridad, ya que estan encima
   * de su plaza); si no hay hit, intenta contra el plano de relleno de
   * cada plaza (no las lineas de borde, cuyo raycasting con threshold es
   * poco preciso) y solo la reporta como objetivo si esta LIBRE.
   */
  private pickTarget(event: PointerEvent): { type: 'vehicle'; codigoQr: string } | { type: 'free'; plazaCodigo: string } | null {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);

    const vehicleHits = this.raycaster.intersectObjects(this.vehiclesGroup.children, true);
    if (vehicleHits.length > 0) {
      let obj: THREE.Object3D | null = vehicleHits[0].object;
      while (obj && obj.parent !== this.vehiclesGroup) {
        obj = obj.parent;
      }
      const codigoQr = obj?.userData?.['codigoQr'] as string | undefined;
      if (codigoQr) return { type: 'vehicle', codigoQr };
    }

    const padFills = this.padsGroup.children.filter((o) => (o as THREE.Mesh).isMesh);
    const padHits = this.raycaster.intersectObjects(padFills, false);
    if (padHits.length > 0) {
      const plazaCodigo = padHits[0].object.userData?.['plazaCodigo'] as string | undefined;
      if (plazaCodigo && this.slots.get(plazaCodigo)?.estado === 'LIBRE') {
        return { type: 'free', plazaCodigo };
      }
    }
    return null;
  }

  private onResize(): void {
    const host = this.hostRef.nativeElement;
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    this.renderer.setSize(width, height);
    this.updateCameraFraming();
  }

  /**
   * Ajusta el frustum de la camara ortografica para que el lote completo
   * quepa siempre en pantalla, sin importar cuantas plazas haya ni el
   * angulo actual del auto-rotate. Se basa en la diagonal del bounding
   * box de las plazas (invariante ante la rotacion de la camara), no en
   * un tamano fijo que se recorta con lotes grandes.
   */
  private updateCameraFraming(): void {
    if (!this.camera) return;
    const host = this.hostRef.nativeElement;
    const aspect = Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1);

    let maxX = 6;
    let maxZ = 6;
    for (const slot of this.slots.values()) {
      maxX = Math.max(maxX, Math.abs(slot.x) + slot.width / 2);
      maxZ = Math.max(maxZ, Math.abs(slot.z) + slot.depth / 2);
    }
    const diagonal = Math.sqrt(maxX * maxX + maxZ * maxZ) * 2;
    this.viewSize = Math.max(7, diagonal * 0.62);

    this.camera.left = (-this.viewSize * aspect) / 2;
    this.camera.right = (this.viewSize * aspect) / 2;
    this.camera.top = this.viewSize / 2;
    this.camera.bottom = -this.viewSize / 2;
    this.camera.updateProjectionMatrix();
  }

  private animate = (): void => {
    this.raf = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private rebuildPads(): void {
    this.padsGroup.clear();
    this.slots.clear();

    const layout = computeParkingLayout(this.plazas);
    for (const slot of layout) {
      this.slots.set(slot.codigo, slot);

      const isLibre = slot.estado === 'LIBRE';
      const fill = new THREE.Mesh(
        new THREE.PlaneGeometry(slot.width, slot.depth),
        new THREE.MeshBasicMaterial({
          color: isLibre ? STATUS_COLOR.libre : STATUS_COLOR.ocupada,
          transparent: true,
          opacity: isLibre ? 0.08 : 0.05
        })
      );
      fill.rotation.x = -Math.PI / 2;
      fill.position.set(slot.x, 0.01, slot.z);
      fill.userData['plazaCodigo'] = slot.codigo;
      this.padsGroup.add(fill);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(slot.width, slot.depth)),
        new THREE.LineBasicMaterial({
          color: isLibre ? STATUS_COLOR.libre : STATUS_COLOR.ocupada,
          transparent: true,
          opacity: isLibre ? 0.85 : 0.3
        })
      );
      edges.rotation.x = -Math.PI / 2;
      edges.position.set(slot.x, 0.02, slot.z);
      this.padsGroup.add(edges);
    }

    this.updateCameraFraming();
  }

  private syncVehicles(): void {
    const activePorCodigo = new Map(this.sesiones.map((s) => [s.codigoQr, s]));

    // Salidas: instancias que ya no estan en la lista de sesiones activas
    for (const [codigoQr, instance] of this.instances) {
      if (!activePorCodigo.has(codigoQr)) {
        this.animateExit(codigoQr, instance);
      }
    }

    // Ingresos: sesiones activas sin instancia todavia
    for (const sesion of this.sesiones) {
      const slot = this.slots.get(sesion.plazaCodigo);
      if (!slot) continue;

      const instance = this.instances.get(sesion.codigoQr);
      if (instance) {
        // El layout se recalcula por completo en cada rebuildPads() (p. ej.
        // al cambiar de pestana de zona o al variar la cantidad de plazas),
        // asi que una instancia ya montada puede haber quedado con las
        // coordenadas de un layout anterior; se reubica sin re-animar el
        // spawn.
        this.repositionIfNeeded(instance, slot);
        continue;
      }
      if (this.pendingSpawns.has(sesion.codigoQr)) continue;
      this.spawnVehicle(sesion, slot);
    }
  }

  private repositionIfNeeded(instance: THREE.Group, slot: PlazaSlot): void {
    const dx = instance.position.x - slot.x;
    const dz = instance.position.z - slot.z;
    if (Math.abs(dx) < 0.01 && Math.abs(dz) < 0.01) return;
    gsap.to(instance.position, { x: slot.x, z: slot.z, duration: 0.5, ease: 'power2.inOut' });
  }

  private async spawnVehicle(sesion: Sesion, slot: PlazaSlot): Promise<void> {
    this.pendingSpawns.add(sesion.codigoQr);
    try {
      const instance = await this.vehicleModelService.createInstance(sesion.tipoVehiculo, sesion.codigoQr);
      instance.userData['codigoQr'] = sesion.codigoQr;
      const finalY = instance.position.y;
      instance.position.set(slot.x, finalY + 2.2, slot.z);
      instance.scale.multiplyScalar(0.001);
      this.vehiclesGroup.add(instance);
      this.instances.set(sesion.codigoQr, instance);

      const targetScale = instance.scale.clone().multiplyScalar(1000);
      gsap.to(instance.position, { y: finalY, duration: 0.65, ease: 'bounce.out' });
      gsap.to(instance.scale, {
        x: targetScale.x,
        y: targetScale.y,
        z: targetScale.z,
        duration: 0.5,
        ease: 'back.out(1.6)'
      });
    } finally {
      this.pendingSpawns.delete(sesion.codigoQr);
    }
  }

  private animateExit(codigoQr: string, instance: THREE.Group): void {
    this.instances.delete(codigoQr);
    gsap.to(instance.position, { y: instance.position.y + 2.5, duration: 0.4, ease: 'power2.in' });
    gsap.to(instance.scale, {
      x: 0.001,
      y: 0.001,
      z: 0.001,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        this.vehiclesGroup.remove(instance);
        this.vehicleModelService.disposeInstance(instance);
      }
    });
  }
}
