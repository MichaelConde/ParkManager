import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, Rol } from '../models/models';

const STORAGE_KEY = 'parking.auth';

interface StoredSession {
  token: string;
  username: string;
  rol: Rol;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessionSignal = signal<StoredSession | null>(this.leerDeStorage());

  readonly usuario = computed(() => this.sessionSignal());
  readonly autenticado = computed(() => this.sessionSignal() !== null);
  readonly rol = computed(() => this.sessionSignal()?.rol ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', request).pipe(
      tap((res) => {
        const sesion: StoredSession = { token: res.token, username: res.username, rol: res.rol };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
        this.sessionSignal.set(sesion);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.sessionSignal.set(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return this.sessionSignal()?.token ?? null;
  }

  esAdmin(): boolean {
    return this.rol() === 'ADMIN';
  }

  private leerDeStorage(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }
}
