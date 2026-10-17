// The two scenarios of the original benchmark page (docs/benchmark/index.html). That page compiled one JSX source per
// library with Babel's classic runtime, so every element was built with that library's `createElement`. These are
// the same trees written as `createElement` calls, which is what the JSX compiled to.
import type { Library } from './libraries';

export interface Scenario {
  id: string;
  name: string;
  /** List items that one render produces */
  items: number;
  iterations: number;
  /** Returns the root component, built with the library's `createElement` and hooks */
  createApp(library: Library): unknown;
}

interface Product {
  name: string;
  description: string;
  price: string;
}

// A static tree: a heading, a text block and a list of `items` items, each `<li><b>1</b></li>`, passed to the list
// as separate arguments, as JSX passes static children.
function createElementsApp({ createElement: h }: Library, items: number) {
  return function App() {
    const listItems: unknown[] = [];
    for (let i = 0; i < items; i++) {
      listItems.push(h('li', undefined, h('b', undefined, '1')));
    }

    return h(
      'div',
      undefined,
      h('h2', undefined, 'Title'),
      h('div', undefined, 'Hello world'),
      h('ul', undefined, ...listItems),
    );
  };
}

// A product list: `items` keyed components with props, each rendering a few elements and a nested Button component.
// The root component uses a state hook.
function createComponentsApp({ createElement: h, useState }: Library, items: number) {
  function Button({ onClick, children }: { onClick: () => void; children?: unknown }) {
    return h('button', { onClick }, children);
  }

  function ProductItem({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product) => void }) {
    return h(
      'li',
      { className: 'product' },
      h('h2', undefined, product.name),
      h('p', undefined, product.description),
      h('h3', undefined, product.price),
      h(Button, { onClick: () => onAddToCart(product) }, 'Add to Cart'),
    );
  }

  function ProductList({ products, onAddToCart }: { products: Product[]; onAddToCart: (product: Product) => void }) {
    return h(
      'ul',
      { className: 'product-list' },
      products.map((product, index) => h(ProductItem, { key: index, product, onAddToCart })),
    );
  }

  return function App() {
    const products = Array.from({ length: items }, (_, i): Product => ({
      name: `Product ${i}`,
      description: `Description ${i}`,
      price: `$${i}`,
    }));
    const [cart, setCart] = useState<Product[]>([]);

    const handleAddToCart = (product: Product) => {
      setCart([...cart, product]);
    };

    return h('div', { className: 'app' }, h(ProductList, { products, onAddToCart: handleAddToCart }));
  };
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'elements',
    name: '30K elements',
    items: 30000,
    iterations: 30,
    createApp: (library) => createElementsApp(library, 30000),
  },
  {
    id: 'components',
    name: '10K components',
    items: 10000,
    iterations: 50,
    createApp: (library) => createComponentsApp(library, 10000),
  },
];
