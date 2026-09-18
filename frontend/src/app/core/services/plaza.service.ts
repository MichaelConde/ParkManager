import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EstadoPlaza, Plaza, PlazaRequest, PlazaUpdateRequest, TipoVehiculo } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PlazaService {
  private readonly base = '/api/espacios';

  constructor(private http: HttpClient) {}

  listar(tipo?: TipoVehiculo, estado?: EstadoPlaza): Observable<Plaza[]> {
    let params = new HttpParams();
    if (tipo) params = params.set('tipo', tipo);
    if (estado) params = params.set('estado', estado);
    return this.http.get<Plaza[]>(this.base, { params });
  }

  crear(request: PlazaRequest): Observable<Plaza> {
    return this.http.post<Plaza>(this.base, request);
  }

  actualizar(id: number, request: PlazaUpdateRequest): Observable<Plaza> {
    return this.http.put<Plaza>(`${this.base}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
