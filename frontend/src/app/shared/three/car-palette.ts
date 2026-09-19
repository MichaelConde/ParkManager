// Paleta curada de colores "premium" para pintar los vehiculos 3D.
// Se elige de forma deterministica a partir de un seed (codigoQr o id de
// sesion) para que el mismo vehiculo conserve siempre el mismo color
// entre refrescos, en vez de cambiar aleatoriamente en cada poll.
export const CAR_PALETTE: readonly number[] = [
  0x22c55e, // verde esmeralda
  0x22d3ee, // cian electrico
  0xf87171, // rojo coral
  0xf59e0b, // ambar
  0xa78bfa, // violeta
  0x60a5fa, // azul cielo
  0xf472b6, // rosa
  0xe2e8f0, // blanco perla
  0xfacc15, // amarillo
  0xfb923c, // naranja
];

export function colorForSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CAR_PALETTE.length;
  return CAR_PALETTE[index];
}
