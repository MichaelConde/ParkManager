import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehiculo, VehiculoRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class VehiculoService {
  private readonly base = '/api/vehiculos';

  constructor(private http: HttpClient) {}

  buscarPorPlaca(placa: string): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.base}/${placa}`);
  }

  crear(request: VehiculoRequest): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(this.base, request);
  }

  actualizar(id: number, request: VehiculoRequest): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.base}/${id}`, request);
  }
}
