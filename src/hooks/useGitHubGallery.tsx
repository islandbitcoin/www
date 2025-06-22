import { useState, useEffect, useCallback } from 'react';
import { GitHubGalleryService } from '@/services/githubGallery';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
}

interface UseGitHubGalleryResult {
  media: MediaItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useGitHubGallery(count: number = 8): UseGitHubGalleryResult {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const galleryService = GitHubGalleryService.getInstance();

  const loadGallery = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all gallery files
      const files = await galleryService.fetchGalleryFiles();
      
      if (files.length === 0) {
        setError('No media files found in gallery');
        return;
      }

      // Get random selection
      const randomFiles = galleryService.getRandomFiles(files, count);
      
      // Convert to MediaItem format
      const mediaItems: MediaItem[] = randomFiles.map(file => ({
        id: file.sha,
        url: galleryService.getMediaUrl(file),
        type: galleryService.getMediaType(file),
        name: file.name,
        size: file.size
      }));

      setMedia(mediaItems);
    } catch (err) {
      console.error('Failed to load gallery:', err);
      setError('Failed to load community gallery');
    } finally {
      setIsLoading(false);
    }
  }, [count, galleryService]);

  const refresh = useCallback(() => {
    // Clear cache to force new random selection
    galleryService.clearCache();
    loadGallery();
  }, [galleryService, loadGallery]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  return {
    media,
    isLoading,
    error,
    refresh
  };
}