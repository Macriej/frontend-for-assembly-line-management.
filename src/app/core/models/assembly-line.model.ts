import { Product } from './product.model';
import { Allocation } from './allocation.model';

export interface AssemblyLine {
  id: number;
  name: string;
  active: boolean;
  productId: number;
  product?: Product;
}

export interface AssemblyLineInput {
  name: string;
  active: boolean;
  productId: number;
}

// Kształt zwracany przez GET /api/assembly-lines/:id - zawiera alokacje
// posortowane po "order", z zagnieżdżoną stacją roboczą.
export interface AssemblyLineDetail extends AssemblyLine {
  allocations: Allocation[];
}
