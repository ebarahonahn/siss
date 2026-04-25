import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dashboard`;

  getStats() {
    return this.http.get<any>(`${this.base}/stats`).pipe(map(r => r.data ?? r));
  }

  getAgenda() {
    return this.http.get<any>(`${this.base}/agenda`).pipe(map(r => r.data ?? r));
  }
}
