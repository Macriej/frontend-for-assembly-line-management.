import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AssemblyLineService } from '../../core/services/assembly-line.service';
import { WorkstationService } from '../../core/services/workstation.service';
import { AllocationService } from '../../core/services/allocation.service';
import { AssemblyLineDetail } from '../../core/models/assembly-line.model';
import { Workstation } from '../../core/models/workstation.model';
import { Allocation } from '../../core/models/allocation.model';

const AVAILABLE_LIST_ID = 'available-list';
const ALLOCATED_LIST_ID = 'allocated-list';

@Component({
  selector: 'app-allocations',
  standalone: true,
  imports: [
    RouterLink,
    CdkDropList,
    CdkDropListGroup,
    CdkDrag,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  templateUrl: './allocations.component.html',
  styleUrl: './allocations.component.scss',
})
export class AllocationsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lineService = inject(AssemblyLineService);
  private readonly workstationService = inject(WorkstationService);
  private readonly allocationService = inject(AllocationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly availableListId = AVAILABLE_LIST_ID;
  readonly allocatedListId = ALLOCATED_LIST_ID;

  private lineId!: number;
  readonly line = signal<AssemblyLineDetail | null>(null);
  readonly available = signal<Workstation[]>([]);
  readonly allocated = signal<Allocation[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('lineId');
    this.lineId = Number(idParam);
    if (!idParam || Number.isNaN(this.lineId)) {
      this.snackBar.open('Invalid assembly line', 'Close', { duration: 3000 });
      this.router.navigate(['/assembly-lines']);
      return;
    }
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    forkJoin({
      line: this.lineService.getOne(this.lineId),
      workstations: this.workstationService.list(),
    }).subscribe({
      next: ({ line, workstations }) => {
        this.line.set(line);
        const sortedAllocations = [...line.allocations].sort((a, b) => a.order - b.order);
        this.allocated.set(sortedAllocations);

        const allocatedWorkstationIds = new Set(sortedAllocations.map((a) => a.workstationId));
        this.available.set(workstations.filter((w) => !allocatedWorkstationIds.has(w.id)));

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load this assembly line', 'Close', { duration: 3000 });
        this.router.navigate(['/assembly-lines']);
      },
    });
  }

  drop(event: CdkDragDrop<any>): void {
    if (this.saving()) return;

    // Reordering within the "allocated" column.
    if (event.previousContainer === event.container) {
      if (event.container.id === this.allocatedListId) {
        const next = [...this.allocated()];
        moveItemInArray(next, event.previousIndex, event.currentIndex);
        this.allocated.set(next);
        this.persistOrder();
      }
      return;
    }

    // Available -> Allocated: create a new allocation.
    if (event.previousContainer.id === this.availableListId && event.container.id === this.allocatedListId) {
      this.addAllocation(event.previousIndex, event.currentIndex);
      return;
    }

    // Allocated -> Available: remove the allocation.
    if (event.previousContainer.id === this.allocatedListId && event.container.id === this.availableListId) {
      this.removeAllocation(event.previousIndex);
    }
  }

  quickAdd(workstation: Workstation): void {
    const index = this.available().findIndex((w) => w.id === workstation.id);
    if (index === -1) return;
    // Adds at the end of the allocated column.
    this.addAllocation(index, this.allocated().length);
  }

  removeViaButton(allocation: Allocation): void {
    const index = this.allocated().findIndex((a) => a.id === allocation.id);
    if (index === -1) return;
    this.removeAllocation(index);
  }

  private addAllocation(availableIndex: number, targetIndex: number): void {
    const workstation = this.available()[availableIndex];
    if (!workstation) return;

    this.saving.set(true);
    this.allocationService.allocate(this.lineId, workstation.id).subscribe({
      next: (allocation) => {
        // Only mutate local state once we have the real allocation id from
        // the server - avoids juggling a placeholder object that would need
        // to be swapped out later.
        const nextAvailable = this.available().filter((w) => w.id !== workstation.id);
        this.available.set(nextAvailable);

        const nextAllocated = [...this.allocated()];
        const insertAt = Math.min(targetIndex, nextAllocated.length);
        nextAllocated.splice(insertAt, 0, allocation);
        this.allocated.set(nextAllocated);

        // Backend always appends the new allocation at the end (order = max+1).
        // If the user dropped it somewhere other than the end, persist the
        // reordered list so the stored order matches what's on screen.
        if (insertAt !== nextAllocated.length - 1) {
          this.persistOrder();
        } else {
          this.saving.set(false);
        }
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Could not allocate workstation', 'Close', { duration: 3000 });
      },
    });
  }

  private removeAllocation(allocatedIndex: number): void {
    const allocation = this.allocated()[allocatedIndex];
    if (!allocation) return;

    this.saving.set(true);
    this.allocationService.remove(this.lineId, allocation.id).subscribe({
      next: () => {
        this.allocated.set(this.allocated().filter((a) => a.id !== allocation.id));
        this.available.set([...this.available(), allocation.workstation]);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Could not remove allocation', 'Close', { duration: 3000 });
      },
    });
  }

  private persistOrder(): void {
    this.saving.set(true);
    const orderedAllocationIds = this.allocated().map((a) => a.id);
    this.allocationService.reorder(this.lineId, orderedAllocationIds).subscribe({
      next: () => this.saving.set(false),
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Could not save new order — reloading', 'Close', { duration: 3000 });
        this.loadAll();
      },
    });
  }
}
