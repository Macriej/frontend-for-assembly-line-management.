export interface Product {
  id: number;
  name: string;
  _count?: { assemblyLines: number };
}

export interface ProductInput {
  name: string;
}
