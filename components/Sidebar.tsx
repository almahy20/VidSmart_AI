import React, { useState } from 'react';
import { LayoutGrid, Plus, ListVideo, Folder } from 'lucide-react';
import { Playlist } from '../types';

interface SidebarProps {
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (id: string | null) => void;
  onCreatePlaylist: (name: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  playlists, 
  selectedPlaylistId, 
  onSelectPlaylist, 
  onCreatePlaylist,
  className = ''
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  return (
    <aside className={`bg-slate-900 border-l border-slate-800 flex flex-col h-full ${className}`}>
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <ListVideo className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">VidSmart AI</h1>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          <button
            onClick={() => onSelectPlaylist(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              selectedPlaylistId === null 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutGrid size={18} />
            كل الفيديوهات
          </button>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">قوائم التشغيل</h3>
            <button 
              onClick={() => setIsCreating(true)}
              className="text-slate-500 hover:text-blue-400 transition-colors p-1"
            >
              <Plus size={16} />
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreate} className="mb-4 px-2 animate-in fade-in slide-in-from-top-2">
              <input
                autoFocus
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="اسم القائمة..."
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 mb-2"
                onBlur={() => !newPlaylistName && setIsCreating(false)}
              />
            </form>
          )}

          <div className="space-y-1">
            {playlists.map(playlist => (
              <button
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  selectedPlaylistId === playlist.id 
                    ? 'bg-slate-800 text-white border-r-2 border-blue-500' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Folder size={18} className={selectedPlaylistId === playlist.id ? 'text-blue-400' : 'text-slate-500'} />
                {playlist.name}
              </button>
            ))}
            
            {playlists.length === 0 && !isCreating && (
              <div className="px-4 py-8 text-center border border-dashed border-slate-800 rounded-lg">
                <p className="text-slate-600 text-xs">لا توجد قوائم تشغيل</p>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="text-blue-500 text-xs mt-2 hover:underline"
                >
                  إنشاء قائمة
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-600">
          Powered by Google Gemini 2.5 Flash
        </p>
      </div>
    </aside>
  );
};