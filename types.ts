export interface Video {
  id: string;
  title: string;
  description: string; // Brief summary
  fullAnalysis: string; // Detailed analysis
  thumbnailUrl: string;
  videoUrl?: string; // For YouTube/External
  filePreviewUrl?: string; // For local files
  type: 'local' | 'url';
  playlistId: string | null;
  createdAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  icon?: string;
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  fullAnalysis: string;
}
