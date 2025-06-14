import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import type { NewsPost } from '../types/news';
import SearchBar from './SearchBar';

const NewsList = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchAllPosts = useCallback(async () => {
    try {
      const response = await axios.get<NewsPost[]>('http://localhost:4000/api/news');
      setPosts(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch news posts');
      console.error('Error fetching news posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

  const handleSearchTermChange = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      await fetchAllPosts();
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.post<NewsPost[]>('http://localhost:4000/api/news/search', {
        query: searchTerm
      });
      setPosts(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to search news posts');
      console.error('Error searching posts:', err);
    } finally {
      setIsSearching(false);
    }
  }, [fetchAllPosts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">News Posts</h2>
      <div className="relative">
        <SearchBar onSearchTermChange={handleSearchTermChange} />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      {posts.length === 0 ? (
        <p className="text-gray-500">No news posts found.</p>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <article key={post._id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
              <p className="text-gray-600">{post.description}</p>
              <div className="flex justify-between items-center mt-4">
                {post.createdAt && (
                  <p className="text-sm text-gray-500">
                    Posted on {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                )}
                <Link
                  to={`/edit/${post._id}`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsList;