import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// import dotenv from 'dotenv'
// dotenv.config()

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Add a PostgreSQL connection string to your .env file.',
  );
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const sampleCategories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: 'Smartphone',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
    description: 'Phones, audio, wearables and smart gadgets.',
    sortOrder: 1,
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    icon: 'Shirt',
    image:
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400',
    description: 'Apparel, bags and accessories for every season.',
    sortOrder: 2,
  },
  {
    name: 'Books',
    slug: 'books',
    icon: 'BookOpen',
    image:
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
    description: 'Bestsellers, classics and reference titles.',
    sortOrder: 3,
  },
  {
    name: 'Home',
    slug: 'home',
    icon: 'Sofa',
    image:
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400',
    description: 'Decor, kitchen and living essentials.',
    sortOrder: 4,
  },
  {
    name: 'Sports',
    slug: 'sports',
    icon: 'Dumbbell',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
    description: 'Fitness gear, outdoor and athletic supplies.',
    sortOrder: 5,
  },
];

const sampleProducts = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description:
      'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio.',
    price: 249.99,
    category: 'Electronics',
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    ],
  },
  {
    name: 'Smart Fitness Watch',
    description:
      'Track your heart rate, sleep, and workouts with this water-resistant smart watch.',
    price: 179.0,
    category: 'Electronics',
    stock: 40,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    ],
  },
  {
    name: 'Classic Cotton T-Shirt',
    description: 'Soft, breathable, and built to last. Available in multiple colors.',
    price: 24.99,
    category: 'Clothing',
    stock: 120,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
    ],
  },
  {
    name: 'Leather Weekend Bag',
    description: 'Hand-stitched full-grain leather bag, perfect for short trips.',
    price: 329.0,
    category: 'Clothing',
    stock: 15,
    images: [
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600',
    ],
  },
  {
    name: 'The Art of Programming',
    description: 'A comprehensive guide to writing clean, maintainable software.',
    price: 39.95,
    category: 'Books',
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
    ],
  },
  {
    name: 'Modern Ceramic Vase',
    description: 'Minimalist ceramic vase that suits any interior.',
    price: 49.0,
    category: 'Home',
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600',
    ],
  },
  {
    name: 'Yoga Mat Pro',
    description: 'Eco-friendly, non-slip yoga mat with carrying strap.',
    price: 59.99,
    category: 'Sports',
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600',
    ],
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Insulated bottle that keeps drinks cold for 24 hours.',
    price: 29.5,
    category: 'Sports',
    stock: 80,
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600',
    ],
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@nexcart.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234';
  const userEmail = process.env.SEED_USER_EMAIL ?? 'user@nexcart.local';
  const userPassword = process.env.SEED_USER_PASSWORD ?? 'user1234';

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', password: adminHash, isActive: true },
    create: {
      email: adminEmail,
      name: 'Admin',
      password: adminHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const userHash = await bcrypt.hash(userPassword, 10);
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: { password: userHash, isActive: true },
    create: {
      email: userEmail,
      name: 'Demo User',
      password: userHash,
      role: 'USER',
      isActive: true,
    },
  });

  for (const c of sampleCategories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }

  for (const p of sampleProducts) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...p, images: JSON.stringify(p.images) },
      });
    } else {
      await prisma.product.create({
        data: { ...p, images: JSON.stringify(p.images) },
      });
    }
  }

  console.log('Seed complete.');
  console.log(`Admin: ${admin.email} / ${adminPassword}`);
  console.log(`User:  ${user.email} / ${userPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
