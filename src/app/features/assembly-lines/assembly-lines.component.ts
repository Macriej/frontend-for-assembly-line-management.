import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AssemblyLineService } from '../../core/services/assembly-line.service';
import { ProductService } from '../../core/services/product.service';
import { AssemblyLine } from '../../core/models/assembly-line.model';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-assembly-lines',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressBarModule,
  ],
  templateUrl: './assembly-lines.component.html',
  styleUrl: './assembly-lines.component.scss',
})
export class AssemblyLinesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly lineService = inject(AssemblyLineService);
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);

  readonly columns = ['name', 'product', 'status', 'actions'];
  readonly products = signal<Product[]>([]);
  readonly lines = signal<AssemblyLine[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly filterProductId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    productId: [0, [Validators.required, Validators.min(1)]],
    active: [true],
  });

  ngOnInit(): void {
    this.productService.list().subscribe({
      next: (products) => {
        this.products.set(products);
        if (products.length && !this.form.controls.productId.value) {
          this.form.patchValue({ productId: products[0].id });
        }
        this.loadLines();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load products', 'Close', { duration: 3000 });
      },
    });
  }

  private loadLines(): void {
    this.loading.set(true);
    this.lineService.list(this.filterProductId()).subscribe({
      next: (lines) => {
        this.lines.set(lines);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load assembly lines', 'Close', { duration: 3000 });
      },
    });
  }

  onFilterChange(productId: number | null): void {
    this.filterProductId.set(productId);
    this.loadLines();
  }

  edit(line: AssemblyLine): void {
    this.editingId.set(line.id);
    this.form.setValue({ name: line.name, productId: line.productId, active: line.active });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', productId: this.products()[0]?.id ?? 0, active: true });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const data = this.form.getRawValue();
    const id = this.editingId();
    this.saving.set(true);

    const request$ = id ? this.lineService.update(id, data) : this.lineService.create(data);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(id ? 'Assembly line updated' : 'Assembly line added', 'Close', {
          duration: 2000,
        });
        this.cancelEdit();
        this.loadLines();
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message ?? 'Could not save assembly line';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      },
    });
  }

  remove(line: AssemblyLine): void {
    if (!confirm(`Delete "${line.name}"? This also removes its workstation allocations.`)) return;

    this.lineService.remove(line.id).subscribe({
      next: () => {
        this.snackBar.open('Assembly line deleted', 'Close', { duration: 2000 });
        this.loadLines();
      },
      error: () => this.snackBar.open('Could not delete assembly line', 'Close', { duration: 3000 }),
    });
  }
}
