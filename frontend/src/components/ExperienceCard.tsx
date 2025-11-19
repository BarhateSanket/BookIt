import React from 'react';
import { memo } from 'react';
import { LazyImageLoader } from '../utils/performanceOptimization';

interface ExperienceCardProps {
  experience: {
    id: string;
    title: string;
    description: string;
    price: number;
    image: string;
    category: string;
    duration?: string;
    rating?: number;
    location?: string;
  };
  onBook: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

// Memoized ExperienceCard with performance optimizations
export const ExperienceCard = memo<ExperienceCardProps>(({ 
  experience, 
  onBook, 
  isLoading = false,
  className = ''
}) => {
  const imageRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (imageRef.current && imageRef.current.dataset.src) {
      LazyImageLoader.observe(imageRef.current);
    }
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
        <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="flex items-center justify-between">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
      <div className="relative overflow-hidden">
        <img
          ref={imageRef}
          data-src={experience.image}
          alt={experience.title}
          className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        {experience.rating && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-sm font-semibold flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {experience.rating.toFixed(1)}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {experience.title}
          </h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2 flex-shrink-0">
            {experience.category}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {experience.description}
        </p>
        
        <div className="flex items-center text-sm text-gray-500 mb-4">
          {experience.duration && (
            <div className="flex items-center mr-4">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {experience.duration}
            </div>
          )}
          {experience.location && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {experience.location}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-blue-600">
              ${experience.price}
            </span>
            <span className="text-xs text-gray-500">per person</span>
          </div>
          
          <button 
            onClick={() => onBook(experience.id)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.experience.id === nextProps.experience.id &&
    prevProps.experience.title === nextProps.experience.title &&
    prevProps.experience.description === nextProps.experience.description &&
    prevProps.experience.price === nextProps.experience.price &&
    prevProps.experience.image === nextProps.experience.image &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.onBook === nextProps.onBook
  );
});

ExperienceCard.displayName = 'ExperienceCard';
