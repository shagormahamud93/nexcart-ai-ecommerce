import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';

export type LiveContext = {
  cart: {
    itemCount: number;
    total: number;
    topItems: Array<{ name: string; quantity: number; productId: string }>;
  } | null;
  categories: string[];
  currentProduct: {
    id: string;
    name: string;
    price: number;
    category: string;
    inStock: boolean;
    image: string | null;
  } | null;
};

const PRODUCT_PATH = /^\/product\/([\w-]+)$/;

export async function buildLiveContext(opts: {
  userId: string | null;
  currentPath?: string | null;
}): Promise<LiveContext> {
  const [cart, categories, currentProduct] = await Promise.all([
    opts.userId ? loadCartSnapshot(opts.userId) : Promise.resolve(null),
    loadCategories(),
    loadCurrentProduct(opts.currentPath ?? null),
  ]);

  return { cart, categories, currentProduct };
}

async function loadCartSnapshot(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) return null;

  const items = cart.items.map((it) => ({
    productId: it.productId,
    name: it.product.name,
    quantity: it.quantity,
    lineTotal: it.product.price * it.quantity,
  }));
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return {
    itemCount,
    total,
    topItems: items
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 4)
      .map(({ name, quantity, productId }) => ({ name, quantity, productId })),
  };
}

async function loadCategories() {
  const rows = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
    take: 24,
    orderBy: { category: 'asc' },
  });
  return rows.map((r) => r.category).filter(Boolean);
}

async function loadCurrentProduct(path: string | null) {
  if (!path) return null;
  const m = path.match(PRODUCT_PATH);
  if (!m) return null;
  const product = await prisma.product.findUnique({ where: { id: m[1] } });
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    inStock: product.stock > 0,
    image: parseImages(product.images)[0] ?? null,
  };
}

export function describePageContext(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path === '/') return 'home page';
  if (path === '/products') return 'product catalog';
  if (path.startsWith('/products?')) return 'filtered product catalog';
  if (PRODUCT_PATH.test(path)) return 'a product detail page';
  if (path === '/cart') return 'their cart';
  if (path === '/checkout') return 'checkout';
  if (path === '/orders') return 'their order history';
  if (/^\/orders\/[\w-]+$/.test(path)) return 'a specific order';
  if (path === '/login') return 'login';
  if (path === '/register') return 'registration';
  return path;
}
