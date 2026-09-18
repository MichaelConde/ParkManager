import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteIngresos, ReporteOcupacion } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly base = '/api/reportes';

  constructor(private http: HttpClient) {}

  ingresos(desde: string, hasta: string): Observable<ReporteIngresos> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ReporteIngresos>(`${this.base}/ingresos`, { params });
  }

  ocupacion(desde: string, hasta: string): Observable<ReporteOcupacion> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ReporteOcupacion>(`${this.base}/ocupacion`, { params });
  }

  exportarIngresosUrl(desde: string, hasta: string): string {
    return `${this.base}/ingresos/export?desde=${desde}&hasta=${hasta}`;
  }

  descargarExcel(desde: string, hasta: string): Observable<Blob> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get(`${this.base}/ingresos/export`, { params, responseType: 'blob' });
  }
}
