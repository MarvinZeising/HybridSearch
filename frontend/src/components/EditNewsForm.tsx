import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ChangeEvent, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { NewsFormData, NewsPost } from '../types/news';
import { deletePost, fetchPostById } from '../queries';

const EditNewsForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    description: '',
    content: ''
  });
  const [status, setStatus] = useState<string>('');

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostById(id!),
    enabled: !!id,
  });

  const updatePostMutation = useMutation({
    mutationFn: async (data: NewsFormData) => {
      const response = await axios.put<NewsPost>(`http://localhost:4000/api/news/${id}`, data);
      return response;
    },
    onSuccess: () => {
      setStatus('success');
      // Invalidate both the post detail and posts list queries
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => {
      setStatus('error');
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: () => deletePost(id!),
    onSuccess: () => {
      // Invalidate both the post detail and posts list queries
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate('/');
    },
    onError: () => {
      setStatus('error');
    }
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        description: post.description,
        content: post.content
      });
    }
  }, [post]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    updatePostMutation.mutate(formData);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    deletePostMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Edit News Post</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[300px] font-mono"
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deletePostMutation.isPending}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {deletePostMutation.isPending ? 'Deleting...' : 'Delete Post'}
          </button>

          <button
            type="submit"
            disabled={updatePostMutation.isPending}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {updatePostMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {status === 'success' && (
          <p className="text-green-600 text-sm mt-2">News post updated successfully!</p>
        )}
        {status === 'error' && (
          <p className="text-red-600 text-sm mt-2">Error updating news post. Please try again.</p>
        )}
      </form>
    </div>
  );
};

export default EditNewsForm;
