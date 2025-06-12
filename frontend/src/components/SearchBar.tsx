import { useState, useEffect, memo } from 'react';
import axios from 'axios';
import type { NewsPost } from '../types/news';

interface SearchBarProps {
  onSearch: (results: NewsPost[]) => void;
}

const SearchBar = memo(({ onSearch }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchPosts = async () => {
      if (!searchTerm.trim()) {
        // Don't fetch all posts when search is empty
        return;
      }

      setIsSearching(true);
      try {
        const response = await axios.post<NewsPost[]>('http://localhost:4000/api/news/search', {
          query: searchTerm
        });
        onSearch(response.data);
      } catch (error) {
        console.error('Error searching posts:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchPosts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearch]);

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search news posts..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar; 