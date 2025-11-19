import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExperiences } from '../api/api';
import { ExperienceCard } from '../components/ExperienceCard';
import FilterPanel from '../components/FilterPanel';
import MapView from '../components/MapView';
import { ExperienceVirtualGrid } from '../components/VirtualScroll';
import { ExperienceGridSkeleton } from '../components/LoadingStates';
import { useDebounce } from '../utils/performanceOptimization';
import { trackEvent } from '../utils/analytics';
import SearchSuggestions from '../components/SearchSuggestions';

type Exp = {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category?: string;
  rating?: number;
  duration?: string;
  spots?: number;
  latitude?: number;
  longitude?: number;
};

type Filters = {
  search: string;
  category: string;
  priceMin: number;
  priceMax: number;
  rating: number;
  duration: string;
  location: string;
  availability: boolean;
};

export default function Home() {
  const [exps, setExps] = useState<Exp[]>([]);
  const [filteredExps, setFilteredExps] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);


  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    priceMin: 0,
    priceMax: 0,
    rating: 0,
    duration: '',
    location: '',
    availability: false,
  });

  // Debounce search input for better performance
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    getExperiences().then(res => {
      setExps(res.data || []);
      setFilteredExps(res.data || []);
    }).catch(err => {
      console.error(err);
    }).finally(() => setLoading(false));
  }, []);

  // Apply filters when filters change
  useEffect(() => {
    const applyFilters = async () => {
      try {
        const params: any = {};

        if (debouncedSearch) params.search = debouncedSearch;
        if (filters.category) params.category = filters.category;
        if (filters.priceMin > 0) params.priceMin = filters.priceMin;
        if (filters.priceMax > 0) params.priceMax = filters.priceMax;
        if (filters.rating > 0) params.rating = filters.rating;
        if (filters.duration) params.duration = filters.duration;
        if (filters.location) params.location = filters.location;

        if (filters.availability) params.availability = 'true';

        const res = await getExperiences(params);
        setFilteredExps(res.data || []);

        // Track search/filter usage
        if (debouncedSearch || filters.category || filters.location) {
          trackEvent('search_performed', {
            search_term: debouncedSearch || '',
            category: filters.category || '',
            location: filters.location || '',
            result_count: res.data?.length || 0
          });
        }
      } catch (err) {
        console.error('Failed to apply filters:', err);
        setFilteredExps(exps); // Fallback to all experiences
      }
    };

    if (exps.length > 0) {
      applyFilters();
    }
  }, [debouncedSearch, filters.category, filters.priceMin, filters.priceMax, filters.rating, filters.duration, filters.location, filters.availability, exps]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };



  const handleSuggestionSelect = (suggestion: string) => {
    setFilters({ ...filters, search: suggestion });
  };

  if (loading) return <ExperienceGridSkeleton count={6} />;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">BookIt — Experiences</h1>
        <p className="text-gray-600 mt-1">Explore and book curated local experiences.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Filter Panel */}
        <div className="lg:w-1/4">
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onToggleMap={() => setShowMap(!showMap)}
            showMap={showMap}
          />
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          {/* Functional Search Bar */}
          <div className="relative mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search experiences by title, description, or location..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="input w-full pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => setFilters({ ...filters, search: '' })}
                className="btn-secondary px-4 py-2 whitespace-nowrap"
              >
                Clear
              </button>
            </div>
            <SearchSuggestions
              searchValue={filters.search}
              onSuggestionSelect={handleSuggestionSelect}
            />
          </div>

          {showMap ? (
            /* Map View */
            <div className="h-96 lg:h-[600px] rounded-lg overflow-hidden border">
              <MapView experiences={filteredExps} />
            </div>
          ) : (
            /* Experiences Grid */
            filteredExps.length === 0 ? (
              <div className="text-center text-gray-500 py-12">No experiences found.</div>
            ) : filteredExps.length > 20 ? (
              /* Use Virtual Scroll for large lists */
              <ExperienceVirtualGrid
                experiences={filteredExps.map(e => ({
                  id: e._id,
                  title: e.title,
                  description: e.description,
                  price: e.price,
                  image: e.images?.[0] || '',
                  category: e.category || '',
                  rating: e.rating,
                  duration: e.duration
                }))}
                onBook={(id) => window.location.href = `/details/${id}`}
                onExperienceClick={(id) => window.location.href = `/details/${id}`}
                columns={3}
              />
            ) : (
              /* Regular grid for smaller lists */
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredExps.map(e => (
                  <ExperienceCard
                    key={e._id}
                    experience={{
                      id: e._id,
                      title: e.title,
                      description: e.description,
                      price: e.price,
                      image: e.images?.[0] || '',
                      category: e.category || '',
                      duration: e.duration,
                      rating: e.rating
                    }}
                    onBook={(id) => window.location.href = `/details/${id}`}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer with fake content */}
      <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">BookIt</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Discover and book unique local experiences. From cooking classes to adventure tours,
              find your next memorable moment with BookIt.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                <strong>Address:</strong> 123 Experience Street, Adventure City, AC 12345
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                <strong>Phone:</strong> (555) 123-4567
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                <strong>Email:</strong> hello@bookit.com
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-md font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">About Us</Link></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">How It Works</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Become a Host</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Press</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-md font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Cancellation Policy</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Refund Policy</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Trust & Safety</a></li>
            </ul>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap gap-6 mb-4 md:mb-0">
              <Link to="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Terms of Service</Link>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Cookie Policy</a>
              <Link to="/sitemap" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Sitemap</Link>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Accessibility</a>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              © 2024 BookIt. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
