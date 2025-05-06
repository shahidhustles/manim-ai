// Helper function to check if a string is a Cloudinary video URL
export const isCloudinaryVideoUrl = (text: string): boolean => {
  // Check if the text is a valid URL
  try {
    const url = new URL(text);
    // Check if it's a Cloudinary URL (typically contains res.cloudinary.com)
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
    console.error(e);
    return false;
  }
  return false;
};
