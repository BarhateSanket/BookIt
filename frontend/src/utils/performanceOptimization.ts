import React from 'react';

// Performance monitoring utility
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startTimer(label: string): void {
    performance.mark(`${label}-start`);
  }

  static endTimer(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0] as PerformanceMeasure;
    const duration = measure.duration;
    
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);
    
    // Clean up
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
    
    return duration;
  }

  static getAverageTime(label: string): number {
    const times = this.metrics.get(label) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  static getMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    for (const [label, times] of this.metrics.entries()) {
      result[label] = {
        average: times.reduce((a, b) => a + b, 0) / times.length,
        count: times.length,
        latest: times[times.length - 1]
      };
    }
    
    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Debounce hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for scroll events
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = React.useRef(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Bundle optimization helper
export const preloadComponent = (importFunc: () => Promise<{ default: React.ComponentType<any> }>) => {
  // Preload component in background
  importFunc().catch(() => {
    // Silent fail for preloading
  });
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100
    };
  }
  return null;
};

// Performance observer for monitoring
export const setupPerformanceObserver = (callback: (entry: PerformanceEntry) => void) => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry);
      }
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    return observer;
  }
  return null;
};

// Image lazy loading with intersection observer
export class LazyImageLoader {
  private static observer: IntersectionObserver | null = null;

  static init() {
    if (!this.observer && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                this.observer!.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }
  }

  static observe(img: HTMLImageElement) {
    this.init();
    if (this.observer) {
      this.observer.observe(img);
    }
  }

  static disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Code splitting utility
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> => {
  return React.lazy(importFunc);
};

// Bundle analyzer helper
export const getBundleSize = async (): Promise<{ size: number; chunks: number }> => {
  try {
    const response = await fetch('/static/js/manifest.json');
    if (!response.ok) {
      return { size: 0, chunks: 0 };
    }
    
    const manifest = await response.json();
    const chunks = Object.keys(manifest).filter(key => key.startsWith('chunk-'));
    const size = chunks.length; // Simplified size calculation
    
    return { size, chunks: chunks.length };
  } catch {
    return { size: 0, chunks: 0 };
  }
};

// Virtual scrolling calculation utilities
export const calculateVisibleItems = (
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number
) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 1;
  const endIndex = Math.min(startIndex + visibleCount, totalItems - 1);
  
  return { startIndex, endIndex, visibleCount };
};

// Component memoization helpers
export const createMemoizedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return React.memo(Component, areEqual);
};

// Database query optimization utilities
export class QueryOptimizer {
  private static queryCache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.CACHE_TTL
  ): Promise<T> {
    const cached = this.queryCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await queryFn();
    this.queryCache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  static invalidateCache(pattern?: string) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  static getCacheStats() {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys())
    };
  }
}

// Network optimization utilities
export class NetworkOptimizer {
  private static requestCache = new Map<string, Promise<any>>();

  static async requestWithDeduplication<T>(
    url: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.requestCache.has(url)) {
      return this.requestCache.get(url)!;
    }

    const promise = requestFn()
      .finally(() => {
        this.requestCache.delete(url);
      });

    this.requestCache.set(url, promise);
    return promise;
  }

  static clearRequestCache() {
    this.requestCache.clear();
  }
}