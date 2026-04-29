import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';

export type ToolContext = {
  userId: string | null;
  userRole: 'USER' | 'ADMIN' | null;
};

export type ClientAction =
  | { type: 'navigate'; path: string }
  | { type: 'cart_update' }
  | { type: 'open_checkout'; url: string };

export type ToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
  clientAction?: ClientAction;
};

export const toolDefinitions = [
  {
    type: 'function' as const,
    function: {
      name: 'searchProducts',
      description:
        'Search the product catalog by free-text query, optional category, and optional price range. Returns up to 10 matching products with id, name, price, category, stock, image, and rating. Use this whenever the user asks to find / show / suggest products.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Free-text keywords (e.g. "running shoes", "iphone case"). Optional.',
          },
          category: { type: 'string', description: 'Exact category name. Optional.' },
          minPrice: { type: 'number', description: 'Minimum price in USD.' },
          maxPrice: { type: 'number', description: 'Maximum price in USD.' },
          sort: {
            type: 'string',
            enum: ['price_asc', 'price_desc', 'newest', 'rating'],
            description: 'Sort order. Default: newest.',
          },
          limit: { type: 'number', description: 'Max results. Default 8, max 10.' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getProductById',
      description: 'Fetch full details of a single product by its id. Use after searchProducts when the user asks for more info about a specific item.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Product id (cuid).' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getRecommendations',
      description: 'Recommend products similar to a given product, or based on a free-text description. Use when user says "suggest me something like X".',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'Anchor product id. Optional.' },
          query: { type: 'string', description: 'Free-text seed (e.g. "iPhone"). Optional.' },
          limit: { type: 'number', description: 'Max results. Default 5.' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getCart',
      description: 'Get the current authenticated user\'s cart with items, quantities, and total. Requires login.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'addToCart',
      description: 'Add a product to the authenticated user\'s cart. Requires login. After calling this, the cart UI is auto-refreshed.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'number', description: 'Default 1.' },
        },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'updateCartQuantity',
      description: 'Change the quantity of an existing cart line item. Requires login.',
      parameters: {
        type: 'object',
        properties: {
          itemId: { type: 'string', description: 'CartItem id.' },
          quantity: { type: 'number', description: 'New quantity (>=1).' },
        },
        required: ['itemId', 'quantity'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'removeFromCart',
      description: 'Remove an item from the cart. You may pass either the cart line itemId, or the productId (the matching line will be resolved). Requires login.',
      parameters: {
        type: 'object',
        properties: {
          itemId: { type: 'string', description: 'CartItem id (preferred).' },
          productId: { type: 'string', description: 'Or product id.' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'clearCart',
      description: 'Remove ALL items from the user\'s cart. Confirm with the user before calling this.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getOrders',
      description: 'List the authenticated user\'s recent orders, with status and totals. Requires login.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Default 5.' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getOrderById',
      description: 'Fetch a single order by id, including line items and shipping address. Requires login (only the owner can view).',
      parameters: {
        type: 'object',
        properties: { orderId: { type: 'string' } },
        required: ['orderId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'navigate',
      description: 'Navigate the user to an internal page. Use for "go to cart", "show orders", "open product page", etc. Allowed paths: /, /products, /products?category=X, /product/:id, /cart, /checkout, /orders, /orders/:id, /login, /register.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Internal path starting with "/".' },
        },
        required: ['path'],
      },
    },
  },
];

const ALLOWED_NAV = [
  /^\/$/,
  /^\/products(\?.*)?$/,
  /^\/product\/[\w-]+$/,
  /^\/cart$/,
  /^\/checkout$/,
  /^\/orders$/,
  /^\/orders\/[\w-]+$/,
  /^\/login$/,
  /^\/register$/,
];

function requireAuth(ctx: ToolContext): ToolResult | null {
  if (!ctx.userId) {
    return {
      ok: false,
      error: 'AUTH_REQUIRED',
      data: { message: 'Please log in to use this feature.' },
      clientAction: { type: 'navigate', path: '/login' },
    };
  }
  return null;
}

function shapeProduct(p: { id: string; name: string; price: number; category: string; stock: number; description: string; rating: number; images: string }) {
  const imgs = parseImages(p.images);
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    stock: p.stock,
    description: p.description.length > 220 ? p.description.slice(0, 217) + '...' : p.description,
    rating: p.rating,
    image: imgs[0] ?? null,
    url: `/product/${p.id}`,
  };
}

async function searchProducts(args: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
  limit?: number;
}): Promise<ToolResult> {
  const limit = Math.min(Math.max(args.limit ?? 8, 1), 10);
  const where: Prisma.ProductWhereInput = {};
  if (args.category) where.category = args.category;
  if (args.query) {
    where.OR = [
      { name: { contains: args.query, mode: 'insensitive' } },
      { description: { contains: args.query, mode: 'insensitive' } },
      { category: { contains: args.query, mode: 'insensitive' } },
    ];
  }
  if (args.minPrice != null || args.maxPrice != null) {
    where.price = {
      ...(args.minPrice != null ? { gte: args.minPrice } : {}),
      ...(args.maxPrice != null ? { lte: args.maxPrice } : {}),
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    args.sort === 'price_asc'
      ? { price: 'asc' }
      : args.sort === 'price_desc'
      ? { price: 'desc' }
      : args.sort === 'rating'
      ? { rating: 'desc' }
      : { createdAt: 'desc' };

  const products = await prisma.product.findMany({ where, orderBy, take: limit });
  return {
    ok: true,
    data: {
      count: products.length,
      products: products.map(shapeProduct),
    },
  };
}

async function getProductById(args: { id: string }): Promise<ToolResult> {
  if (!args.id) return { ok: false, error: 'id is required' };
  const product = await prisma.product.findUnique({
    where: { id: args.id },
    include: { reviews: { select: { rating: true } } },
  });
  if (!product) return { ok: false, error: 'Product not found' };
  const reviewCount = product.reviews.length;
  const avgRating =
    reviewCount > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      : 0;
  return {
    ok: true,
    data: {
      ...shapeProduct(product),
      description: product.description,
      reviewCount,
      rating: avgRating,
    },
  };
}

async function getRecommendations(args: {
  productId?: string;
  query?: string;
  limit?: number;
}): Promise<ToolResult> {
  const limit = Math.min(args.limit ?? 5, 10);

  if (args.productId) {
    const anchor = await prisma.product.findUnique({ where: { id: args.productId } });
    if (!anchor) return { ok: false, error: 'Anchor product not found' };
    const similar = await prisma.product.findMany({
      where: {
        id: { not: anchor.id },
        category: anchor.category,
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });
    return {
      ok: true,
      data: {
        anchor: shapeProduct(anchor),
        recommendations: similar.map(shapeProduct),
      },
    };
  }

  if (args.query) {
    const matches = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: args.query, mode: 'insensitive' } },
          { description: { contains: args.query, mode: 'insensitive' } },
          { category: { contains: args.query, mode: 'insensitive' } },
        ],
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });
    return { ok: true, data: { recommendations: matches.map(shapeProduct) } };
  }

  const trending = await prisma.product.findMany({
    orderBy: { rating: 'desc' },
    take: limit,
  });
  return { ok: true, data: { recommendations: trending.map(shapeProduct) } };
}

async function getCart(ctx: ToolContext): Promise<ToolResult> {
  const guard = requireAuth(ctx);
  if (guard) return guard;
  const cart = await prisma.cart.findUnique({
    where: { userId: ctx.userId! },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) {
    return { ok: true, data: { items: [], total: 0, itemCount: 0 } };
  }
  const items = cart.items.map((item) => ({
    itemId: item.id,
    productId: item.productId,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    lineTotal: item.product.price * item.quantity,
    image: parseImages(item.product.images)[0] ?? null,
    stock: item.product.stock,
  }));
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  return { ok: true, data: { items, total, itemCount } };
}

async function addToCart(
  ctx: ToolContext,
  args: { productId: string; quantity?: number }
): Promise<ToolResult> {
  const guard = requireAuth(ctx);
  if (guard) return guard;
  const quantity = args.quantity ?? 1;
  if (!args.productId) return { ok: false, error: 'productId is required' };
  if (quantity < 1) return { ok: false, error: 'quantity must be >= 1' };

  const product = await prisma.product.findUnique({ where: { id: args.productId } });
  if (!product) return { ok: false, error: 'Product not found' };

  const cart =
    (await prisma.cart.findUnique({ where: { userId: ctx.userId! } })) ??
    (await prisma.cart.create({ data: { userId: ctx.userId! } }));

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
  });

  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty > product.stock) {
    return {
      ok: false,
      error: 'INSUFFICIENT_STOCK',
      data: { message: `Only ${product.stock} of "${product.name}" in stock.`, available: product.stock },
    };
  }

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity } });
  }

  return {
    ok: true,
    data: { message: `Added ${quantity} × ${product.name} to cart.`, productId: product.id, quantity: newQty },
    clientAction: { type: 'cart_update' },
  };
}

async function updateCartQuantity(
  ctx: ToolContext,
  args: { itemId: string; quantity: number }
): Promise<ToolResult> {
  const guard = requireAuth(ctx);
  if (guard) return guard;
  if (args.quantity < 1) return { ok: false, error: 'quantity must be >= 1' };

  const item = await prisma.cartItem.findUnique({
    where: { id: args.itemId },
    include: { cart: true, product: true },
  });
  if (!item || item.cart.userId !== ctx.userId) {
    return { ok: false, error: 'Cart item not found' };
  }
  if (args.quantity > item.product.stock) {
    return {
      ok: false,
      error: 'INSUFFICIENT_STOCK',
      data: { available: item.product.stock },
    };
  }

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: args.quantity } });
  return {
    ok: true,
    data: { message: `Updated ${item.product.name} to qty ${args.quantity}.` },
    clientAction: { type: 'cart_update' },
  };
}

async function removeFromCart(
  ctx: ToolContext,
  args: { itemId?: string; productId?: string }
): Promise<ToolResult> {
  const guard = requireAuth(ctx);
  if (guard) return guard;

  type ItemWithRelations = Prisma.CartItemGetPayload<{
    include: { cart: true; product: true };
  }>;
  let item: ItemWithRelations | null = null;
  if (args.itemId) {
    item = await prisma.cartItem.findUnique({
      where: { id: args.itemId },
      include: { cart: true, product: true },
    });
  } else if (args.productId) {
    item = await prisma.cartItem.findFirst({
      where: { productId: args.productId, cart: { userId: ctx.userId! } },
      include: { cart: true, product: true },
    });
  } else {
    return { ok: false, error: 'itemId or productId is required' };
  }
  if (!item || item.cart.userId !== ctx.userId) {
    return { ok: false, error: 'Cart item not found' };
  }

  await prisma.cartItem.delete({ where: { id: item.id } });
  return {
    ok: true,
    data: { message: `Removed ${item.product.name} from cart.` },
    clientAction: { type: 'cart_update' },
  };
}

async function clearCart(ctx: ToolContext): Promise<ToolResult> {
  const guard = requireAuth(ctx);
  if (guard) return guard;
  const cart = await prisma.cart.findUnique({ where: { userId: ctx.userId! } });
  if (!cart) return { ok: true, data: { message: 'Cart is already empty.' } };
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return {
    ok: true,
    data: { message: 'Cart cleared.' },
    clientAction: { type: 'cart_update' },
  };
}

async function getOrders(ctx: ToolContext, args: { limit?: number }): Promise<ToolResult> {
  const guard = requireAuth(ctx);
  if (guard) return guard;
  const take = Math.min(args.limit ?? 5, 20);
  const orders = await prisma.order.findMany({
    where: { userId: ctx.userId! },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
    take,
  });
  return {
    ok: true,
    data: {
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        items: o.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.price,
        })),
        url: `/orders/${o.id}`,
      })),
    },
  };
}

async function getOrderById(ctx: ToolContext, args: { orderId: string }): Promise<ToolResult> {
  const guard = requireAuth(ctx);
  if (guard) return guard;
  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order || order.userId !== ctx.userId) {
    return { ok: false, error: 'Order not found' };
  }
  return {
    ok: true,
    data: {
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      shipping: {
        street: order.shippingStreet,
        city: order.shippingCity,
        state: order.shippingState,
        zip: order.shippingZip,
        country: order.shippingCountry,
      },
      items: order.items.map((i) => ({
        productId: i.productId,
        name: i.product.name,
        quantity: i.quantity,
        price: i.price,
        lineTotal: i.price * i.quantity,
      })),
      url: `/orders/${order.id}`,
    },
  };
}

function navigate(args: { path: string }): ToolResult {
  if (!args.path || !args.path.startsWith('/')) {
    return { ok: false, error: 'Invalid path; must start with "/"' };
  }
  if (!ALLOWED_NAV.some((re) => re.test(args.path))) {
    return { ok: false, error: 'Path not allowed' };
  }
  return {
    ok: true,
    data: { message: `Navigating to ${args.path}` },
    clientAction: { type: 'navigate', path: args.path },
  };
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'searchProducts':
        return await searchProducts(args as Parameters<typeof searchProducts>[0]);
      case 'getProductById':
        return await getProductById(args as Parameters<typeof getProductById>[0]);
      case 'getRecommendations':
        return await getRecommendations(args as Parameters<typeof getRecommendations>[0]);
      case 'getCart':
        return await getCart(ctx);
      case 'addToCart':
        return await addToCart(ctx, args as Parameters<typeof addToCart>[1]);
      case 'updateCartQuantity':
        return await updateCartQuantity(ctx, args as Parameters<typeof updateCartQuantity>[1]);
      case 'removeFromCart':
        return await removeFromCart(ctx, args as Parameters<typeof removeFromCart>[1]);
      case 'clearCart':
        return await clearCart(ctx);
      case 'getOrders':
        return await getOrders(ctx, args as Parameters<typeof getOrders>[1]);
      case 'getOrderById':
        return await getOrderById(ctx, args as Parameters<typeof getOrderById>[1]);
      case 'navigate':
        return navigate(args as Parameters<typeof navigate>[0]);
      default:
        return { ok: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    console.error(`Tool ${name} failed:`, err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Tool execution failed',
    };
  }
}
