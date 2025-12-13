/**
 * Generate a URL-friendly slug from a title
 * Example: "MacBook Pro M3 Max 2023" -> "macbook-pro-m3-max-2023"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending a suffix if needed
 */
export async function ensureUniqueSlug(baseSlug: string, prisma: any, excludeId?: number): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const where: any = { slug };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const existing = await prisma.auction.findUnique({
      where: { slug },
    });

    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
