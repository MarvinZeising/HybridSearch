import {Link, useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import SearchBar from './SearchBar';
import {fetchAllPosts, searchPosts} from "../queries.ts";
import {useSession} from '../contexts/SessionContext';

const NewsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { currentBranchId } = useSession();

  const { data: posts = [], error } = useQuery({
    queryKey: ['posts', query, currentBranchId],
    queryFn: () => query ? searchPosts({ query, branchId: currentBranchId }) : fetchAllPosts(),
    enabled: true,
  });

  const handleSearchTermChange = (searchTerm: string) => {
    const newParams = new URLSearchParams();
    if (searchTerm.trim()) {
      newParams.set('q', searchTerm);
    }
    setSearchParams(newParams);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">News Posts</h2>
        <Link
          to="/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Post
        </Link>
      </div>
      <div className="relative">
        <SearchBar key="searchbar" onSearchTermChange={handleSearchTermChange} />
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Failed to {query ? 'search' : 'fetch'} news posts
        </div>
      ) : posts.length === 0 ? (
        <p className="text-gray-500">No news posts found.</p>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <article key={post._id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
              <p className="text-gray-600 mb-4">{post.description}</p>
              <div className="flex justify-between items-center mt-4">
                {post.createdAt && (
                  <p className="text-sm text-gray-500">
                    Posted on {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                )}
                <div className="space-x-3">
                  <Link
                    to={`/post/${post._id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Read More
                  </Link>
                  <Link
                    to={`/edit/${post._id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsList;
