import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Notificacion } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly base = '/api/notificaciones';

  constructor(private http: HttpClient) {}

  listar(soloNoLeidas = false): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.base, { params: new HttpParams().set('soloNoLeidas', soloNoLeidas) });
  }

  marcarLeida(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/leida`, {});
  }
}
