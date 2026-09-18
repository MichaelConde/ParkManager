import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente, ClienteRequest, HistorialItem, PageResponse, Vehiculo } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly base = '/api/clientes';

  constructor(private http: HttpClient) {}

  listar(busqueda?: string): Observable<Cliente[]> {
    let params = new HttpParams();
    if (busqueda) params = params.set('q', busqueda);
    return this.http.get<Cliente[]>(this.base, { params });
  }

  obtener(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }

  crear(request: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.base, request);
  }

  actualizar(id: number, request: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.base}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  vehiculos(id: number): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.base}/${id}/vehiculos`);
  }

  historial(id: number, page = 0, size = 20): Observable<PageResponse<HistorialItem>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<HistorialItem>>(`${this.base}/${id}/historial`, { params });
  }
}
