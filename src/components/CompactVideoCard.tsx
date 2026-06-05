import React from 'react';
import { Play } from 'lucide-react';
import { Link } from 'react-router';
import { Video } from '../types';
import { OptimizedImage } from './OptimizedImage';

export function CompactVideoCard({ video, rank }: { video: Video; rank?: number }) {
  const date = new Date(video.publishedAt).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <Link to={`/video/${video.slug ? video.slug + '-' : ''}${video.id}`} className="group flex gap-3 block hover:bg-gray-50 p-2 rounded-lg transition-colors -mx-2 items-center">
      {rank !== undefined && (
        <div className="shrink-0 w-6 font-bold text-lg text-center text-gray-400 group-hover:text-red-500 transition-colors">
          {rank}
        </div>
      )}
      <div className="relative w-28 md:w-32 aspect-video bg-gray-100 rounded-lg overflow-hidden shrink-0">
        <OptimizedImage 
          videoId={video.id}
          title={video.title}
          fallbackSrc={video.thumbnail}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
           <Play className="w-6 h-6 fill-white text-white" />
        </div>
      </div>
      <div className="flex flex-col py-1">
        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors mb-1">
          {video.title}
        </h4>
        <span className="text-xs text-gray-500 font-medium mt-auto">
          {video.viewCount ? `${parseInt(video.viewCount).toLocaleString('vi-VN')} lượt xem • ` : ''}{date}
        </span>
      </div>
    </Link>
  );
}

