import React from 'react';
import { X, Calendar, Layers, ExternalLink } from 'lucide-react';
import { Video } from '../types';

interface VideoDetailModalProps {
  video: Video | null;
  onClose: () => void;
}

export const VideoDetailModal: React.FC<VideoDetailModalProps> = ({ video, onClose }) => {
  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Video Preview */}
        <div className="relative h-64 md:h-80 bg-black shrink-0">
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors"
          >
            <X size={24} />
          </button>

          <div className="absolute bottom-0 right-0 p-8 w-full">
             <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${video.type === 'local' ? 'bg-green-500/80' : 'bg-red-500/80'} text-white`}>
                  {video.type === 'local' ? 'تحميل محلي' : 'YouTube'}
                </span>
                <span className="text-slate-300 text-sm flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(video.createdAt).toLocaleDateString('ar-EG')}
                </span>
             </div>
             <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight shadow-black drop-shadow-lg">
               {video.title}
             </h1>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Analysis */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2">
                  <Layers size={20} />
                  ملخص المحتوى
                </h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  {video.description}
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-bold text-white mb-4">التحليل التفصيلي والنقاط الرئيسية</h3>
                <div className="prose prose-invert prose-lg max-w-none">
                  {/* Rendering full analysis text - simple preserving newlines */}
                  {video.fullAnalysis.split('\n').map((line, i) => (
                    <p key={i} className="text-slate-300 mb-2 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar / Metadata */}
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <h4 className="text-slate-400 text-sm font-semibold uppercase mb-4 tracking-wider">الإجراءات</h4>
                
                {video.type === 'url' && video.videoUrl && (
                  <a 
                    href={video.videoUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mb-3 font-medium"
                  >
                    <ExternalLink size={18} />
                    مشاهدة على YouTube
                  </a>
                )}

                {video.type === 'local' && (
                  <button 
                    disabled
                    className="w-full bg-slate-700 text-slate-400 py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed font-medium"
                  >
                    <Layers size={18} />
                    ملف محفوظ محلياً
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
