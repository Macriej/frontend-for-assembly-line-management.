export interface Workstation {
  id: number;
  shortName: string;
  name: string;
  pcName: string;
  count?: { allocations: number };
}

export interface WorkstationInput {
  shortName: string;
  name: string;
  pcName: string;
}
