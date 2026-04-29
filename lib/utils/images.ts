export function parseImages(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeImages(value: string[] | undefined): string {
  return JSON.stringify(value ?? []);
}

type ProductLike = { images: string };
export function withParsedImages<T extends ProductLike>(product: T): Omit<T, 'images'> & { images: string[] } {
  return { ...product, images: parseImages(product.images) };
}
