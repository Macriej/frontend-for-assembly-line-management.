import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { WorkstationsComponent } from './workstations.component';
import { WorkstationService } from '../../core/services/workstation.service';
import { Workstation } from '../../core/models/workstation.model';

describe('WorkstationsComponent', () => {
  let workstationServiceSpy: jasmine.SpyObj<WorkstationService>;

  const sampleWorkstations: Workstation[] = [
    { id: 1, shortName: 'LW', name: 'Laser welding', pcName: 'PC-LW-01', count: { allocations: 3 } },
    { id: 2, shortName: 'FI', name: 'Final inspection', pcName: 'PC-FI-01', count: { allocations: 0 } },
  ];

  function setup() {
    TestBed.configureTestingModule({
      imports: [WorkstationsComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [{ provide: WorkstationService, useValue: workstationServiceSpy }],
    });
    const fixture = TestBed.createComponent(WorkstationsComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    workstationServiceSpy = jasmine.createSpyObj('WorkstationService', [
      'list',
      'create',
      'update',
      'remove',
    ]);
    workstationServiceSpy.list.and.returnValue(of(sampleWorkstations));
  });

  it('loads workstations on init', () => {
    const fixture = setup();

    expect(workstationServiceSpy.list).toHaveBeenCalled();
    expect(fixture.componentInstance.workstations()).toEqual(sampleWorkstations);
  });

  it('creates a workstation on submit', () => {
    workstationServiceSpy.create.and.returnValue(of(sampleWorkstations[0]));
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({ shortName: 'DA', name: 'Drive assembly', pcName: 'PC-DA-01' });
    component.onSubmit();

    expect(workstationServiceSpy.create).toHaveBeenCalledWith({
      shortName: 'DA',
      name: 'Drive assembly',
      pcName: 'PC-DA-01',
    });
  });

  it('populates the form and updates on edit + submit', () => {
    workstationServiceSpy.update.and.returnValue(of(sampleWorkstations[0]));
    const fixture = setup();
    const component = fixture.componentInstance;

    component.edit(sampleWorkstations[0]);
    expect(component.form.value).toEqual({
      shortName: 'LW',
      name: 'Laser welding',
      pcName: 'PC-LW-01',
    });

    component.onSubmit();
    expect(workstationServiceSpy.update).toHaveBeenCalledWith(1, {
      shortName: 'LW',
      name: 'Laser welding',
      pcName: 'PC-LW-01',
    });
  });

  it('warns about existing allocations before deleting', () => {
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    const fixture = setup();

    fixture.componentInstance.remove(sampleWorkstations[0]);

    expect(confirmSpy).toHaveBeenCalledWith(jasmine.stringMatching(/3 allocation/));
    expect(workstationServiceSpy.remove).not.toHaveBeenCalled();
  });

  it('does not fail to save when the server returns no message', () => {
    workstationServiceSpy.create.and.returnValue(throwError(() => ({})));
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({ shortName: 'X', name: 'X', pcName: 'X' });
    expect(() => component.onSubmit()).not.toThrow();
    expect(component.saving()).toBeFalse();
  });
});
