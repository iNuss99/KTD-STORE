/**
 * Utility functions for Category management
 */

/**
 * Generate a clean SEO-friendly slug from a Vietnamese category name
 * e.g., "Áo Sơ Mi Nam" -> "ao-so-mi-nam"
 */
export function generateSlugFromCategoryName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
