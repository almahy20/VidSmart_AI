import React from 'react';
import { Play, FileVideo, Trash2 } from 'lucide-react';
import { Video } from '../types';

interface VideoCardProps {
  video: Video;
  onClick: (video: Video) => void;
  onDelete: (id: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, onDelete }) => {
  return (
    <div 
      className="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer flex flex-col h-full"
      onClick={() => onClick(video)}
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        {video.thumbnailUrl ? (
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <FileVideo size={48} />
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play size={20} fill="currentColor" />
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-xs text-white font-medium">
          {video.type === 'local' ? 'ملف محلي' : 'يوتيوب'}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight">
          {video.title}
        </h3>
        <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">
          {video.description}
        </p>
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">
            {new Date(video.createdAt).toLocaleDateString('ar-EG')}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(video.id);
            }}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
            title="حذف الفيديو"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
