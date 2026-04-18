import { useState, useEffect } from 'react';
import api from '@/lib/api';

const STORAGE_KEY = 'recently_viewed';
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    Promise.all(ids.map((id: number) => api.get(`/products/${id}`)))
      .then(responses => setProducts(responses.map(r => r.data)))
      .finally(() => setLoading(false));
  }, []);

  const addProduct = (productId: number) => {
    const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newIds = [productId, ...ids.filter((id: number) => id !== productId)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
  };

  return { products, loading, addProduct };
}