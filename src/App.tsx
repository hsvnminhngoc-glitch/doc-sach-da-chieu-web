import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { BookOpen, Youtube } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { VideoDetailPage } from './pages/VideoDetailPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* SEO-friendly Semantic Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-white p-0.5 rounded-full ring-2 ring-red-600 shadow-sm overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105">
                 <img src="https://unavatar.io/youtube/@reviewsach2026" alt="Đọc Sách Đa Chiều Logo" className="w-8 h-8 rounded-full" loading="lazy" decoding="async" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-red-600 transition-colors hidden sm:block">
                Đọc Sách Đa Chiều
              </h1>
            </Link>
            <a 
              href="https://www.youtube.com/@reviewsach2026" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
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

