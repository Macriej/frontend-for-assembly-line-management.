import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { of, throwError } from 'rxjs';
import { AllocationsComponent } from './allocations.component';
import { AssemblyLineService } from '../../core/services/assembly-line.service';
import { WorkstationService } from '../../core/services/workstation.service';
import { AllocationService } from '../../core/services/allocation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AssemblyLineDetail } from '../../core/models/assembly-line.model';
import { Workstation } from '../../core/models/workstation.model';
import { Allocation } from '../../core/models/allocation.model';

describe('AllocationsComponent', () => {
  let lineServiceSpy: jasmine.SpyObj<AssemblyLineService>;
  let workstationServiceSpy: jasmine.SpyObj<WorkstationService>;
  let allocationServiceSpy: jasmine.SpyObj<AllocationService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const laserWelding: Workstation = { id: 1, shortName: 'LW', name: 'Laser welding', pcName: 'PC-LW-01' };
  const finalInspection: Workstation = { id: 2, shortName: 'FI', name: 'Final inspection', pcName: 'PC-FI-01' };
  const frameAssembly: Workstation = { id: 3, shortName: 'FA', name: 'Frame assembly', pcName: 'PC-FA-01' };

  const allocationLW: Allocation = { id: 100, assemblyLineId: 5, workstationId: 1, order: 1, workstation: laserWelding };
  const allocationFI: Allocation = { id: 101, assemblyLineId: 5, workstationId: 2, order: 2, workstation: finalInspection };

  const lineDetail: AssemblyLineDetail = {
    id: 5,
    name: 'Convey line',
    active: true,
    productId: 1,
    product: { id: 1, name: '8DAB' },
    allocations: [allocationFI, allocationLW], // intentionally unsorted to test sort-by-order
  };

  function setup(lineIdParam = '5') {
    TestBed.configureTestingModule({
      imports: [AllocationsComponent, NoopAnimationsModule],
      providers: [
        { provide: AssemblyLineService, useValue: lineServiceSpy },
        { provide: WorkstationService, useValue: workstationServiceSpy },
        { provide: AllocationService, useValue: allocationServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ lineId: lineIdParam }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(AllocationsComponent);
    fixture.detectChanges();
    return fixture;
  }

  function makeDropEvent(
    previousContainerId: string,
    containerId: string,
    previousIndex: number,
    currentIndex: number
  ): CdkDragDrop<any> {
    const previousContainer = { id: previousContainerId } as never;
    return {
      previousContainer,
      container: previousContainerId === containerId ? previousContainer : ({ id: containerId } as never),
      previousIndex,
      currentIndex,
    } as unknown as CdkDragDrop<any>;
  }

  beforeEach(() => {
    lineServiceSpy = jasmine.createSpyObj('AssemblyLineService', ['getOne']);
    workstationServiceSpy = jasmine.createSpyObj('WorkstationService', ['list']);
    allocationServiceSpy = jasmine.createSpyObj('AllocationService', ['allocate', 'reorder', 'remove']);
    routerSpy = jasmine.createSpyObj(
      'Router',
      ['navigate', 'createUrlTree', 'serializeUrl'],
      { events: of() }
    );
    routerSpy.createUrlTree.and.returnValue(null as never);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    lineServiceSpy.getOne.and.returnValue(of(lineDetail));
    workstationServiceSpy.list.and.returnValue(of([laserWelding, finalInspection, frameAssembly]));
  });

  it('loads the line and splits workstations into available/allocated, sorted by order', () => {
    const fixture = setup();
    const component = fixture.componentInstance;

    expect(component.allocated().map((a) => a.id)).toEqual([100, 101]); // sorted by order: LW(1) before FI(2)
    expect(component.available().map((w) => w.id)).toEqual([3]); // only Frame assembly is unallocated
    expect(component.loading()).toBeFalse();
  });

  it('redirects to /assembly-lines when the route param is not a number', () => {
    setup('not-a-number');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/assembly-lines']);
    expect(lineServiceSpy.getOne).not.toHaveBeenCalled();
  });

  it('reorders the allocated list and persists the new order', () => {
    allocationServiceSpy.reorder.and.returnValue(of({ message: 'Reordered' }));
    const fixture = setup();
    const component = fixture.componentInstance;

    // Move first item (LW) to the end.
    component.drop(makeDropEvent('allocated-list', 'allocated-list', 0, 1));

    expect(component.allocated().map((a) => a.id)).toEqual([101, 100]);
    expect(allocationServiceSpy.reorder).toHaveBeenCalledWith(5, [101, 100]);
  });

  it('adds an allocation when dropping from available to allocated', () => {
    const newAllocation: Allocation = {
      id: 102,
      assemblyLineId: 5,
      workstationId: 3,
      order: 3,
      workstation: frameAssembly,
    };
    allocationServiceSpy.allocate.and.returnValue(of(newAllocation));
    const fixture = setup();
    const component = fixture.componentInstance;

    // Drop Frame assembly (index 0 in available) at the end of allocated (index 2).
    component.drop(makeDropEvent('available-list', 'allocated-list', 0, 2));

    expect(allocationServiceSpy.allocate).toHaveBeenCalledWith(5, 3);
    expect(component.available().length).toBe(0);
    expect(component.allocated().map((a) => a.id)).toEqual([100, 101, 102]);
    // Dropped at the end, so no reorder call is needed.
    expect(allocationServiceSpy.reorder).not.toHaveBeenCalled();
  });

  it('persists order when a new allocation is inserted in the middle', () => {
    const newAllocation: Allocation = {
      id: 102,
      assemblyLineId: 5,
      workstationId: 3,
      order: 3,
      workstation: frameAssembly,
    };
    allocationServiceSpy.allocate.and.returnValue(of(newAllocation));
    allocationServiceSpy.reorder.and.returnValue(of({ message: 'Reordered' }));
    const fixture = setup();
    const component = fixture.componentInstance;

    // Drop Frame assembly at index 0 (before LW and FI).
    component.drop(makeDropEvent('available-list', 'allocated-list', 0, 0));

    expect(component.allocated().map((a) => a.id)).toEqual([102, 100, 101]);
    expect(allocationServiceSpy.reorder).toHaveBeenCalledWith(5, [102, 100, 101]);
  });

  it('removes an allocation when dropping from allocated to available', () => {
    allocationServiceSpy.remove.and.returnValue(of(undefined));
    const fixture = setup();
    const component = fixture.componentInstance;

    component.drop(makeDropEvent('allocated-list', 'available-list', 0, 0));

    expect(allocationServiceSpy.remove).toHaveBeenCalledWith(5, 100);
    expect(component.allocated().map((a) => a.id)).toEqual([101]);
    expect(component.available().map((w) => w.id)).toContain(1);
  });

  it('quickAdd allocates the workstation at the end of the allocated list', () => {
    const newAllocation: Allocation = {
      id: 102,
      assemblyLineId: 5,
      workstationId: 3,
      order: 3,
      workstation: frameAssembly,
    };
    allocationServiceSpy.allocate.and.returnValue(of(newAllocation));
    const fixture = setup();
    const component = fixture.componentInstance;

    component.quickAdd(frameAssembly);

    expect(allocationServiceSpy.allocate).toHaveBeenCalledWith(5, 3);
    expect(component.allocated().map((a) => a.id)).toEqual([100, 101, 102]);
  });

  it('removeViaButton removes the given allocation', () => {
    allocationServiceSpy.remove.and.returnValue(of(undefined));
    const fixture = setup();
    const component = fixture.componentInstance;

    component.removeViaButton(allocationLW);

    expect(allocationServiceSpy.remove).toHaveBeenCalledWith(5, 100);
    expect(component.allocated().map((a) => a.id)).toEqual([101]);
  });

  it('reloads all data when persisting the new order fails', () => {
    allocationServiceSpy.reorder.and.returnValue(throwError(() => new Error('network error')));
    const fixture = setup();
    const component = fixture.componentInstance;
    lineServiceSpy.getOne.calls.reset();

    component.drop(makeDropEvent('allocated-list', 'allocated-list', 0, 1));

    expect(lineServiceSpy.getOne).toHaveBeenCalledWith(5);
    expect(component.saving()).toBeFalse();
  });

  it('ignores same-list drops on the available column (no-op)', () => {
    const fixture = setup();
    const component = fixture.componentInstance;

    component.drop(makeDropEvent('available-list', 'available-list', 0, 0));

    expect(allocationServiceSpy.allocate).not.toHaveBeenCalled();
    expect(allocationServiceSpy.reorder).not.toHaveBeenCalled();
  });
});
