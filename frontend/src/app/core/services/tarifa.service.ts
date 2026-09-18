import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tarifa, TarifaRequest, TipoVehiculo } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TarifaService {
  private readonly base = '/api/tarifas';

  constructor(private http: HttpClient) {}

  listarVigentes(): Observable<Tarifa[]> {
    return this.http.get<Tarifa[]>(this.base);
  }

  historial(tipo: TipoVehiculo): Observable<Tarifa[]> {
    return this.http.get<Tarifa[]>(`${this.base}/historial`, { params: new HttpParams().set('tipo', tipo) });
  }

  actualizar(request: TarifaRequest): Observable<Tarifa> {
    return this.http.put<Tarifa>(this.base, request);
  }
}
