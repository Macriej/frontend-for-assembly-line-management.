import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Allocation } from '../models/allocation.model';

@Injectable({ providedIn: 'root' })
export class AllocationService {
  private readonly base = `${environment.apiUrl}/assembly-lines`;
  private readonly http = inject(HttpClient);

  allocate(lineId: number, workstationId: number): Observable<Allocation> {
    return this.http.post<Allocation>(`${this.base}/${lineId}/allocations`, { workstationId });
  }

  reorder(lineId: number, orderedAllocationIds: number[]): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${lineId}/allocations/reorder`, {
      orderedAllocationIds,
    });
  }

  remove(lineId: number, allocationId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${lineId}/allocations/${allocationId}`);
  }
}
