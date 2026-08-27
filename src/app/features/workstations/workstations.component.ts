import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WorkstationService } from '../../core/services/workstation.service';
import { Workstation } from '../../core/models/workstation.model';

@Component({
  selector: 'app-workstations',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressBarModule,
  ],
  templateUrl: './workstations.component.html',
  styleUrl: './workstations.component.scss',
})
export class WorkstationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly workstationService = inject(WorkstationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly columns = ['shortName', 'name', 'pcName', 'allocations', 'actions'];
  readonly workstations = signal<Workstation[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    shortName: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    pcName: ['', [Validators.required, Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.workstationService.list().subscribe({
      next: (workstations) => {
        this.workstations.set(workstations);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load workstations', 'Close', { duration: 3000 });
      },
    });
  }

  edit(ws: Workstation): void {
    this.editingId.set(ws.id);
    this.form.setValue({ shortName: ws.shortName, name: ws.name, pcName: ws.pcName });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ shortName: '', name: '', pcName: '' });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const data = this.form.getRawValue();
    const id = this.editingId();
    this.saving.set(true);

    const request$ = id
      ? this.workstationService.update(id, data)
      : this.workstationService.create(data);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(id ? 'Workstation updated' : 'Workstation added', 'Close', {
          duration: 2000,
        });
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message ?? 'Could not save workstation';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      },
    });
  }

  remove(ws: Workstation): void {
    const count = ws.count?.allocations ?? 0;
    const warning =
      count > 0
        ? `"${ws.name}" is used in ${count} allocation(s). Deleting it will remove those allocations too. Continue?`
        : `Delete "${ws.name}"?`;
    if (!confirm(warning)) return;

    this.workstationService.remove(ws.id).subscribe({
      next: () => {
        this.snackBar.open('Workstation deleted', 'Close', { duration: 2000 });
        this.load();
      },
      error: () => this.snackBar.open('Could not delete workstation', 'Close', { duration: 3000 }),
    });
  }
}
