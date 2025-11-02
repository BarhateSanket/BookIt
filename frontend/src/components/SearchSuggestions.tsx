import React, { useState, useEffect, useRef } from 'react';
import { getExperiences } from '../api/api';

interface SearchSuggestionsProps {
  searchValue: string;
  onSuggestionSelect: (suggestion: string) => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ searchValue, onSuggestionSelect }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getExperiences({ search: searchValue, limit: 10 });
        const experiences = res.data || [];

        // Extract unique titles and descriptions for suggestions
        const titleSuggestions = experiences.map((exp: any) => exp.title);
        const descriptionSuggestions = experiences
          .map((exp: any) => exp.description?.split(' ').slice(0, 5).join(' '))
          .filter(Boolean);

        const uniqueSuggestions = [...new Set([...titleSuggestions, ...descriptionSuggestions])]
          .filter(suggestion =>
            suggestion.toLowerCase().includes(searchValue.toLowerCase())
          )
          .slice(0, 5);

        setSuggestions(uniqueSuggestions);
        setShowSuggestions(uniqueSuggestions.length > 0);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
        {loading && (
          <div className="p-2 text-gray-500 text-sm">Loading suggestions...</div>
        )}
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => {
              onSuggestionSelect(suggestion);
              setShowSuggestions(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
          >
            <span className="text-sm">{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchSuggestions;
