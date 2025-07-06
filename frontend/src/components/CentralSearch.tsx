import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../contexts/SessionContext';
import { multiSearch } from '../queries';
import type { UnifiedSearchResult } from '../types/search';

const CentralSearch: React.FC = () => {
  const { currentCEO, currentBranchId } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'post' | 'page' | 'user' | 'branch'>('all');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['central-search', debouncedQuery, currentBranchId],
    queryFn: () => multiSearch(debouncedQuery, currentBranchId),
    enabled: debouncedQuery.length > 0,
  });

  const filteredResults = searchResults?.results?.filter(result =>
    selectedType === 'all' || result.type === selectedType
  ) || [];

  const formatScore = (score: number) => {
    return score.toFixed(2);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return '📰';
      case 'page':
        return '📄';
      case 'user':
        return '👤';
      case 'branch':
        return '🏢';
      default:
        return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'post':
        return 'bg-blue-100 text-blue-800';
      case 'page':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-purple-100 text-purple-800';
      case 'branch':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderResult = (result: UnifiedSearchResult) => {
    const commonProps = {
      key: result._id,
      className: "bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    };

    const typeColor = getTypeColor(result.type);
    const typeIcon = getTypeIcon(result.type);

    switch (result.type) {
      case 'post':
        return (
          <div {...commonProps}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                  {typeIcon} News Post
                </span>
                <span className="text-xs text-gray-500">
                  Score: {formatScore(result.score)}
                </span>
              </div>
                             <span className="text-xs text-gray-400">{result.createdAt}</span>
             </div>
             <h3 className="font-semibold text-gray-900 mb-1">{result.title}</h3>
             <p className="text-sm text-gray-600 mb-2">{result.description}</p>
             <div className="flex items-center space-x-4 text-xs text-gray-500">
               <span>Created: {result.createdAt}</span>
             </div>
          </div>
        );

      case 'page':
        return (
          <div {...commonProps}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                  {typeIcon} Page
                </span>
                <span className="text-xs text-gray-500">
                  Score: {formatScore(result.score)}
                </span>
              </div>
              <span className="text-xs text-gray-400">{result.updatedAt}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{result.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{result.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Category: {result.category}</span>
              {result.tags && result.tags.length > 0 && (
                <>
                  <span>•</span>
                  <span>Tags: {result.tags.join(', ')}</span>
                </>
              )}
            </div>
          </div>
        );

      case 'user':
        return (
          <div {...commonProps}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                  {typeIcon} Employee
                </span>
                <span className="text-xs text-gray-500">
                  Score: {formatScore(result.score)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3 mb-2">
              <img
                src={result.profilePhoto}
                alt={`${result.firstName} ${result.lastName}`}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {result.firstName} {result.lastName}
                </h3>
                <p className="text-sm text-gray-600">{result.jobTitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Department: {result.department}</span>
              <span>•</span>
              <span>Location: {result.location}</span>
              <span>•</span>
              <span>ID: {result.employeeId}</span>
            </div>
          </div>
        );

      case 'branch':
        return (
          <div {...commonProps}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                  {typeIcon} Company Info
                </span>
                <span className="text-xs text-gray-500">
                  Score: {formatScore(result.score)}
                </span>
              </div>
              <span className="text-xs text-gray-400">{result.updatedAt}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{result.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{result.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Created by: {result.createdByName}</span>
              <span>•</span>
              <span>Branch: {result.branchId}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={currentCEO.profilePhoto}
            alt={currentCEO.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentCEO.company} Search
            </h1>
            <p className="text-gray-600">
              Searching as {currentCEO.name} • {currentCEO.location}
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search news, pages, employees, and company info..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center justify-end mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="post">News Posts</option>
              <option value="page">Pages</option>
              <option value="user">Employees</option>
              <option value="branch">Company Info</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Searching...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">Search failed. Please try again.</span>
          </div>
        </div>
      )}

      {searchResults && debouncedQuery && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Search Results for "{debouncedQuery}"
          </h2>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span>📰 News Posts: {searchResults.totalHits.posts}</span>
            <span>📄 Pages: {searchResults.totalHits.pages}</span>
            <span>👤 Employees: {searchResults.totalHits.users}</span>
            <span>🏢 Company Info: {searchResults.totalHits.branches}</span>
          </div>
        </div>
      )}

      {filteredResults.length > 0 && (
        <div className="space-y-4">
          {filteredResults.map(renderResult)}
        </div>
      )}

      {searchResults && filteredResults.length === 0 && debouncedQuery && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.469-.98-6.047-2.564m.001-3.872A7.946 7.946 0 0112 6c2.34 0 4.469.98 6.047 2.564m.001 3.872A7.966 7.966 0 0112 18c-2.34 0-4.469-.98-6.047-2.564" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try different keywords or remove filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default CentralSearch;
