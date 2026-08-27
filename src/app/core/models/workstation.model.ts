export interface Workstation {
  id: number;
  shortName: string;
  name: string;
  pcName: string;
  _count?: { allocations: number };
}

export interface WorkstationInput {
  shortName: string;
  name: string;
  pcName: string;
}
