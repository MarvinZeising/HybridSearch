import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const PageDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ['page', id],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:4000/api/pages/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error || !page) {
    return <div className="text-center py-8 text-red-600">Page not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/pages"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Pages
        </Link>
      </div>

      <article className="bg-white rounded-lg shadow-md p-8">
        <header className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              page.isPublished
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {page.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>

          <p className="text-lg text-gray-600 mb-4">{page.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
              {page.category}
            </span>
            {page.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded">
                {tag}
              </span>
            ))}
          </div>

          <div className="text-sm text-gray-500">
            <p>
              Created on {new Date(page.createdAt).toLocaleDateString()}
              {page.updatedAt && page.updatedAt !== page.createdAt && (
                <span className="ml-4">
                  • Updated on {new Date(page.updatedAt).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </header>

        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {page.content}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Link
              to="/pages"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Pages
            </Link>
            <Link
              to={`/pages/edit/${page._id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Page
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
};

export default PageDetail;
