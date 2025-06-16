import { useState, useEffect, memo } from 'react';

interface SearchBarProps {
  onSearchTermChange: (term: string, useReranking: boolean) => void;
}

const SearchBar = memo(({ onSearchTermChange }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [useReranking, setUseReranking] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearchTermChange(searchTerm, useReranking);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, useReranking, onSearchTermChange]);

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
      <div className="mt-2 flex items-center">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useReranking}
            onChange={(e) => setUseReranking(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">Use reranking (using a cross-encoder model)</span>
        </label>
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
