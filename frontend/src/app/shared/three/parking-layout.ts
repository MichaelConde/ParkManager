import { Plaza, TipoVehiculo } from '../../core/models/models';

export interface PlazaSlot {
  codigo: string;
  tipo: TipoVehiculo;
  estado: Plaza['estado'];
  x: number;
  z: number;
  width: number;
  depth: number;
}

const SPOT: Record<TipoVehiculo, { width: number; depth: number; gutter: number; columns: number }> = {
  AUTO: { width: 2.6, depth: 5.2, gutter: 0.6, columns: 6 },
  MOTO: { width: 1.3, depth: 2.6, gutter: 0.4, columns: 8 }
};

/**
 * Distribuye las plazas en dos grillas (AUTO arriba, MOTO abajo),
 * centradas en el origen, para que la camara isometrica quede balanceada
 * sin importar cuantas plazas existan.
 */
export function computeParkingLayout(plazas: Plaza[]): PlazaSlot[] {
  const autos = plazas.filter((p) => p.tipo === 'AUTO').sort((a, b) => a.codigo.localeCompare(b.codigo));
  const motos = plazas.filter((p) => p.tipo === 'MOTO').sort((a, b) => a.codigo.localeCompare(b.codigo));

  const slots: PlazaSlot[] = [];
  let cursorZ = 0;

  const placeGroup = (group: Plaza[], tipo: TipoVehiculo) => {
    if (group.length === 0) return;
    const cfg = SPOT[tipo];
    const cols = Math.min(cfg.columns, Math.max(1, group.length));
    const rows = Math.ceil(group.length / cols);
    const totalWidth = cols * cfg.width + (cols - 1) * cfg.gutter;
    const startX = -totalWidth / 2 + cfg.width / 2;

    group.forEach((plaza, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      slots.push({
        codigo: plaza.codigo,
        tipo,
        estado: plaza.estado,
        x: startX + col * (cfg.width + cfg.gutter),
        z: cursorZ + row * (cfg.depth + cfg.gutter),
        width: cfg.width,
        depth: cfg.depth
      });
    });

    cursorZ += rows * (cfg.depth + cfg.gutter) + 1.4;
  };

  placeGroup(autos, 'AUTO');
  placeGroup(motos, 'MOTO');

  const totalDepth = cursorZ;
  return slots.map((s) => ({ ...s, z: s.z - totalDepth / 2 }));
}
