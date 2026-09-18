import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HistorialItem, IngresoRequest, PageResponse, Recibo, SalidaRequest, Sesion } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly base = '/api/sesiones';

  constructor(private http: HttpClient) {}

  ingreso(request: IngresoRequest): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.base}/ingreso`, request);
  }

  salida(request: SalidaRequest): Observable<Recibo> {
    return this.http.post<Recibo>(`${this.base}/salida`, request);
  }

  activaPorPlaca(placa: string): Observable<Sesion> {
    return this.http.get<Sesion>(`${this.base}/activo`, { params: new HttpParams().set('placa', placa) });
  }

  activas(): Observable<Sesion[]> {
    return this.http.get<Sesion[]>(`${this.base}/activas`);
  }

  buscarPorCodigo(codigo: string): Observable<Sesion> {
    return this.http.get<Sesion>(`${this.base}/buscar`, { params: new HttpParams().set('codigo', codigo) });
  }

  historialPorPlaca(placa: string, page = 0, size = 20): Observable<PageResponse<HistorialItem>> {
    const params = new HttpParams().set('placa', placa).set('page', page).set('size', size);
    return this.http.get<PageResponse<HistorialItem>>(`${this.base}/historial`, { params });
  }
}
