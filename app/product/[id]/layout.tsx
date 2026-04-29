import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { parseImages } from '@/lib/utils/images';

// OG description limit on Facebook is ~200 chars before truncation.
const OG_DESCRIPTION_MAX = 200;

// Falls back to localhost in dev. Set NEXT_PUBLIC_APP_URL in production so
// crawlers see absolute URLs and resolve any relative image paths correctly.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  // Cut at a word boundary when possible to avoid mid-word ellipsis.
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd() + '…';
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;

  // Narrow the read to fields needed for OG to keep this off the hot path.
  const product = await prisma.product
    .findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        images: true,
        aiImageUrl: true,
      },
    })
    .catch(() => null);

  if (!product) {
    return {
      title: 'Product Not Found · NexCart',
      description: 'This product does not exist or is no longer available.',
      robots: { index: false, follow: false },
    };
  }

  const images = parseImages(product.images);
  const primaryImage = images[0] ?? product.aiImageUrl ?? null;

  const productUrl = `${SITE_URL.replace(/\/+$/, '')}/product/${id}`;
  const ogTitle = product.name;
  const ogDescription = truncate(product.description, OG_DESCRIPTION_MAX);

  return {
    metadataBase: new URL(SITE_URL),
    title: ogTitle,
    description: ogDescription,
    alternates: { canonical: productUrl },
    openGraph: {
      type: 'website',
      url: productUrl,
      siteName: 'NexCart',
      title: ogTitle,
      description: ogDescription,
      images: primaryImage
        ? [
            {
              url: primaryImage,
              width: 1200,
              height: 1200,
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: primaryImage ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription,
      images: primaryImage ? [primaryImage] : undefined,
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
