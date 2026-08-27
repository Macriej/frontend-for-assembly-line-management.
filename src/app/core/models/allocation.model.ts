import { Workstation } from './workstation.model';

export interface Allocation {
  id: number;
  assemblyLineId: number;
  workstationId: number;
  order: number;
  workstation: Workstation;
}
