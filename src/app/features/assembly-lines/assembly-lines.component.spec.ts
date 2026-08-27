import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AssemblyLinesComponent } from './assembly-lines.component';
import { AssemblyLineService } from '../../core/services/assembly-line.service';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { AssemblyLine } from '../../core/models/assembly-line.model';

describe('AssemblyLinesComponent', () => {
  let lineServiceSpy: jasmine.SpyObj<AssemblyLineService>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;

  const products: Product[] = [
    { id: 1, name: '8DAB' },
    { id: 2, name: 'Simosec' },
  ];
  const lines: AssemblyLine[] = [
    { id: 10, name: 'Convey line', active: true, productId: 1, product: products[0] },
  ];

  function setup() {
    TestBed.configureTestingModule({
      imports: [AssemblyLinesComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AssemblyLineService, useValue: lineServiceSpy },
        { provide: ProductService, useValue: productServiceSpy },
      ],
    });
    const fixture = TestBed.createComponent(AssemblyLinesComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    lineServiceSpy = jasmine.createSpyObj('AssemblyLineService', [
      'list',
      'getOne',
      'create',
      'update',
      'remove',
    ]);
    productServiceSpy = jasmine.createSpyObj('ProductService', ['list']);
    productServiceSpy.list.and.returnValue(of(products));
    lineServiceSpy.list.and.returnValue(of(lines));
  });

  it('loads products then assembly lines on init', () => {
    const fixture = setup();

    expect(productServiceSpy.list).toHaveBeenCalled();
    expect(lineServiceSpy.list).toHaveBeenCalledWith(null);
    expect(fixture.componentInstance.lines()).toEqual(lines);
  });

  it('defaults the form productId to the first product', () => {
    const fixture = setup();
    expect(fixture.componentInstance.form.value.productId).toBe(1);
  });

  it('reloads lines filtered by product when the filter changes', () => {
    const fixture = setup();
    lineServiceSpy.list.calls.reset();
    lineServiceSpy.list.and.returnValue(of([]));

    fixture.componentInstance.onFilterChange(2);

    expect(lineServiceSpy.list).toHaveBeenCalledWith(2);
    expect(fixture.componentInstance.filterProductId()).toBe(2);
  });

  it('creates a new assembly line on submit', () => {
    lineServiceSpy.create.and.returnValue(of(lines[0]));
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({ name: 'Testing line', productId: 2, active: true });
    component.onSubmit();

    expect(lineServiceSpy.create).toHaveBeenCalledWith({
      name: 'Testing line',
      productId: 2,
      active: true,
    });
  });

  it('shows the server error message when creation fails', () => {
    lineServiceSpy.create.and.returnValue(
      throwError(() => ({ error: { message: 'productId does not reference an existing product' } }))
    );
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({ name: 'Bad line', productId: 999, active: true });
    component.onSubmit();

    expect(component.saving()).toBeFalse();
  });

  it('removes a line when confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    lineServiceSpy.remove.and.returnValue(of(undefined));
    const fixture = setup();

    fixture.componentInstance.remove(lines[0]);

    expect(lineServiceSpy.remove).toHaveBeenCalledWith(10);
  });
});
