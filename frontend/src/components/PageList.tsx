import {Link, useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import SearchBar from './SearchBar';
import {fetchAllPages, searchPages} from "../queries.ts";

const PageList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const useReranking = searchParams.get('rerank') === 'true';

  const { data: pages = [], error } = useQuery({
    queryKey: ['pages', query, useReranking],
    queryFn: () => query ? searchPages({ query, useReranking }) : fetchAllPages(),
    enabled: true,
  });

  const handleSearchTermChange = (searchTerm: string, useReranking: boolean) => {
    const newParams = new URLSearchParams();
    if (searchTerm.trim()) {
      newParams.set('q', searchTerm);
      if (useReranking) {
        newParams.set('rerank', 'true');
      }
    }
    setSearchParams(newParams);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Pages</h2>
        <Link
          to="/pages/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Page
        </Link>
      </div>
      <div className="relative">
        <SearchBar key="searchbar" onSearchTermChange={handleSearchTermChange} />
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Failed to {query ? 'search' : 'fetch'} pages
        </div>
      ) : pages.length === 0 ? (
        <p className="text-gray-500">No pages found.</p>
      ) : (
        <div className="grid gap-6">
          {pages.map((page) => (
            <article key={page._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{page.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  page.isPublished
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {page.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-gray-600 mb-3">{page.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {page.category}
                </span>
                {page.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4">
                {page.createdAt && (
                  <p className="text-sm text-gray-500">
                    Created on {new Date(page.createdAt).toLocaleDateString()}
                    {page.updatedAt && page.updatedAt !== page.createdAt && (
                      <span className="ml-2">
                        • Updated on {new Date(page.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                )}
                <div className="space-x-3">
                  <Link
                    to={`/pages/${page._id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Page
                  </Link>
                  <Link
                    to={`/pages/edit/${page._id}`}
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

export default PageList;
