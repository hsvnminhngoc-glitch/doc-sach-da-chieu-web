import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { BookOpen, Youtube, Search, X } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { VideoDetailPage } from './pages/VideoDetailPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function HeaderSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState(searchParams.get('q') || '');
  const { pathname } = useLocation();

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/');
    }
  };

  const clearSearch = () => {
    setQuery('');
    if (pathname === '/') {
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex relative max-w-sm w-full mx-2 sm:mx-4">
      <input
        type="text"
        placeholder="Tìm kiếm..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-10 pr-10 py-2 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm transition-all text-sm text-gray-900"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      {query && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Xóa"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* SEO-friendly Semantic Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="bg-white p-0.5 rounded-full ring-2 ring-red-600 shadow-sm overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105">
                 <img src="https://unavatar.io/youtube/@reviewsach2026" alt="Đọc Sách Đa Chiều Logo" className="w-8 h-8 rounded-full" loading="lazy" decoding="async" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-red-600 transition-colors hidden lg:block">
                Đọc Sách Đa Chiều
              </h1>
            </Link>
            
            <HeaderSearch />
            
            <a 
              href="https://www.youtube.com/@reviewsach2026" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors shrink-0"
            >
              <Youtube className="w-5 h-5" />
              <span className="hidden sm:inline">Kênh YouTube</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>

      {/* SEO-friendly Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between text-center md:text-left">
            <div className="flex justify-center md:justify-start items-center gap-3 mb-4 md:mb-0">
               <img src="https://unavatar.io/youtube/@reviewsach2026" alt="Logo" className="w-6 h-6 rounded-full grayscale opacity-75" loading="lazy" />
              <span className="text-gray-500 font-medium">© {new Date().getFullYear()} Đọc Sách Đa Chiều.</span>
            </div>
            <p className="text-sm text-gray-400">
              Cập nhật tự động từ YouTube Data API.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/video/:seoInfo" element={<VideoDetailPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </HelmetProvider>
  );
}

