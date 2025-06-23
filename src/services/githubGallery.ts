interface GalleryFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
}

interface GalleryCache {
  files: GalleryFile[];
  timestamp: number;
}

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'islandbitcoin';
const REPO_NAME = 'islandbitcoin-community';
const GALLERY_PATH = 'gallery';
const CACHE_KEY = 'islandbitcoin:github-gallery';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'];

export class GitHubGalleryService {
  private static instance: GitHubGalleryService;
  
  static getInstance(): GitHubGalleryService {
    if (!GitHubGalleryService.instance) {
      GitHubGalleryService.instance = new GitHubGalleryService();
    }
    return GitHubGalleryService.instance;
  }

  private loadCache(): GalleryCache | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached) as GalleryCache;
      
      // Check if cache is expired
      if (Date.now() - data.timestamp > CACHE_TTL) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load gallery cache:', error);
      return null;
    }
  }

  private saveCache(files: GalleryFile[]): void {
    try {
      const cache: GalleryCache = {
        files,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save gallery cache:', error);
    }
  }

  private isValidMediaFile(filename: string): boolean {
    const lowerName = filename.toLowerCase();
    return VALID_EXTENSIONS.some(ext => lowerName.endsWith(ext));
  }

  async fetchGalleryFiles(): Promise<GalleryFile[]> {
    // Check cache first
    const cached = this.loadCache();
    if (cached) {
      return cached.files;
    }

    try {
      // Fetch from GitHub API
      const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${GALLERY_PATH}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json() as GalleryFile[];
      
      // Filter for valid media files only
      const mediaFiles = data.filter(file => 
        file.type === 'file' && this.isValidMediaFile(file.name)
      );

      // Cache the results
      this.saveCache(mediaFiles);
      
      return mediaFiles;
    } catch (error) {
      console.error('Failed to fetch gallery files:', error);
      return [];
    }
  }

  getRandomFiles(files: GalleryFile[], count: number): GalleryFile[] {
    if (files.length <= count) {
      return files;
    }

    const shuffled = [...files].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getMediaUrl(file: GalleryFile): string {
    // Use the download_url which points to raw.githubusercontent.com
    return file.download_url;
  }

  getMediaType(file: GalleryFile): 'image' | 'video' {
    const videoExtensions = ['.mp4', '.webm', '.mov'];
    const lowerName = file.name.toLowerCase();
    return videoExtensions.some(ext => lowerName.endsWith(ext)) ? 'video' : 'image';
  }

  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
}