import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: number;        // Primary identifier
  title: string;
  price: number;
  wholesale_price?: number;
  image?: string;
  quantity: number;
  supplier_id: number;
  supplier_name: string;
  max_qty?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getItemsBySupplier: () => Record<number, CartItem[]>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const { items } = get();
        const existing = items.find(i => i.product_id === item.product_id);
        
        if (existing) {
          const newQty = existing.quantity + quantity;
          if (item.max_qty && newQty > item.max_qty) return;
          set({
            items: items.map(i =>
              i.product_id === item.product_id
                ? { ...i, quantity: newQty }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.product_id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map(i =>
            i.product_id === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemsBySupplier: () => {
        return get().items.reduce((acc, item) => {
          if (!acc[item.supplier_id]) acc[item.supplier_id] = [];
          acc[item.supplier_id].push(item);
          return acc;
        }, {} as Record<number, CartItem[]>);
      },
    }),
    { name: 'cart-storage' }
  )
);