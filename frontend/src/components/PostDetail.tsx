import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPostById } from '../queries';
import type { NewsPost } from '../types/news';

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: post, error, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        Failed to load post
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-gray-600">Post not found</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to News
        </Link>
      </div>

      <article className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

        {post.createdAt && (
          <p className="text-sm text-gray-500 mb-6">
            Posted on {new Date(post.createdAt).toLocaleDateString()}
          </p>
        )}

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">{post.description}</p>
          <div
            className="text-gray-700 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
          />
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            to={`/edit/${post._id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit Post
          </Link>
        </div>
      </article>
    </div>
  );
};

export default PostDetail;
