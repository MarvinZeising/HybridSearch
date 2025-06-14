import { useState, useEffect, memo } from 'react';

interface SearchBarProps {
  onSearchTermChange: (term: string) => void;
}

const SearchBar = memo(({ onSearchTermChange }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearchTermChange(searchTerm);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearchTermChange]);

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
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
