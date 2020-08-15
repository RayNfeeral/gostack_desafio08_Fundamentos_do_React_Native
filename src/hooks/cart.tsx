import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem(
        '@GoMarketplace:CartProducts',
      );

      if (response) {
        const cartProducts: Product[] = JSON.parse(response);

        setProducts(state => cartProducts);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productToIncrement = products.find(product => product.id === id);

      if (productToIncrement) {
        productToIncrement.quantity += 1;
        setProducts(state =>
          state.map(product =>
            product.id === productToIncrement.id ? productToIncrement : product,
          ),
        );
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:CartProducts',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const isInCart = products.find(item => item.id === product.id);

      if (!isInCart) {
        const productToBeAdded = { ...product, quantity: 1 };
        setProducts(state => [...state, productToBeAdded]);
        await AsyncStorage.setItem(
          '@GoMarketplace:CartProducts',
          JSON.stringify(products),
        );
        return;
      }

      increment(product.id);
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const productToDecrement = products.find(product => product.id === id);

      if (productToDecrement) {
        productToDecrement.quantity -= 1;
        if (productToDecrement.quantity > 0) {
          setProducts(state =>
            state.map(product =>
              product.id === productToDecrement.id
                ? productToDecrement
                : product,
            ),
          );
        } else {
          setProducts(state =>
            state.filter(product => product.id !== productToDecrement.id),
          );
        }

        await AsyncStorage.setItem(
          '@GoMarketplace:CartProducts',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
