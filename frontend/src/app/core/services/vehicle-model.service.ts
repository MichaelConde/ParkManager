import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { TipoVehiculo } from '../models/models';
import { colorForSeed } from '../../shared/three/car-palette';

interface ModelDefinition {
  url: string;
  /** Materiales de carroceria que se recolorean por instancia. */
  paintMaterials: string[];
  /** Escala uniforme para normalizar el tamano en la escena (1 unidad = 1 metro aprox). */
  scale: number;
  /** Rotacion en Y (radianes) para alinear el eje "largo" del modelo con el eje Z del cajon (profundidad). */
  rotationY: number;
}

// Escalas calculadas a partir del bounding box real de cada .glb (ver
// `gltf-transform inspect`), no valores adivinados:
//  - Hatch: bbox X (largo, eje local) = 929.5 unidades -> se escala a ~4.2m
//  - Bike:  bbox Z (largo, eje local) = 14.98 unidades -> se escala a ~2.0m
const MODEL_DEFS: Record<TipoVehiculo, ModelDefinition> = {
  AUTO: {
    url: 'models/vehicle-auto.glb',
    paintMaterials: ['Paint_Metallic_Coupe', 'Paint_Metallic'],
    scale: 4.2 / 929.54,
    rotationY: Math.PI / 2
  },
  MOTO: {
    url: 'models/vehicle-moto.glb',
    paintMaterials: ['Bike_White_Light'],
    scale: 2.0 / 14.98,
    rotationY: 0
  }
};

@Injectable({ providedIn: 'root' })
export class VehicleModelService {
  private loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  private cache = new Map<TipoVehiculo, Promise<THREE.Group>>();

  private loadBase(tipo: TipoVehiculo): Promise<THREE.Group> {
    let pending = this.cache.get(tipo);
    if (!pending) {
      const def = MODEL_DEFS[tipo];
      pending = new Promise((resolve, reject) => {
        this.loader.load(
          def.url,
          (gltf) => {
            const group = gltf.scene;
            group.traverse((obj) => {
              if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = false;
              }
            });
            resolve(group);
          },
          undefined,
          (err) => reject(err)
        );
      });
      this.cache.set(tipo, pending);
    }
    return pending;
  }

  /**
   * Crea una instancia clonada e independiente del modelo, coloreada de
   * forma deterministica segun `seed` (p.ej. el codigoQr de la sesion).
   */
  async createInstance(tipo: TipoVehiculo, seed: string): Promise<THREE.Group> {
    const base = await this.loadBase(tipo);
    const def = MODEL_DEFS[tipo];
    const instance = base.clone(true);

    const color = new THREE.Color(colorForSeed(seed));
    instance.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      const applyToMaterial = (mat: THREE.Material) => {
        const std = mat as THREE.MeshStandardMaterial;
        const cloned = std.clone();
        if (def.paintMaterials.includes(mat.name)) {
          cloned.color = color;
          cloned.metalness = 0.65;
          cloned.roughness = 0.35;
        } else if (mat.name.toLowerCase().includes('glass')) {
          cloned.transparent = true;
          cloned.opacity = 0.55;
          cloned.metalness = 0.1;
          cloned.roughness = 0.05;
        }
        return cloned;
      };

      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(applyToMaterial)
        : applyToMaterial(mesh.material as THREE.Material);
    });

    instance.scale.setScalar(def.scale);
    instance.rotation.y = def.rotationY;

    // Apoya el modelo exactamente sobre y=0 (su punto mas bajo tras
    // escalar/rotar), evitando que quede flotando o enterrado segun el
    // pivote original del asset.
    const box = new THREE.Box3().setFromObject(instance);
    instance.position.y -= box.min.y;

    return instance;
  }

  disposeInstance(instance: THREE.Group): void {
    instance.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => m?.dispose());
    });
  }
}
