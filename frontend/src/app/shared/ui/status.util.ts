import { StatusTone } from './status-badge.component';

export function plazaTone(estado: string): StatusTone {
  return estado === 'LIBRE' ? 'available' : 'occupied';
}

export function sesionTone(estado: string): StatusTone {
  return estado === 'ACTIVA' ? 'available' : 'inactive';
}

export function boolTone(active: boolean): StatusTone {
  return active ? 'available' : 'inactive';
}

export function membresiaTone(vigente: boolean): StatusTone {
  return vigente ? 'available' : 'inactive';
}
