import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Advanced Search & Filter Types
interface SearchFilters {
  query: string;
  location: {
    city: string;
    country: string;
    radius: number; // kilometers
    coordinates?: { lat: number; lng: number };
  };
  priceRange: {
    min: number;
    max: number;
  };
  categories: string[];
  tags: string[];
  dateRange: {
    start: string;
    end: string;
  };
  duration: {
    min: number; // minutes
    max: number; // minutes
  };
  rating: {
    min: number;
    max: number;
  };
  availability: 'any' | 'available' | 'limited';
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'date' | 'popularity';
  limit: number;
  offset: number;
}

interface Experience {
  _id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  tags: string[];
  location: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  rating: number;
  reviewCount: number;
  availableDates: string[];
  images: string[];
  maxParticipants: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface SearchResults {
  experiences: Experience[];
  total: number;
  hasMore: boolean;
  facets: {
    categories: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    cities: Array<{ name: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
  };
}

// Default search filters
const defaultFilters: SearchFilters = {
  query: '',
  location: {
    city: '',
    country: '',
    radius: 50
  },
  priceRange: {
    min: 0,
    max: 1000
  },
  categories: [],
  tags: [],
  dateRange: {
    start: '',
    end: ''
  },
  duration: {
    min: 0,
    max: 480 // 8 hours
  },
  rating: {
    min: 0,
    max: 5
  },
  availability: 'any',
  sortBy: 'relevance',
  limit: 20,
  offset: 0
};

// Geolocation hook
function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return { location, error, loading, getCurrentLocation };
}

// Location search hook
function useLocationSearch() {
  const [suggestions, setSuggestions] = useState<Array<{ name: string; country: string; coordinates?: { lat: number; lng: number } }>>([]);
  const [loading, setLoading] = useState(false);

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/locations/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Location search failed:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading, searchLocations, setSuggestions };
}

// Search API hook
function useExperienceSearch() {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      // Add all filters to query params
      if (filters.query) queryParams.set('q', filters.query);
      if (filters.location.city) queryParams.set('city', filters.location.city);
      if (filters.location.country) queryParams.set('country', filters.location.country);
      if (filters.location.radius) queryParams.set('radius', filters.location.radius.toString());
      if (filters.location.coordinates) {
        queryParams.set('lat', filters.location.coordinates.lat.toString());
        queryParams.set('lng', filters.location.coordinates.lng.toString());
      }
      
      queryParams.set('priceMin', filters.priceRange.min.toString());
      queryParams.set('priceMax', filters.priceRange.max.toString());
      
      if (filters.categories.length > 0) {
        queryParams.set('categories', filters.categories.join(','));
      }
      if (filters.tags.length > 0) {
        queryParams.set('tags', filters.tags.join(','));
      }
      
      if (filters.dateRange.start) queryParams.set('dateStart', filters.dateRange.start);
      if (filters.dateRange.end) queryParams.set('dateEnd', filters.dateRange.end);
      
      queryParams.set('durationMin', filters.duration.min.toString());
      queryParams.set('durationMax', filters.duration.max.toString());
      queryParams.set('ratingMin', filters.rating.min.toString());
      queryParams.set('ratingMax', filters.rating.max.toString());
      
      if (filters.availability !== 'any') {
        queryParams.set('availability', filters.availability);
      }
      
      queryParams.set('sortBy', filters.sortBy);
      queryParams.set('limit', filters.limit.toString());
      queryParams.set('offset', filters.offset.toString());

      const response = await fetch(`/api/experiences/search?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
}

// Search form component
interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

export function SearchForm({ onSearch, initialFilters = {} }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({ ...defaultFilters, ...initialFilters });
  const { location: currentLocation, getCurrentLocation, loading: locationLoading } = useGeolocation();
  const { suggestions: locationSuggestions, searchLocations, setSuggestions } = useLocationSearch();

  // Update filters when location changes
  useEffect(() => {
    if (currentLocation && filters.location.radius === 50) {
      setFilters(prev => ({
        ...prev,
        location: { ...prev.location, coordinates: currentLocation }
      }));
    }
  }, [currentLocation]);

  const handleInputChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  const handlePriceChange = (field: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { ...prev.priceRange, [field]: value }
    }));
  };

  const handleDurationChange = (field: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      duration: { ...prev.duration, [field]: value }
    }));
  };

  const handleRatingChange = (field: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      rating: { ...prev.rating, [field]: value }
    }));
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const clearFilters = () => {
    setFilters({ ...defaultFilters });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const categories = [
    'adventure', 'cultural', 'culinary', 'nature', 
    'workshop', 'sports', 'art', 'music'
  ];

  const tags = [
    'outdoor', 'indoor', 'family-friendly', 'pet-friendly',
    'beginner-friendly', 'advanced', 'group-activity', 'solo-travel',
    'photography', 'local-experience', 'historical', 'modern'
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      {/* Main Search Query */}
      <div>
        <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Experiences
        </label>
        <input
          id="search-query"
          type="text"
          placeholder="What adventure are you looking for?"
          value={filters.query}
          onChange={(e) => handleInputChange('query', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          aria-describedby="search-query-help"
        />
        <p id="search-query-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Describe the experience you're looking for
        </p>
      </div>

      {/* Location Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="city-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            City
          </label>
          <div className="relative">
            <input
              id="city-search"
              type="text"
              placeholder="Enter city name"
              value={filters.location.city}
              onChange={(e) => {
                handleLocationChange('city', e.target.value);
                searchLocations(e.target.value);
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              aria-describedby="city-search-help"
            />
            {locationSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                {locationSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      handleLocationChange('city', suggestion.name);
                      handleLocationChange('country', suggestion.country);
                      if (suggestion.coordinates) {
                        handleLocationChange('coordinates', suggestion.coordinates);
                      }
                      setSuggestions([]);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    {suggestion.name}, {suggestion.country}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p id="city-search-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Start typing to see city suggestions
          </p>
        </div>

        <div>
          <label htmlFor="country-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Country
          </label>
          <input
            id="country-search"
            type="text"
            placeholder="Enter country name"
            value={filters.location.country}
            onChange={(e) => handleLocationChange('country', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="radius-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Radius (km)
          </label>
          <input
            id="radius-search"
            type="number"
            min="1"
            max="500"
            value={filters.location.radius}
            onChange={(e) => handleLocationChange('radius', parseInt(e.target.value) || 50)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-describedby="radius-help"
          />
          <p id="radius-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Distance from selected location
          </p>
        </div>
      </div>

      {/* Use Current Location */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={locationLoading}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          aria-label="Use your current location for search"
        >
          {locationLoading ? 'Getting location...' : 'Use current location'}
        </button>
        {currentLocation && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Location detected ✓
          </span>
        )}
      </div>

      {/* Price Range */}
      <div>
        <label htmlFor="price-range" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Price Range: ${filters.priceRange.min} - ${filters.priceRange.max}
        </label>
        <div className="flex items-center space-x-4">
          <input
            id="price-min"
            type="range"
            min="0"
            max="1000"
            step="10"
            value={filters.priceRange.min}
            onChange={(e) => handlePriceChange('min', parseInt(e.target.value))}
            className="flex-1"
            aria-label="Minimum price"
          />
          <input
            id="price-max"
            type="range"
            min="0"
            max="1000"
            step="10"
            value={filters.priceRange.max}
            onChange={(e) => handlePriceChange('max', parseInt(e.target.value))}
            className="flex-1"
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const isSelected = filters.categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.tags.includes(tag)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date
          </label>
          <input
            id="date-start"
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => handleInputChange('dateRange', { ...filters.dateRange, start: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="date-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Date
          </label>
          <input
            id="date-end"
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => handleInputChange('dateRange', { ...filters.dateRange, end: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Duration and Rating */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="duration-range" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duration: {Math.floor(filters.duration.min / 60)}h {filters.duration.min % 60}m - {Math.floor(filters.duration.max / 60)}h {filters.duration.max % 60}m
          </label>
          <div className="flex items-center space-x-4">
            <input
              id="duration-min"
              type="range"
              min="0"
              max="480"
              step="15"
              value={filters.duration.min}
              onChange={(e) => handleDurationChange('min', parseInt(e.target.value))}
              className="flex-1"
              aria-label="Minimum duration"
            />
            <input
              id="duration-max"
              type="range"
              min="0"
              max="480"
              step="15"
              value={filters.duration.max}
              onChange={(e) => handleDurationChange('max', parseInt(e.target.value))}
              className="flex-1"
              aria-label="Maximum duration"
            />
          </div>
        </div>

        <div>
          <label htmlFor="rating-range" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rating: {filters.rating.min} - {filters.rating.max} stars
          </label>
          <div className="flex items-center space-x-4">
            <input
              id="rating-min"
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={filters.rating.min}
              onChange={(e) => handleRatingChange('min', parseFloat(e.target.value))}
              className="flex-1"
              aria-label="Minimum rating"
            />
            <input
              id="rating-max"
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={filters.rating.max}
              onChange={(e) => handleRatingChange('max', parseFloat(e.target.value))}
              className="flex-1"
              aria-label="Maximum rating"
            />
          </div>
        </div>
      </div>

      {/* Availability and Sort */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="availability-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Availability
          </label>
          <select
            id="availability-select"
            value={filters.availability}
            onChange={(e) => handleInputChange('availability', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Filter by availability"
          >
            <option value="any">Any availability</option>
            <option value="available">Available</option>
            <option value="limited">Limited availability</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort by
          </label>
          <select
            id="sort-select"
            value={filters.sortBy}
            onChange={(e) => handleInputChange('sortBy', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Sort results by"
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="date">Soonest Date</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <button
          type="button"
          onClick={clearFilters}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Clear Filters
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Search Experiences
        </button>
      </div>
    </form>
  );
}

// Search results component
interface SearchResultsProps {
  results: SearchResults | null;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
}

export function SearchResultsDisplay({ results, loading, error, onLoadMore }: SearchResultsProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Searching experiences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Search Error</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!results || results.experiences.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No experiences found</h3>
        <p className="text-gray-600 dark:text-gray-300">Try adjusting your search criteria to find more experiences.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {results.total} Experiences Found
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Showing {results.experiences.length} of {results.total}
        </div>
      </div>

      {/* Search Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.experiences.map((experience) => (
          <div
            key={experience._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/details/${experience._id}`)}
          >
            {experience.images && experience.images.length > 0 ? (
              <img
                src={experience.images[0]}
                alt={experience.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200">
                  {experience.category}
                </span>
                <div className="flex items-center text-yellow-500">
                  <span className="text-sm font-medium">{experience.rating}</span>
                  <span className="text-xs ml-1">({experience.reviewCount})</span>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {experience.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                {experience.description}
              </p>
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {experience.location.city}, {experience.location.country}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.floor(experience.duration / 60)}h {experience.duration % 60}m • Max {experience.maxParticipants} people
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  ${experience.price}
                </div>
              </div>
              
              {experience.tags && experience.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {experience.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded dark:bg-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {experience.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded dark:bg-gray-700 dark:text-gray-300">
                      +{experience.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {results.hasMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Experiences'}
          </button>
        </div>
      )}
    </div>
  );
}

// Main Advanced Search Component
interface AdvancedSearchProps {
  onResultsUpdate?: (results: SearchResults) => void;
}

export function AdvancedSearch({ onResultsUpdate }: AdvancedSearchProps) {
  const { results, loading, error, search } = useExperienceSearch();
  const [lastFilters, setLastFilters] = useState<SearchFilters | null>(null);

  const handleSearch = async (filters: SearchFilters) => {
    setLastFilters(filters);
    await search(filters);
  };

  const handleLoadMore = async () => {
    if (lastFilters && results && !loading) {
      const loadMoreFilters = { ...lastFilters, offset: results.experiences.length };
      await search(loadMoreFilters);
    }
  };

  useEffect(() => {
    if (results && onResultsUpdate) {
      onResultsUpdate(results);
    }
  }, [results, onResultsUpdate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <SearchForm onSearch={handleSearch} />
        <SearchResultsDisplay
          results={results}
          loading={loading}
          error={error}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}