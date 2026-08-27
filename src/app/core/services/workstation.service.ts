import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Workstation, WorkstationInput } from '../models/workstation.model';

@Injectable({ providedIn: 'root' })
export class WorkstationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/workstations`;

  list(): Observable<Workstation[]> {
    return this.http.get<Workstation[]>(this.base);
  }

  create(data: WorkstationInput): Observable<Workstation> {
    return this.http.post<Workstation>(this.base, data);
  }

  update(id: number, data: WorkstationInput): Observable<Workstation> {
    return this.http.put<Workstation>(`${this.base}/${id}`, data);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
