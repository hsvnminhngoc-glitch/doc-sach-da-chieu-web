import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { Loader2, AlertCircle, ArrowLeft, Calendar, Youtube, Eye, ThumbsUp, MessageSquare, ShoppingCart, ExternalLink, Share2, Check, Facebook, Twitter } from 'lucide-react';
import { Video } from '../types';
import { CATEGORIES } from '../constants';
import { formatNumber } from '../utils';
import { VideoCard } from '../components/VideoCard';
import { CompactVideoCard } from '../components/CompactVideoCard';

export function VideoDetailPage() {
  const { seoInfo } = useParams<{ seoInfo: string }>();
  // YouTube IDs are 11 characters long. They can contain alphanumerics, underscores, and hyphens.
  const id = seoInfo ? seoInfo.substring(seoInfo.length - 11) : '';
  
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const origin = 'https://docsachthayban.asia';

  const handleShare = async () => {
    if (!video) return;
    const url = `${origin}/video/${video.slug ? video.slug + '-' : ''}${video.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: 'Xem video review trên Đọc Sách Đa Chiều',
          url: url,
        });
      } catch (err) {
        console.error('Lỗi khi chia sẻ:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  useEffect(() => {
    async function fetchVideos() {
      try {
         // reset state on route change somewhat
         setLoading(true);
        const response = await fetch('/api/videos');
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        const data = await response.json();
        setAllVideos(data.videos);
        const found = data.videos.find((v: Video) => v.id === id);
        if (found) {
          setVideo(found);
        } else {
          setError('Video không tồn tại hoặc đã bị xóa.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchVideos();
    }
  }, [id]);

  const { relatedNewVideos, popularVideos, currentCategories, randomVideos } = useMemo(() => {
    if (!video || !allVideos.length) return { relatedNewVideos: [], popularVideos: [], currentCategories: [], randomVideos: [] };

    // Determine current video's categories based on title & playlist & tags
    const tagsStr = (video.tags || []).join(' ');
    const textToSearch = `${video.title} ${video.playlistTitle || ''} ${tagsStr}`.toLowerCase();
    let currentCategories = CATEGORIES.filter(c => c.id !== 'all' && c.keywords.some(k => textToSearch.includes(k.toLowerCase())));
    if (currentCategories.length === 0) currentCategories = [CATEGORIES[0]]; // fallback to 'all'

    // Get all videos that share the same category
    const sameCategoryVideosRaw = allVideos.filter(v => {
      if (v.id === video.id) return false;
      const vTagsStr = (v.tags || []).join(' ');
      const vText = `${v.title} ${v.playlistTitle || ''} ${vTagsStr}`.toLowerCase();
      if (currentCategories[0].id !== 'all') {
        return currentCategories.some(c => c.keywords.some(k => vText.includes(k.toLowerCase())));
      }
      return true;
    });

    // Find other videos using a simple scoring algorithm based on matching tags, playlist, and category
    const scoredVideos = allVideos
      .filter(v => v.id !== video.id)
      .map(v => {
        let score = 0;
        
        // 1. Tag overlap (highest priority)
        if (video.tags && v.tags) {
          const vTagsLower = v.tags.map(t => t.toLowerCase());
          for (const tag of video.tags) {
             if (vTagsLower.includes(tag.toLowerCase())) {
                score += 3; // 3 points for each matching tag
             }
          }
        }
        
        // 2. Same Playlist
        if (video.playlistTitle && v.playlistTitle && video.playlistTitle === v.playlistTitle) {
          score += 2;
        }
        
        // 3. Category keywords overlap
        const vTagsStr = (v.tags || []).join(' ');
        const vText = `${v.title} ${v.playlistTitle || ''} ${vTagsStr}`.toLowerCase();
        if (currentCategories[0].id !== 'all') {
           const matchesCategory = currentCategories.some(c => c.keywords.some(k => vText.includes(k.toLowerCase())));
           if (matchesCategory) {
              score += 1;
           }
        } else {
           // Base score to include them if no other match and category is 'all'
           score += 0.5;
        }

        return { video: v, score };
      })
      .filter(item => item.score > 0) // Keep videos that have some relation
      .sort((a, b) => {
        // Sort by score first
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // If scores are equal, favor newer videos
        return new Date(b.video.publishedAt).getTime() - new Date(a.video.publishedAt).getTime();
      });

    const sameCategoryVideos = scoredVideos.map(item => item.video);

    // Related new: sorted by score (relevancy) and date, take 5
    const relatedNew = sameCategoryVideos.slice(0, 5);

    // Popular videos: strictly sorted by views among all videos in the same category
    const popular = [...sameCategoryVideosRaw]
      // Show popular videos regardless of whether they are in relatedNew
      .sort((a, b) => parseInt(b.viewCount || '0', 10) - parseInt(a.viewCount || '0', 10))
      .slice(0, 4);

    let randomVideos: Video[] = [];
    if (relatedNew.length < 5) {
      const otherVideos = allVideos.filter(v => v.id !== video.id && !relatedNew.some(r => r.id === v.id));
      // Shuffle array to get random videos
      const shuffled = [...otherVideos].sort(() => 0.5 - Math.random());
      randomVideos = shuffled.slice(0, 5);
    }

    return { relatedNewVideos: relatedNew, popularVideos: popular, currentCategories, randomVideos };
  }, [video, allVideos]);

  const affiliateLinks = useMemo(() => {
    if (!video?.description) return [];
    const lines = video.description.split('\n');
    const links: { title: string, url: string, domain: string }[] = [];
    
    for (const line of lines) {
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
         const url = urlMatch[1];
         // Popular e-commerce or shortner domains
         if (url.includes('shopee') || url.includes('shope.ee') || url.includes('tiki.vn') || url.includes('lazada') || url.includes('s.net.vn') || url.includes('go.isclix.com') || url.includes('shorten.asia')) {
             let title = line.replace(url, '').replace(/^[\-:\s]+|[\-:\s]+$/g, '').trim();
             // Remove common prefix words to keep it clean, or use default if empty
             title = title.replace(/^Mua sách( tại| trên)? /i, '');
             
             let domain = 'Shopee';
             if (url.includes('tiki.vn')) domain = 'Tiki';
             else if (url.includes('lazada')) domain = 'Lazada';
             else if (url.includes('shope.ee')) domain = 'Shopee';
             else if (!url.includes('shopee')) domain = 'Link Mua Hàng';

             if (!title || title.length < 2) {
                 title = `Sách được review`;
             }

             if (!links.find(l => l.url === url)) { // prevent duplicates
                links.push({ title, url, domain });
             }
         }
      }
    }
    return links;
  }, [video?.description]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-600" />
        <p className="text-lg font-medium">Đang tải thông tin video...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 flex flex-col items-center text-center max-w-lg w-full mb-6">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không thể tải video</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Trở về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const date = new Date(video.publishedAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const descriptionText = video.description?.replace(/\n/g, ' ').replace(/\s+/g, ' ').substring(0, 160).trim() || "Video review sách chi tiết, cùng bàn luận về những thông điệp và giá trị của cuốn sách này.";
  const highResImage = `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`;
  const videoUrl = `${origin}/video/${video.slug ? video.slug + '-' : ''}${video.id}`;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Helmet>
        <title>{video.title} | Đọc Sách Đa Chiều</title>
        <meta name="description" content={descriptionText} />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content={`${video.title} | Đọc Sách Đa Chiều`} />
        <meta property="og:description" content={descriptionText} />
        <meta property="og:image" content={highResImage} />
        <meta property="og:image:alt" content={video.title} />
        <meta property="og:image:width" content="1280" />
        <meta property="og:image:height" content="720" />
        <meta property="og:type" content="video.other" />
        <meta property="og:url" content={videoUrl} />
        <meta property="og:site_name" content="Đọc Sách Đa Chiều" />
        <meta property="article:published_time" content={video.publishedAt} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${video.title} | Đọc Sách Đa Chiều`} />
        <meta name="twitter:description" content={descriptionText} />
        <meta name="twitter:image" content={highResImage} />
        <meta name="twitter:image:alt" content={video.title} />
        
        <link rel="canonical" href={videoUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "VideoObject",
                "name": video.title,
                "description": video.description || video.title,
                "thumbnailUrl": [video.thumbnail],
                "uploadDate": video.publishedAt,
                "contentUrl": `https://www.youtube.com/watch?v=${video.id}`,
                "embedUrl": `https://www.youtube.com/embed/${video.id}`
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [{
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Trang chủ",
                  "item": origin
                },{
                  "@type": "ListItem",
                  "position": 2,
                  "name": video.title,
                  "item": `${origin}/video/${video.slug ? video.slug + '-' : ''}${video.id}`
                }]
              }
            ]
          })}
        </script>
      </Helmet>
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Quay lại trang chủ
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Video */}
          <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          <div className="max-w-4xl">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {video.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4" />
                {date}
              </div>
              
              <div className="flex items-center gap-4 font-medium">
                <span className="flex items-center gap-1.5 text-gray-700" title="Lượt xem">
                  <Eye className="w-4 h-4" /> {formatNumber(video.viewCount)}
                </span>
                <span className="flex items-center gap-1.5 text-gray-700" title="Lượt thích">
                  <ThumbsUp className="w-4 h-4" /> {formatNumber(video.likeCount)}
                </span>
                <span className="flex items-center gap-1.5 text-gray-700" title="Bình luận">
                  <MessageSquare className="w-4 h-4" /> {formatNumber(video.commentCount)}
                </span>
              </div>
              
              <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
              
              <a 
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-medium text-red-600 hover:text-red-700 transition-colors ml-auto sm:ml-0"
              >
                <Youtube className="w-4 h-4" />
                Xem trên YouTube
              </a>
              
              <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
              
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 mr-1">Chia sẻ:</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${origin}/video/${video.slug ? video.slug + '-' : ''}${video.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  aria-label="Chia sẻ lên Facebook"
                  title="Chia sẻ trên Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${origin}/video/${video.slug ? video.slug + '-' : ''}${video.id}`)}&text=${encodeURIComponent(video.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-500 hover:text-sky-500 hover:bg-sky-50 rounded-full transition-colors"
                  aria-label="Chia sẻ lên Twitter"
                  title="Chia sẻ trên Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <div className="relative group flex items-center">
                  <button
                    onClick={handleShare}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                    aria-label="Copy link video"
                    title="Copy link"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                    {isCopied ? 'Đã chép URL!' : 'Copy link video'}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[5px] border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
              
              {/* Hiển thị badge danh mục, nếu không thuộc danh mục nào thì lấy tên playlist (nếu có) */}
              {((currentCategories && currentCategories.length > 0 && currentCategories[0].id !== 'all') || video.playlistTitle) && (
                <>
                  <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentCategories[0].id !== 'all' ? (
                      currentCategories.map(cat => (
                        <Link to={`/?category=${cat.id}`} key={cat.id} className="inline-flex py-1 px-2.5 rounded-full bg-blue-50 text-blue-700 font-medium text-xs border border-blue-100 hover:bg-blue-100 transition-colors">
                          {cat.name}
                        </Link>
                      ))
                    ) : (
                      <span className="inline-flex py-1 px-2.5 rounded-full bg-blue-50 text-blue-700 font-medium text-xs border border-blue-100 uppercase text-[10px] tracking-wider">
                        {video.playlistTitle || 'KIẾN THỨC'}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="prose prose-gray prose-lg max-w-none">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mô tả video</h3>
              <div className="relative">
                <div className={`transition-all duration-300 overflow-hidden ${(!isDescExpanded && video.description && video.description.length > 350) ? 'max-h-48' : ''}`}>
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-base">
                    {video.description || "Chưa có mô tả cho video này."}
                  </p>
                </div>
                {!isDescExpanded && video.description && video.description.length > 350 && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                )}
              </div>
              {video.description && video.description.length > 350 && (
                <button
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="mt-3 text-red-600 font-semibold hover:text-red-700 transition-colors focus:outline-none flex items-center gap-1"
                >
                  {isDescExpanded ? 'Rút gọn' : 'Xem thêm'}
                </button>
              )}
            </div>
          </div>

          {/* Popular Videos Section (Bottom) */}
          {popularVideos.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Video nổi bật cùng thể loại</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {popularVideos.map(v => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Related New Videos */}
        <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 pt-8 lg:pt-0 lg:pl-8 space-y-8">
           {affiliateLinks.length > 0 && (
             <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Mua sách ủng hộ kênh</h3>
                </div>
                <div className="space-y-3">
                  {affiliateLinks.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col p-3 bg-white border border-red-100 rounded-xl hover:border-red-300 hover:shadow-md transition-all duration-200"
                    >
                      <span className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-red-700 transition-colors">
                        {link.title}
                      </span>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-semibold text-red-600 px-2 py-0.5 bg-red-50 rounded-md">
                           {link.domain}
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-red-600 transition-colors">
                          Chuyển tới trang <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
             </div>
           )}

           <div className="sticky top-24 space-y-10">
             <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Mới nhất cùng thể loại</h3>
                {relatedNewVideos.length > 0 ? (
                  <div className="space-y-4">
                    {relatedNewVideos.map(v => (
                      <CompactVideoCard key={v.id} video={v} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Chưa có video nào cùng thể loại.</p>
                )}
             </div>
             
             {randomVideos.length > 0 && (
               <div>
                 <h3 className="text-xl font-bold text-gray-900 mb-6">Video ngẫu nhiên</h3>
                 <div className="space-y-4">
                   {randomVideos.map(v => (
                     <CompactVideoCard key={v.id} video={v} />
                   ))}
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
