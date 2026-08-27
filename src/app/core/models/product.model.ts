export interface Product {
  id: number;
  name: string;
  count?: { assemblyLines: number };
}

export interface ProductInput {
  name: string;
}
