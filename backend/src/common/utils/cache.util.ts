/**
 * Lightweight, type-safe in-memory cache with TTL and bounded capacity.
 * Prevents redundant latency overhead to remote cloud databases (Neon Cloud).
 */
export class MemoryCache<T> {
  private cache = new Map<string, { data: T; expiresAt: number }>();

  constructor(
    private readonly defaultTtlMs: number = 5 * 60 * 1000,
    private readonly maxSize: number = 100,
  ) {}

  get(key: string = '__default__'): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string = '__default__', data: T, ttlMs?: number): void {
    if (this.cache.size >= this.maxSize) {
      this.cache.clear();
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  delete(key: string = '__default__'): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string = '__default__'): boolean {
    return this.get(key) !== null;
  }
}
