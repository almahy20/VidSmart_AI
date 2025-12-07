/**
 * Extracts a frame from a local video file at the 1-second mark.
 * Resizes the image to max 512px width to ensure API stability and performance.
 * Returns a base64 Data URL.
 */
export const extractFrameFromVideo = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create a temporary URL for the file
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.crossOrigin = "anonymous";
    video.currentTime = 1; // Capture at 1 second

    video.onloadeddata = () => {
      // Ready
    };

    video.onseeked = () => {
      // Resize logic to avoid huge payloads (API Error 400)
      const MAX_WIDTH = 512;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    // Trigger loading
    video.load();
    // Trigger seek
    video.currentTime = 1.0; 
  });
};

/**
 * Extracts YouTube Video ID from various URL formats.
 */
export const getYouTubeID = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Converts an image URL to a Base64 string.
 * Includes fallback logic for YouTube thumbnails.
 */
export const urlImageToBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Image fetch failed");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    // This is expected on localhost due to CORS
    console.warn("Could not fetch image for base64 conversion (likely CORS or 404).", imageUrl);
    return null;
  }
};

/**
 * Helper to get the best available YouTube thumbnail url
 */
export const getYouTubeThumbnail = (id: string): string => {
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
};

/**
 * Fetches video title using noembed (CORS friendly) as a fallback context
 */
export const fetchVideoTitle = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    return data.title || null;
  } catch (e) {
    console.warn("Failed to fetch video title via oembed", e);
    return null;
  }
};