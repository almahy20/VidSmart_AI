import React, { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Loader2, Youtube } from 'lucide-react';
import { extractFrameFromVideo, getYouTubeID, urlImageToBase64, fetchVideoTitle } from '../utils/mediaUtils';
import { analyzeVideoContent } from '../services/geminiService';
import { Video } from '../types';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (video: Video) => void;
}

export const AddVideoModal: React.FC<AddVideoModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAnalysisAndAdd = async (
    sourceType: 'local' | 'url', 
    fileOrUrl: File | string, 
    thumbnail: string,
    imageBase64ForAI: string | null,
    extraContext: string = ""
  ) => {
    setLoading(true);
    try {
      // Prepare context for AI
      let context = sourceType === 'url' ? (fileOrUrl as string) : "تحليل محتوى الفيديو المرفق";
      if (extraContext) {
        context += `\nVideo Title/Context: ${extraContext}`;
      }

      // Call Gemini AI
      const analysis = await analyzeVideoContent(imageBase64ForAI, context);

      const newVideo: Video = {
        id: crypto.randomUUID(),
        type: sourceType,
        title: analysis.title,
        description: analysis.description,
        fullAnalysis: analysis.fullAnalysis,
        thumbnailUrl: thumbnail,
        videoUrl: sourceType === 'url' ? (fileOrUrl as string) : undefined,
        filePreviewUrl: sourceType === 'local' ? thumbnail : undefined,
        playlistId: null, // Default to 'All'
        createdAt: Date.now(),
      };

      onAdd(newVideo);
      onClose();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ غير متوقع. يرجى مراجعة وحدة التحكم (Console).");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('video/')) {
      alert("يرجى اختيار ملف فيديو صالح");
      return;
    }

    try {
      setLoading(true);
      // 1. Extract Frame (Resized automatically in utils)
      const frameBase64 = await extractFrameFromVideo(file);
      // 2. Analyze
      await handleAnalysisAndAdd('local', file, frameBase64, frameBase64);
    } catch (e) {
      console.error(e);
      alert("فشل في معالجة ملف الفيديو. تأكد من أن صيغة الملف مدعومة.");
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setLoading(true);
    const youtubeId = getYouTubeID(urlInput);
    
    if (youtubeId) {
      // 1. Determine Thumbnail URL
      let thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
      let base64 = await urlImageToBase64(thumbnailUrl); 
      
      // Fallback to hqdefault if maxres fetch fails
      if (!base64) {
          thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
          const retryBase64 = await urlImageToBase64(thumbnailUrl);
          if (retryBase64) base64 = retryBase64;
      }

      // 2. Get Title Context (Crucial if base64 is null due to CORS or Load failure)
      let videoTitle = "";
      if (!base64) {
        // If we can't get the image data (common on localhost due to CORS),
        // we fetch the title to give the AI *something* to work with.
        const title = await fetchVideoTitle(urlInput);
        if (title) videoTitle = title;
      }

      // 3. Analyze
      // If base64 is null, Gemini will rely on urlInput + videoTitle
      await handleAnalysisAndAdd('url', urlInput, thumbnailUrl, base64, videoTitle);
    } else {
      // Generic URL
      await handleAnalysisAndAdd('url', urlInput, '', null);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">إضافة فيديو جديد</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'upload' 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={18} />
            رفع من الجهاز
          </button>
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'url' 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
            }`}
            onClick={() => setActiveTab('url')}
          >
            <LinkIcon size={18} />
            رابط فيديو
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 size={48} className="text-blue-500 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold text-white">جاري تحليل الفيديو...</p>
                <p className="text-sm text-slate-400">يقوم الذكاء الاصطناعي باستخراج المعلومات الآن</p>
                <p className="text-xs text-slate-600 mt-2">قد يستغرق هذا بضع ثوانٍ</p>
              </div>
            </div>
          ) : activeTab === 'upload' ? (
            <div 
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-blue-400">
                <Upload size={32} />
              </div>
              <p className="text-white font-medium mb-1">اسحب وأفلت ملف الفيديو هنا</p>
              <p className="text-slate-500 text-sm mb-4">أو اضغط للاختيار من جهازك</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                اختيار ملف
              </button>
            </div>
          ) : (
            <form onSubmit={handleUrlSubmit} className="flex flex-col gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">رابط الفيديو (YouTube)</label>
                <div className="relative">
                  <Youtube className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="url" 
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pr-10 pl-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-200">
                سيقوم النظام بتحليل محتوى الفيديو تلقائياً لإنشاء ملخص ذكي.
              </div>
              <button 
                type="submit" 
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                تحليل وإضافة
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};