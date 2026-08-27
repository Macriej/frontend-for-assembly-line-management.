import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssemblyLine, AssemblyLineDetail, AssemblyLineInput } from '../models/assembly-line.model';

@Injectable({ providedIn: 'root' })
export class AssemblyLineService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/assembly-lines`;

  list(productId?: number | null): Observable<AssemblyLine[]> {
    let params = new HttpParams();
    if (productId) {
      params = params.set('productId', productId);
    }
    return this.http.get<AssemblyLine[]>(this.base, { params });
  }

  getOne(id: number): Observable<AssemblyLineDetail> {
    return this.http.get<AssemblyLineDetail>(`${this.base}/${id}`);
  }

  create(data: AssemblyLineInput): Observable<AssemblyLine> {
    return this.http.post<AssemblyLine>(this.base, data);
  }

  update(id: number, data: AssemblyLineInput): Observable<AssemblyLine> {
    return this.http.put<AssemblyLine>(`${this.base}/${id}`, data);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
