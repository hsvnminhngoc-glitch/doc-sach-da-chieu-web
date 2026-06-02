import React, { useEffect, useState, useMemo } from 'react';
import { AlertCircle, Loader2, Search, ArrowUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Video } from '../types';
import { VideoCard } from '../components/VideoCard';
import { motion } from 'motion/react';
import { CATEGORIES } from '../constants';

export function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(9); // Số video hiển thị ban đầu
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch('/api/videos');
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch videos');
        }
        const data = await response.json();
        setVideos(data.videos);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  // Reset filter display count when category or search changes
  useEffect(() => {
    setVisibleCount(9);
  }, [activeCategory, searchQuery]);

  const filteredVideos = useMemo(() => {
    let result = videos;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(video => 
        (video.title && video.title.toLowerCase().includes(query)) ||
        (video.description && video.description.toLowerCase().includes(query))
      );
    }

    if (activeCategory !== 'all') {
      const category = CATEGORIES.find(c => c.id === activeCategory);
      if (category) {
        result = result.filter(video => {
          const textToSearch = `${video.title} ${video.playlistTitle || ''}`.toLowerCase();
          return category.keywords.some(keyword => textToSearch.includes(keyword.toLowerCase()));
        });
      }
    }

    return result;
  }, [videos, activeCategory, searchQuery]);

  const visibleVideos = filteredVideos.slice(0, visibleCount);

  // Intersection Observer for infinite scrolling
  const observerTarget = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleCount < filteredVideos.length) {
          setVisibleCount(prev => prev + 6);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, visibleCount, filteredVideos.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const origin = 'https://docsachdachieu.com';

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Đọc Sách Đa Chiều</title>
        <meta name="description" content="Khám phá và xem bình luận các cuốn sách hay, nổi bật qua những video review chân thực và sâu sắc." />
        <meta property="og:title" content="Đọc Sách Đa Chiều" />
        <meta property="og:description" content="Khám phá và xem bình luận các cuốn sách hay, nổi bật qua những video review chân thực và sâu sắc." />
        <meta property="og:image" content="https://unavatar.io/youtube/@reviewsach2026" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={origin} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Đọc Sách Đa Chiều" />
        <meta name="twitter:description" content="Khám phá và xem bình luận các cuốn sách hay, nổi bật qua những video review chân thực và sâu sắc." />
        <meta name="twitter:image" content="https://unavatar.io/youtube/@reviewsach2026" />
        <link rel="canonical" href={origin} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "name": "Đọc Sách Đa Chiều",
                "url": origin,
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": `${origin}/?q={search_term_string}`,
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@type": "Organization",
                "name": "Đọc Sách Đa Chiều",
                "url": origin,
                "logo": `${origin}/favicon.ico`,
                "sameAs": [
                  "https://www.youtube.com/@reviewsach2026"
                ]
              }
            ]
          })}
        </script>
      </Helmet>
      {/* Hero Section */}
      <div className="max-w-3xl mb-10">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          Chào mừng bạn đến với Đọc Sách Đa Chiều! 📚
        </h2>
        <div className="text-lg text-gray-600 leading-relaxed mb-8 space-y-4">
          <p>
            Bạn đam mê đọc sách nhưng quỹ thời gian lại quá eo hẹp? Bạn muốn tìm kiếm những cuốn sách thực sự chất lượng trước khi quyết định mua?
          </p>
          <p>
            Kênh Đọc Sách Đa Chiều ra đời với sứ mệnh giúp bạn "Đọc ít hơn, hiểu nhiều hơn". Tại đây, mình sẽ đúc kết, tóm tắt và phân tích chuyên sâu những tựa sách hay nhất về:
          </p>
          <ul className="list-none space-y-2 pl-2">
            <li>🌱 Phát triển bản thân & Kỹ năng sống</li>
            <li>💼 Kinh doanh & Quản lý tài chính</li>
            <li>🧠 Tâm lý học & Triết lý nhân sinh</li>
          </ul>
          <p>
            Mình hy vọng những video trên kênh sẽ mang đến cho bạn những góc nhìn đa chiều, những bài học thực tế và nguồn cảm hứng bất tận mỗi ngày.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <input
            type="text"
            placeholder="Tìm kiếm sách, tác giả, từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm transition-all text-gray-900"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-10 overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex gap-3">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 border cursor-pointer
                ${activeCategory === category.id 
                  ? 'bg-red-600 text-white border-red-600 shadow-md' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50'
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content State Handling */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-600" />
          <p className="text-lg font-medium">Đang tải video mới nhất...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 flex flex-col items-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không thể tải video</h3>
          <p className="text-gray-600 mb-6 max-w-md">{error}</p>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-left text-sm text-gray-700 w-full max-w-xl">
            <strong className="block mb-2">Hướng dẫn cấu hình (Dành cho Admin):</strong>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Truy cập Google Cloud Console.</li>
              <li>Tạo một dự án và bật <b>YouTube Data API v3</b>.</li>
              <li>Tạo API Key.</li>
              <li>Tìm Channel ID kênh YouTube của bạn.</li>
              <li>Thêm <code>YOUTUBE_API_KEY</code> và <code>YOUTUBE_CHANNEL_ID</code> vào biến môi trường (Secrets).</li>
            </ol>
          </div>
        </div>
      ) : (
        <section aria-labelledby="latest-videos-heading">
          <div className="flex justify-between flex-wrap items-end mb-8 gap-4">
            <h3 id="latest-videos-heading" className="text-2xl font-bold text-gray-900">
              {activeCategory === 'all' ? 'Video mới nhất' : `Sách thể loại: ${CATEGORIES.find(c => c.id === activeCategory)?.name}`}
            </h3>
            <p className="text-sm font-medium text-gray-500">
              Hiển thị {filteredVideos.length} video
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <VideoCard video={video} />
              </motion.div>
            ))}
          </div>

          {visibleCount < filteredVideos.length && (
            <div ref={observerTarget} className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}

          {filteredVideos.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-20 flex flex-col items-center shadow-sm">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy video nào</h4>
              <p className="text-gray-500">
                Chưa có video review nào thuộc thể loại <strong>{CATEGORIES.find(c => c.id === activeCategory)?.name}</strong> trên kênh của mình.
              </p>
              <button 
                onClick={() => setActiveCategory('all')}
                className="mt-6 px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Xem tất cả video
              </button>
            </div>
          )}
        </section>
      )}

      {/* Nút Lên đầu trang */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 hover:scale-110 transition-all duration-300 z-50 group"
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="w-5 h-5" />
          <span className="absolute bottom-full right-1/2 transform translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
            Lên đầu trang
            <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-[5px] border-transparent border-t-gray-800"></span>
          </span>
        </button>
      )}
    </div>
  );
}
