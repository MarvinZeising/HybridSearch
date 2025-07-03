import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewsForm from './components/NewsForm';
import NewsList from './components/NewsList';
import EditNewsForm from './components/EditNewsForm';
import PostDetail from './components/PostDetail';
import PageList from './components/PageList';
import PageForm from './components/PageForm';
import EditPageForm from './components/EditPageForm';
import PageDetail from './components/PageDetail';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import UserSearch from './components/UserSearch';
import { useParams } from 'react-router-dom';

const EditUserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <UserForm userId={id} />;
};

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
                <h1 className="text-xl font-semibold text-gray-900">Intranet</h1>
                <div className="flex items-center space-x-4">
                  <a
                    href="http://localhost:5601"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Dashboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </a>
                  <a
                    href="http://localhost:8081"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Mongo Express"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </a>
                  <Link to="/" className="text-gray-600 hover:text-gray-900">
                    News Posts
                  </Link>
                  <Link to="/pages" className="text-gray-600 hover:text-gray-900">
                    Pages
                  </Link>
                  <Link to="/users" className="text-gray-600 hover:text-gray-900">
                    Employees
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
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/pages" element={<PageList />} />
              <Route path="/pages/create" element={<PageForm />} />
              <Route path="/pages/edit/:id" element={<EditPageForm />} />
              <Route path="/pages/:id" element={<PageDetail />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/users/search" element={<UserSearch />} />
              <Route path="/users/new" element={<UserForm />} />
              <Route path="/users/edit/:id" element={<EditUserForm />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
