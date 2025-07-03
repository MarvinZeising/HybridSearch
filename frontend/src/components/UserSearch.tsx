import React, { useState } from 'react';
import { searchUsers } from '../queries';
import type { User } from '../types/users';

const UserSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [useReranking, setUseReranking] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const data = await searchUsers({ query: query.trim(), useReranking });
      setResults(data);
    } catch (err) {
      setError('Failed to search users');
      console.error('Error searching users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Employees</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, job title, department..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useReranking}
                onChange={(e) => setUseReranking(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Use Reranking</span>
            </label>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results ({results.length})
            </h2>
            {useReranking && (
              <p className="text-sm text-gray-600 mt-1">
                Results reranked using cross-encoder for better relevance
              </p>
            )}
          </div>
          <div className="divide-y divide-gray-200">
            {results.map((user) => (
              <div key={user._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-lg font-medium text-gray-900">
                        {user.fullName || `${user.firstName} ${user.lastName}`}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.jobTitle}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.department}
                        </span>
                        {user.location && (
                          <span className="text-xs text-gray-500">📍 {user.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">ID: {user.employeeId}</div>
                    {user.score && (
                      <div className="text-xs text-gray-400 mt-1">
                        Score: {user.score.toFixed(3)}
                      </div>
                    )}
                  </div>
                </div>
                {user.managerId && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Manager:</span> {user.managerId.firstName} {user.managerId.lastName}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && query && results.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
