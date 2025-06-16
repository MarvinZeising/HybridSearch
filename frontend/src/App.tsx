import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewsForm from './components/NewsForm';
import NewsList from './components/NewsList';
import EditNewsForm from './components/EditNewsForm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <nav className="bg-white shadow-sm">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold text-gray-900">News App</h1>
                <div className="space-x-4">
                  <a
                    href="http://localhost:5601"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </a>
                  <a
                    href="http://localhost:8081"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Mongo Express
                  </a>
                  <Link to="/" className="text-gray-600 hover:text-gray-900">
                    View Posts
                  </Link>
                  <Link to="/create" className="text-gray-600 hover:text-gray-900">
                    Create Post
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-3xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<NewsList />} />
              <Route path="/create" element={<NewsForm />} />
              <Route path="/edit/:id" element={<EditNewsForm />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
