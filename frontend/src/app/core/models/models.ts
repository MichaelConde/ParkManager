// Modelos TypeScript que reflejan los DTOs expuestos por el backend (com.parking.dto.*)

export type Rol = 'ADMIN' | 'CAJERO';
export type TipoVehiculo = 'AUTO' | 'MOTO';
export type EstadoPlaza = 'LIBRE' | 'OCUPADA';
export type EstadoSesion = 'ACTIVA' | 'CERRADA';
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'OTRO';
export type TipoNotificacion = 'OCUPACION' | 'MEMBRESIA_VENCE' | 'SISTEMA';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  rol: Rol;
  expiraEnMinutos: number;
}

export interface Usuario {
  id: number;
  username: string;
  rol: Rol;
  activo: boolean;
}

export interface UsuarioRequest {
  username: string;
  password: string;
  rol: Rol;
}

export interface Cliente {
  id: number;
  nombre: string;
  contacto?: string;
  documento?: string;
}

export interface ClienteRequest {
  nombre: string;
  contacto?: string;
  documento?: string;
}

export interface Vehiculo {
  id: number;
  placa: string;
  modelo?: string;
  tipo: TipoVehiculo;
  clienteId?: number;
  clienteNombre?: string;
}

export interface VehiculoRequest {
  placa: string;
  modelo?: string;
  tipo: TipoVehiculo;
  clienteId?: number;
}

export interface Plaza {
  id: number;
  codigo: string;
  tipo: TipoVehiculo;
  zona?: string;
  estado: EstadoPlaza;
}

export interface PlazaRequest {
  codigo: string;
  tipo: TipoVehiculo;
  zona?: string;
}

export interface PlazaUpdateRequest {
  tipo: TipoVehiculo;
  zona?: string;
  estado: EstadoPlaza;
}

export interface Tarifa {
  id: number;
  tipoVehiculo: TipoVehiculo;
  precioHora: number;
  vigenteDesde: string;
  activa: boolean;
}

export interface TarifaRequest {
  tipoVehiculo: TipoVehiculo;
  precioHora: number;
}

export interface IngresoRequest {
  placa: string;
  tipo: TipoVehiculo;
  modelo?: string;
  clienteId?: number;
}

export interface Sesion {
  id: number;
  placa: string;
  tipoVehiculo: TipoVehiculo;
  plazaCodigo: string;
  usuarioCajero: string;
  horaEntrada: string;
  horaSalida?: string;
  duracionMinutos?: number;
  tarifaHoraAplicada: number;
  montoCobrado?: number;
  estado: EstadoSesion;
  membresiaAplicada: boolean;
  codigoQr: string;
  qrImageBase64?: string;
}

export interface SalidaRequest {
  sesionId?: number;
  placa?: string;
  codigoQr?: string;
  metodoPago: MetodoPago;
}

export interface Pago {
  id: number;
  sesionId: number;
  monto: number;
  metodo: MetodoPago;
  fechaPago: string;
}

export interface Recibo {
  sesion: Sesion;
  pago: Pago;
}

export interface HistorialItem {
  sesionId: number;
  placa: string;
  plazaCodigo: string;
  horaEntrada: string;
  horaSalida?: string;
  duracionMinutos?: number;
  montoCobrado?: number;
  membresiaAplicada: boolean;
  metodoPago?: MetodoPago;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PlanMembresia {
  id: number;
  nombre: string;
  duracionDias: number;
  precio: number;
  descripcion?: string;
  activo: boolean;
}

export interface PlanMembresiaRequest {
  nombre: string;
  duracionDias: number;
  precio: number;
  descripcion?: string;
}

export interface Membresia {
  id: number;
  clienteId: number;
  clienteNombre: string;
  planId: number;
  planNombre: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

export interface AsignarMembresiaRequest {
  clienteId: number;
  planId: number;
  fechaInicio?: string;
}

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
  fechaCreacion: string;
  leida: boolean;
}

export interface IngresoDia {
  fecha: string;
  total: number;
  sesiones: number;
}

export interface ReporteIngresos {
  desde: string;
  hasta: string;
  totalIngresos: number;
  totalSesiones: number;
  porMetodoPago: Record<string, number>;
  porDia: IngresoDia[];
}

export interface OcupacionTipo {
  tipo: TipoVehiculo;
  total: number;
  ocupadas: number;
  libres: number;
  porcentajeOcupacion: number;
}

export interface PlazaUso {
  codigo: string;
  totalSesiones: number;
}

export interface ReporteOcupacion {
  porTipo: OcupacionTipo[];
  plazasMasUsadas: PlazaUso[];
  sesionesActivas: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  detalles?: string[];
}
