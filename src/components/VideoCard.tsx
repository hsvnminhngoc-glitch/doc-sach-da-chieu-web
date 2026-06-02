import React from 'react';
import { Play, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { Link } from 'react-router';
import { Video } from '../types';
import { formatNumber } from '../utils';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  // Format date nicely
  const date = new Date(video.publishedAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <article className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <Link to={`/video/${video.slug ? video.slug + '-' : ''}${video.id}`} className="relative aspect-video bg-gray-100 group block">
        <img 
          src={video.thumbnail} 
          alt={`Ảnh bìa video: ${video.title}`} 
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-red-600 text-white p-4 rounded-full shadow-lg transform group-hover:scale-110 transition-transform duration-300">
            <Play className="w-8 h-8 fill-current" />
          </div>
        </div>
      </Link>
      
      <div className="p-5 flex flex-col flex-1">
        <Link to={`/video/${video.slug ? video.slug + '-' : ''}${video.id}`} className="hover:text-red-600 transition-colors group-hover:text-red-600 mb-2">
          <h2 className="text-xl font-bold text-gray-900 line-clamp-2">
            {video.title}
          </h2>
        </Link>
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 font-medium flex-wrap">
          <span className="flex items-center gap-1.5" title="Lượt xem"><Eye className="w-3.5 h-3.5" /> {formatNumber(video.viewCount)}</span>
          <span className="flex items-center gap-1.5" title="Lượt thích"><ThumbsUp className="w-3.5 h-3.5" /> {formatNumber(video.likeCount)}</span>
          <span className="flex items-center gap-1.5" title="Bình luận"><MessageSquare className="w-3.5 h-3.5" /> {formatNumber(video.commentCount)}</span>
          <time dateTime={video.publishedAt} className="ml-auto">
            {date}
          </time>
        </div>
        <Link to={`/video/${video.slug ? video.slug + '-' : ''}${video.id}`} className="flex-1 mb-4">
          <p className="text-gray-600 text-sm line-clamp-3 hover:text-gray-900 transition-colors">
            {video.description || "Video review sách mới nhất. Mời các bạn cùng theo dõi!"}
          </p>
        </Link>
        <Link 
          to={`/video/${video.slug ? video.slug + '-' : ''}${video.id}`}
          className="text-red-600 font-semibold hover:text-red-700 transition-colors self-start flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}
