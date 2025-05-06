
// Helper function to check if a string is a video URL (Cloudinary or FFmpeg backend)
export const isCloudinaryVideoUrl = (text: string): boolean => {
  // Check if text is actually a string and not empty
  if (!text || typeof text !== "string" || !text.trim()) {
    return false;
  }

  // Check if the text is a valid URL
  try {
    const url = new URL(text);

    // Check for FFmpeg backend URLs (railway.app)
    if (
      url.hostname.includes("railway.app") ||
      url.hostname.includes("ffmpeg-backend")
    ) {
      return true;
    }

    // Check if it's a Cloudinary URL
    if (url.hostname.includes("cloudinary.com")) {
      // Check for common video extensions or Cloudinary video formats
      const path = url.pathname.toLowerCase();
      return (
        path.endsWith(".mp4") ||
        path.endsWith(".webm") ||
        path.endsWith(".mov") ||
        path.includes("/video/") ||
        path.includes("/video/upload/")
      );
    }
  } catch (e) {
    // Don't log errors for invalid URLs as this might get called frequently
    // with non-URL strings during normal usage
    re
    turn false;
  }

  return false;
};
