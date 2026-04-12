import api from '../api';

export interface Supplier {
  id: number;
  business_name: string;
  address: string | null;
}

export interface Product {
  id: number;
  supplier_id: number;
  title: string;
  description: string | null;
  wholesale_price: number;
  retail_price: number;
  stock_qty: number;
  images: string[];
  variants: any;
  status: string;
  supplier: Supplier;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  data: Product[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export const getProducts = async (params?: {
  search?: string;
  supplier_id?: number;
  page?: number;
}): Promise<ProductListResponse> => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const getProduct = async (id: number): Promise<{ data: Product }> => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};