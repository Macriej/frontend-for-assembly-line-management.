import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ProductsComponent } from './products.component';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';

describe('ProductsComponent', () => {
  let productServiceSpy: jasmine.SpyObj<ProductService>;

  const sampleProducts: Product[] = [
    { id: 1, name: '8DAB', count: { assemblyLines: 2 } },
    { id: 2, name: 'Simosec', count: { assemblyLines: 0 } },
  ];

  function setup() {
    TestBed.configureTestingModule({
      imports: [ProductsComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [{ provide: ProductService, useValue: productServiceSpy }],
    });
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['list', 'create', 'update', 'remove']);
    productServiceSpy.list.and.returnValue(of(sampleProducts));
  });

  it('loads products on init', () => {
    const fixture = setup();

    expect(productServiceSpy.list).toHaveBeenCalled();
    expect(fixture.componentInstance.products()).toEqual(sampleProducts);
    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('creates a product and reloads the list', () => {
    productServiceSpy.create.and.returnValue(of({ id: 3, name: 'NXPlus C' }));
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({ name: 'NXPlus C' });
    component.onSubmit();

    expect(productServiceSpy.create).toHaveBeenCalledWith({ name: 'NXPlus C' });
    expect(productServiceSpy.list).toHaveBeenCalledTimes(2);
    expect(component.editingId()).toBeNull();
  });

  it('switches to edit mode and calls update on submit', () => {
    productServiceSpy.update.and.returnValue(of(sampleProducts[0]));
    const fixture = setup();
    const component = fixture.componentInstance;

    component.edit(sampleProducts[0]);
    expect(component.editingId()).toBe(1);
    expect(component.form.value.name).toBe('8DAB');

    component.form.setValue({ name: '8DAB Renamed' });
    component.onSubmit();

    expect(productServiceSpy.update).toHaveBeenCalledWith(1, { name: '8DAB Renamed' });
  });

  it('shows an error message when create fails', () => {
    productServiceSpy.create.and.returnValue(
      throwError(() => ({ error: { message: 'Product name already exists' } }))
    );
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({ name: '8DAB' });
    component.onSubmit();

    expect(component.saving()).toBeFalse();
  });

  it('does not call remove when the confirmation dialog is dismissed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const fixture = setup();

    fixture.componentInstance.remove(sampleProducts[0]);

    expect(productServiceSpy.remove).not.toHaveBeenCalled();
  });

  it('removes a product and reloads when confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    productServiceSpy.remove.and.returnValue(of(undefined));
    const fixture = setup();

    fixture.componentInstance.remove(sampleProducts[1]);

    expect(productServiceSpy.remove).toHaveBeenCalledWith(2);
    expect(productServiceSpy.list).toHaveBeenCalledTimes(2);
  });
});
