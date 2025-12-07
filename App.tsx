import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { VideoCard } from './components/VideoCard';
import { AddVideoModal } from './components/AddVideoModal';
import { VideoDetailModal } from './components/VideoDetailModal';
import { validateApiKey, ApiKeyStatus } from './services/geminiService';
import { Video, Playlist } from './types';
import { Plus, Menu, Search, AlertTriangle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  // State with LocalStorage Initialization
  const [videos, setVideos] = useState<Video[]>(() => {
    try {
      const savedVideos = localStorage.getItem('vidSmart_videos');
      return savedVideos ? JSON.parse(savedVideos) : [];
    } catch (e) {
      console.error("Failed to load videos from storage", e);
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const savedPlaylists = localStorage.getItem('vidSmart_playlists');
      return savedPlaylists ? JSON.parse(savedPlaylists) : [
        { id: '1', name: 'شروحات برمجية' },
        { id: '2', name: 'تصميم جرافيك' }
      ];
    } catch (e) {
      console.error("Failed to load playlists from storage", e);
      return [];
    }
  });

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // API Key Status State
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [isCheckingKey, setIsCheckingKey] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('vidSmart_videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('vidSmart_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Check API Key function
  const checkApiKey = async () => {
    setIsCheckingKey(true);
    const status = await validateApiKey();
    setApiKeyStatus(status);
    setIsCheckingKey(false);
  };

  // Check on Mount
  useEffect(() => {
    checkApiKey();
  }, []);

  // Handlers
  const handleAddVideo = (newVideo: Video) => {
    if (selectedPlaylistId) {
      newVideo.playlistId = selectedPlaylistId;
    }
    setVideos(prev => [newVideo, ...prev]);
  };

  const handleDeleteVideo = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الفيديو؟")) {
      setVideos(prev => prev.filter(v => v.id !== id));
      if (selectedVideo?.id === id) setSelectedVideo(null);
    }
  };

  const handleCreatePlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    setSelectedPlaylistId(newPlaylist.id);
  };

  // Filtering
  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesPlaylist = selectedPlaylistId ? video.playlistId === selectedPlaylistId : true;
      const matchesSearch = 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        video.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPlaylist && matchesSearch;
    });
  }, [videos, selectedPlaylistId, searchQuery]);

  const currentPlaylistName = selectedPlaylistId 
    ? playlists.find(p => p.id === selectedPlaylistId)?.name 
    : 'كل الفيديوهات';

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 h-full w-64 shadow-2xl" onClick={e => e.stopPropagation()}>
             <Sidebar 
               className="w-full h-full"
               playlists={playlists}
               selectedPlaylistId={selectedPlaylistId}
               onSelectPlaylist={(id) => {
                 setSelectedPlaylistId(id);
                 setIsMobileMenuOpen(false);
               }}
               onCreatePlaylist={handleCreatePlaylist}
             />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar 
        className="w-64 hidden md:flex shrink-0"
        playlists={playlists}
        selectedPlaylistId={selectedPlaylistId}
        onSelectPlaylist={setSelectedPlaylistId}
        onCreatePlaylist={handleCreatePlaylist}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {currentPlaylistName}
              <span className="text-slate-500 text-sm font-normal mr-3">({filteredVideos.length})</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* API Status Indicator */}
            {apiKeyStatus?.isValid === false && (
              <div className="hidden lg:flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <div 
                  title={apiKeyStatus.error}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-medium cursor-help"
                >
                  <AlertTriangle size={14} />
                  <span>{apiKeyStatus.error}</span>
                </div>
                <button 
                  onClick={checkApiKey}
                  disabled={isCheckingKey}
                  className={`p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors ${isCheckingKey ? 'animate-spin' : ''}`}
                  title="إعادة التحقق"
                >
                  <RefreshCw size={14} /> 
                </button>
              </div>
            )}
            
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-full px-4 py-2 pr-10 text-sm text-white focus:outline-none focus:border-blue-500 w-64 transition-all focus:w-80"
              />
            </div>
            
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-600/20"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">إضافة فيديو</span>
            </button>
          </div>
        </header>

        {/* Search Mobile / Error Mobile */}
        <div className="md:hidden p-4 border-b border-slate-800 bg-slate-900 space-y-3">
           {apiKeyStatus?.isValid === false && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{apiKeyStatus.error}</span>
                </div>
                <button onClick={checkApiKey} disabled={isCheckingKey}>
                  <RefreshCw size={14} className={isCheckingKey ? 'animate-spin' : ''} />
                </button>
              </div>
            )}
           <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="بحث عن فيديو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg w-full px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map(video => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onClick={setSelectedVideo}
                  onDelete={handleDeleteVideo}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <Menu size={40} className="opacity-20" />
              </div>
              <p className="text-lg font-medium mb-2">لا توجد فيديوهات هنا</p>
              <p className="text-sm">أضف فيديو جديد للبدء في التحليل الذكي</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddVideoModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddVideo}
      />
      
      <VideoDetailModal 
        video={selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
      />
    </div>
  );
};

export default App;