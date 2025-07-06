import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';

interface SearchBarProps {
  onSearchTermChange: (term: string) => void;
}

const SearchBar = ({ onSearchTermChange }: SearchBarProps) => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    if (searchTerm !== searchParams.get('q')) {
      const debounceTimer = setTimeout(() => {
        onSearchTermChange(searchTerm);
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm]);

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}

SearchBar.displayName = 'SearchBar';

export default SearchBar;
