import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import type { NewsFormData, NewsPost } from '../types/news';

const EditNewsForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    description: ''
  });
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get<NewsPost>(`http://localhost:4000/api/news/${id}`);
        setFormData({
          title: response.data.title,
          description: response.data.description
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching news post:', error);
        setStatus('error');
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

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
    
    try {
      await axios.put<NewsPost>(`http://localhost:4000/api/news/${id}`, formData);
      setStatus('success');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      setStatus('error');
      console.error('Error updating news post:', error);
    }
  };

  if (loading) {
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

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'submitting' ? 'Saving...' : 'Save Changes'}
        </button>

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