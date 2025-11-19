import React from 'react';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onEndReached,
  onEndReachedThreshold = 0.8
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan;
  
  const startIndex = React.useMemo(() => {
    const index = Math.floor(scrollTop / itemHeight);
    return Math.max(0, index - overscan);
  }, [scrollTop, itemHeight, overscan]);
  
  const endIndex = React.useMemo(() => {
    const index = startIndex + visibleCount;
    return Math.min(index, items.length - 1);
  }, [startIndex, visibleCount, items.length]);

  const visibleItems = React.useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    // Check if we've reached the end
    if (onEndReached) {
      const scrollHeight = e.currentTarget.scrollHeight;
      const clientHeight = e.currentTarget.clientHeight;
      const scrollPercentage = (newScrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage >= onEndReachedThreshold) {
        onEndReached();
      }
    }
  };

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className} h-[${containerHeight}px]`}
      onScroll={handleScroll}
    >
      <div className={`relative h-[${totalHeight}px]`}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            className={`absolute left-0 right-0 top-[${(startIndex + index) * itemHeight}px] h-[${itemHeight}px]`}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Virtual grid component for experiences
interface ExperienceVirtualGridProps {
  experiences: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    image: string;
    category: string;
    rating?: number;
    duration?: string;
    location?: string;
  }>;
  onBook: (id: string) => void;
  onExperienceClick?: (id: string) => void;
  className?: string;
  columns?: number;
  gap?: number;
}

export function ExperienceVirtualGrid({
  experiences,
  onBook,
  onExperienceClick,
  className = '',
  columns = 3,
  gap = 16
}: ExperienceVirtualGridProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = React.useState(600);
  const [itemWidth, setItemWidth] = React.useState(0);

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setItemWidth((width - (gap * (columns - 1))) / columns);
        setContainerHeight(window.innerHeight - 200); // Account for header/footer
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [columns, gap]);

  const itemHeight = itemWidth * 1.2; // Approximate aspect ratio

  const renderExperience = (experience: any, index: number) => {
    return (
      <div
        key={experience.id}
        className={`w-[${itemWidth}px] h-[${itemHeight}px] ${index % columns === columns - 1 ? '' : `mr-[${gap}px]`} mb-[${gap}px]`}
      >
        <div
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
          onClick={() => onExperienceClick?.(experience.id)}
        >
          <div className="relative h-2/3 overflow-hidden">
            <img
              src={experience.image}
              alt={experience.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {experience.rating && (
              <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                ★ {experience.rating.toFixed(1)}
              </div>
            )}
          </div>
          
          <div className="p-3 h-1/3 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">
                {experience.title}
              </h3>
              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                {experience.description}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold text-blue-600">
                ${experience.price}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onBook(experience.id);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
              >
                Book
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={className}>
      <VirtualScroll
        items={experiences}
        itemHeight={itemHeight + gap}
        containerHeight={containerHeight}
        renderItem={renderExperience}
        className="relative"
      />
    </div>
  );
}

// Optimized infinite scroll hook
interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  threshold = 0.8
}: UseInfiniteScrollOptions) {
  const [isFetching, setIsFetching] = React.useState(false);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage >= threshold && !loading && hasMore && !isFetching) {
      setIsFetching(true);
      onLoadMore();
    }
  }, [threshold, loading, hasMore, onLoadMore, isFetching]);

  React.useEffect(() => {
    if (!loading && isFetching) {
      setIsFetching(false);
    }
  }, [loading, isFetching]);

  return {
    handleScroll,
    isFetching
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const startTime = React.useRef<number>();

  React.useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const endTime = performance.now();
        const renderTime = endTime - startTime.current;
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  return {
    startTimer: (label: string) => {
      performance.mark(`${componentName}-${label}-start`);
    },
    endTimer: (label: string) => {
      performance.mark(`${componentName}-${label}-end`);
      performance.measure(`${componentName}-${label}`, `${componentName}-${label}-start`, `${componentName}-${label}-end`);
      
      const measure = performance.getEntriesByName(`${componentName}-${label}`)[0] as PerformanceMeasure;
      console.log(`${componentName} ${label}: ${measure.duration.toFixed(2)}ms`);
      
      performance.clearMarks(`${componentName}-${label}-start`);
      performance.clearMarks(`${componentName}-${label}-end`);
      performance.clearMeasures(`${componentName}-${label}`);
    }
  };
}