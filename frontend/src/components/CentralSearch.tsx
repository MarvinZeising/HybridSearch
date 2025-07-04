import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { multiSearch } from '../queries';
import type { UnifiedSearchResult, PostSearchResult, PageSearchResult, UserSearchResult } from '../types/search';

const CentralSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [useReranking, setUseReranking] = useState(searchParams.get('rerank') === 'true');
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('type') || 'all');

  const { data: searchData, isLoading, error } = useQuery({
    queryKey: ['multisearch', searchTerm, useReranking],
    queryFn: () => multiSearch({ query: searchTerm, useReranking }),
    enabled: !!searchTerm.trim(),
  });

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const newParams = new URLSearchParams();
      if (searchTerm.trim()) {
        newParams.set('q', searchTerm);
        if (useReranking) {
          newParams.set('rerank', 'true');
        }
        if (typeFilter !== 'all') {
          newParams.set('type', typeFilter);
        }
      }
      setSearchParams(newParams);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, useReranking, typeFilter, setSearchParams]);

  const filteredResults = searchData?.results.filter(result =>
    typeFilter === 'all' || result.type === typeFilter
  ) || [];

  const renderPostResult = (result: PostSearchResult) => (
    <div key={`post-${result._id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            📰 News Post
          </span>
          <span className="text-xs text-gray-400">Score: {result.score.toFixed(3)}</span>
        </div>
        <span className="text-sm text-gray-500">
          {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      </div>
      <Link to={`/post/${result._id}`} className="block">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
          {result.title}
        </h3>
        <p className="text-gray-600 mb-3">{result.description}</p>
      </Link>
    </div>
  );

  const renderPageResult = (result: PageSearchResult) => (
    <div key={`page-${result._id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            📄 Page
          </span>
          <span className="text-xs text-gray-400">Score: {result.score.toFixed(3)}</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            result.isPublished
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {result.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {result.updatedAt ? new Date(result.updatedAt).toLocaleDateString() : 'N/A'}
        </span>
      </div>
      <Link to={`/pages/${result._id}`} className="block">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
          {result.title}
        </h3>
        <p className="text-gray-600 mb-3">{result.description}</p>
      </Link>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
          {result.category}
        </span>
        {result.tags.map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  const renderUserResult = (result: UserSearchResult) => (
    <div key={`user-${result._id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            👤 Employee
          </span>
          <span className="text-xs text-gray-400">Score: {result.score.toFixed(3)}</span>
        </div>
        <span className="text-sm text-gray-500">ID: {result.employeeId}</span>
      </div>
      <div className="flex items-center">
        <div className="flex-shrink-0 h-12 w-12">
          {result.profilePhoto ? (
            <img
              src={result.profilePhoto}
              alt={`${result.firstName} ${result.lastName}`}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {result.firstName.charAt(0)}{result.lastName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {result.fullName || `${result.firstName} ${result.lastName}`}
          </h3>
          <p className="text-gray-600">{result.email}</p>
          <p className="text-gray-600">{result.jobTitle}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {result.department}
            </span>
            {result.location && (
              <span className="text-xs text-gray-500">📍 {result.location}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderResult = (result: UnifiedSearchResult) => {
    switch (result.type) {
      case 'post':
        return renderPostResult(result as PostSearchResult);
      case 'page':
        return renderPageResult(result as PageSearchResult);
      case 'user':
        return renderUserResult(result as UserSearchResult);
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Universal Search</h1>

        {/* Search Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search across all content types..."
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Reranking toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useReranking}
                onChange={(e) => setUseReranking(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">Use reranking</span>
            </label>

            {/* Type filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter by type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="post">News Posts</option>
                <option value="page">Pages</option>
                <option value="user">Employees</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Stats */}
        {searchData && searchTerm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>
                <strong>{filteredResults.length}</strong> results found
              </span>
              <span>Posts: {searchData.totalHits.posts}</span>
              <span>Pages: {searchData.totalHits.pages}</span>
              <span>Employees: {searchData.totalHits.users}</span>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Searching...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            Failed to perform search. Please try again.
          </div>
        )}

        {!isLoading && !error && searchTerm && filteredResults.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No results found for "{searchTerm}"</p>
          </div>
        )}

        {!isLoading && !error && filteredResults.length > 0 && (
          <div className="space-y-4">
            {filteredResults.map(renderResult)}
          </div>
        )}

        {!searchTerm && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
            <p className="text-gray-500">
              Enter a search term to find content across news posts, pages, and employees
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CentralSearch;
