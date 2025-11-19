import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animated?: boolean;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animated = true
}: SkeletonProps) {
  const baseClasses = `bg-gray-200 dark:bg-gray-700 ${animated ? 'animate-pulse' : ''}`;
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded'
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]} ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            } ${width ? `w-[${typeof width === 'number' ? `${width}px` : width}]` : ''} ${height ? `h-[${typeof height === 'number' ? `${height}px` : height}]` : ''}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${width ? `w-[${typeof width === 'number' ? `${width}px` : width}]` : ''} ${height ? `h-[${typeof height === 'number' ? `${height}px` : height}]` : ''}`}
    />
  );
}

// Skeleton for Experience Cards
export function ExperienceCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton className="w-full h-48" variant="rectangular" />
      <div className="p-4 space-y-3">
        <Skeleton height={24} className="w-3/4" />
        <Skeleton lines={2} />
        <div className="flex items-center justify-between">
          <Skeleton width={80} height={32} />
          <Skeleton width={100} height={40} />
        </div>
      </div>
    </div>
  );
}

// Skeleton for Experience Grid
interface ExperienceGridSkeletonProps {
  count?: number;
}

export function ExperienceGridSkeleton({ count = 6 }: ExperienceGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <ExperienceCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton for User Profile
export function UserProfileSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={64} height={64} />
        <div className="space-y-2 flex-1">
          <Skeleton width={120} height={20} />
          <Skeleton width={80} height={16} />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton lines={2} />
        <div className="flex space-x-4">
          <Skeleton width={60} height={20} />
          <Skeleton width={80} height={20} />
          <Skeleton width={50} height={20} />
        </div>
      </div>
    </div>
  );
}

// Skeleton for Booking Form
export function BookingFormSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <Skeleton width={200} height={32} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton width={100} height={16} />
          <Skeleton height={40} />
        </div>
        <div className="space-y-2">
          <Skeleton width={100} height={16} />
          <Skeleton height={40} />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton width={120} height={16} />
        <Skeleton height={100} />
      </div>
      
      <div className="flex space-x-4">
        <Skeleton width={120} height={40} />
        <Skeleton width={80} height={40} />
      </div>
      
      <Skeleton height={40} className="w-full" />
    </div>
  );
}

// Skeleton for Dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <Skeleton width={60} height={20} className="mb-2" />
            <Skeleton width={40} height={32} />
          </div>
        ))}
      </div>
      
      {/* Recent Bookings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <Skeleton width={150} height={24} className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1 space-y-2">
                <Skeleton height={16} />
                <Skeleton width={100} height={14} />
              </div>
              <Skeleton width={80} height={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <svg
        className="animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

// Full Page Loading Component
interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message = 'Loading...' }: FullPageLoadingProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
}

// Inline Loading Component
interface InlineLoadingProps {
  message?: string;
  className?: string;
}

export function InlineLoading({ message, className = '' }: InlineLoadingProps) {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <LoadingSpinner size="sm" />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
}

// Progressive Loading for Images
interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function ProgressiveImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj5Mb2FkaW5nLi4uPC90ZXh0Pgo8L3N2Zz4K',
  className = '',
  onLoad,
  onError
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && !error && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${loaded || error ? 'block' : 'hidden'}`}
      />
      {error && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
}

// Skeleton for Search Results
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <Skeleton width={80} height={80} variant="rectangular" />
          <div className="flex-1 space-y-2">
            <Skeleton width={200} height={20} />
            <Skeleton lines={2} />
            <div className="flex space-x-2">
              <Skeleton width={60} height={16} />
              <Skeleton width={80} height={16} />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton width={60} height={24} />
            <Skeleton width={80} height={32} />
          </div>
        </div>
      ))}
    </div>
  );
}