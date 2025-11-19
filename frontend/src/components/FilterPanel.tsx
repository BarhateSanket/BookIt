import React, { useState, useEffect } from 'react';
import { getSavedSearches, saveSearch, deleteSavedSearch } from '../api/api';

interface FilterPanelProps {
  filters: {
    search: string;
    category: string;
    priceMin: number;
    priceMax: number;
    rating: number;
    duration: string;
    location: string;
    availability: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onToggleMap: () => void;
  showMap: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange, onToggleMap, showMap }) => {
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const res = await getSavedSearches();
      setSavedSearches(res.data);
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    }
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim()) return;
    try {
      await saveSearch(saveName, filters);
      setShowSaveDialog(false);
      setSaveName('');
      loadSavedSearches();
    } catch (err) {
      console.error('Failed to save search:', err);
    }
  };

  const handleLoadSearch = (search: any) => {
    onFiltersChange(search.filters);
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      await deleteSavedSearch(id);
      loadSavedSearches();
    } catch (err) {
      console.error('Failed to delete search:', err);
    }
  };

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button
          onClick={onToggleMap}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            showMap
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showMap ? '📋 List' : '🗺️ Map'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search experiences..."
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category-select" className="block text-sm font-medium mb-1">Category</label>
          <select
            id="category-select"
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">All Categories</option>
            <option value="Adventure">Adventure</option>
            <option value="Cooking">Cooking</option>
            <option value="Art">Art</option>
            <option value="Sports">Sports</option>
            <option value="Wellness">Wellness</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium mb-1">Price Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceMin || ''}
              onChange={(e) => updateFilter('priceMin', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-1/2 p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceMax || ''}
              onChange={(e) => updateFilter('priceMax', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-1/2 p-2 border rounded"
            />
          </div>
        </div>

        {/* Rating */}
        <div>
          <label htmlFor="rating-select" className="block text-sm font-medium mb-1">Minimum Rating</label>
          <select
            id="rating-select"
            value={filters.rating}
            onChange={(e) => updateFilter('rating', parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value={0}>Any Rating</option>
            <option value={3}>3+ Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration-select" className="block text-sm font-medium mb-1">Duration</label>
          <select
            id="duration-select"
            value={filters.duration}
            onChange={(e) => updateFilter('duration', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Any Duration</option>
            <option value="1-2 hours">1-2 hours</option>
            <option value="Half day">Half day</option>
            <option value="Full day">Full day</option>
            <option value="Multi-day">Multi-day</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            placeholder="City, state, or country"
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Availability */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.availability}
              onChange={(e) => updateFilter('availability', e.target.checked)}
              className="mr-2"
            />
            Only show available experiences
          </label>
        </div>

        {/* Saved Searches */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Saved Searches</label>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Save Current
            </button>
          </div>
          <div className="space-y-1">
            {savedSearches.map((search) => (
              <div key={search._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <button
                  onClick={() => handleLoadSearch(search)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {search.name}
                </button>
                <button
                  onClick={() => handleDeleteSearch(search._id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Search</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Search name"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveSearch}
                className="flex-1 bg-blue-600 text-white py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
