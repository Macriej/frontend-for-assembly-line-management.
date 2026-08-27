import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-products',
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
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);

  readonly columns = ['name', 'lines', 'actions'];
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.productService.list().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load products', 'Close', { duration: 3000 });
      },
    });
  }

  edit(product: Product): void {
    this.editingId.set(product.id);
    this.form.setValue({ name: product.name });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '' });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const data = this.form.getRawValue();
    const id = this.editingId();
    this.saving.set(true);

    const request$ = id ? this.productService.update(id, data) : this.productService.create(data);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(id ? 'Product updated' : 'Product added', 'Close', { duration: 2000 });
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message ?? 'Could not save product';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      },
    });
  }

  remove(product: Product): void {
    const lineCount = product.count?.assemblyLines ?? 0;
    const warning =
      lineCount > 0
        ? `"${product.name}" has ${lineCount} assembly line(s). Deleting it will also delete them and their allocations. Continue?`
        : `Delete "${product.name}"?`;
    if (!confirm(warning)) return;

    this.productService.remove(product.id).subscribe({
      next: () => {
        this.snackBar.open('Product deleted', 'Close', { duration: 2000 });
        this.load();
      },
      error: () => this.snackBar.open('Could not delete product', 'Close', { duration: 3000 }),
    });
  }
}
