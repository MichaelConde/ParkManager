import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AsignarMembresiaRequest, Membresia, PlanMembresia, PlanMembresiaRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class MembresiaService {
  private readonly base = '/api/membresias';

  constructor(private http: HttpClient) {}

  listarPlanes(): Observable<PlanMembresia[]> {
    return this.http.get<PlanMembresia[]>(`${this.base}/planes`);
  }

  crearPlan(request: PlanMembresiaRequest): Observable<PlanMembresia> {
    return this.http.post<PlanMembresia>(`${this.base}/planes`, request);
  }

  actualizarPlan(id: number, request: PlanMembresiaRequest): Observable<PlanMembresia> {
    return this.http.put<PlanMembresia>(`${this.base}/planes/${id}`, request);
  }

  desactivarPlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/planes/${id}`);
  }

  listar(): Observable<Membresia[]> {
    return this.http.get<Membresia[]>(this.base);
  }

  historialPorCliente(clienteId: number): Observable<Membresia[]> {
    return this.http.get<Membresia[]>(`${this.base}/cliente/${clienteId}`);
  }

  asignar(request: AsignarMembresiaRequest): Observable<Membresia> {
    return this.http.post<Membresia>(`${this.base}/asignar`, request);
  }
}
