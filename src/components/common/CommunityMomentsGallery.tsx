import { MediaGallery } from '@/components/common/MediaGallery';
import { useGitHubGallery } from '@/hooks/useGitHubGallery';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface CommunityMomentsGalleryProps {
  className?: string;
}

export function CommunityMomentsGallery({ className }: CommunityMomentsGalleryProps) {
  const { media, isLoading, error, refresh } = useGitHubGallery(8);

  // Loading state
  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className || ''}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-caribbean-sand">
            <Skeleton className="aspect-square w-full" />
          </Card>
        ))}
      </div>
    );
  }

  // Error state with fallback message
  if (error || media.length === 0) {
    return (
      <Card className="border-dashed border-2 border-caribbean-sand">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <AlertCircle className="h-12 w-12 text-caribbean-ocean/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Community Gallery Loading...</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {error || 'Gallery photos are being updated'}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Submit your photos at{' '}
            <a 
              href="https://github.com/islandbitcoin/islandbitcoin-community/tree/main/gallery" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-caribbean-ocean hover:underline"
            >
              our GitHub repository
            </a>
          </p>
          <Button 
            onClick={refresh} 
            variant="outline" 
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // Convert media items to MediaGallery format
  const galleryItems = media.map(item => ({
    id: item.id,
    url: item.url,
    thumbnail: item.url, // Use same URL for thumbnail (can be optimized later)
    title: item.name.replace(/\.[^/.]+$/, ''), // Remove file extension
    description: `Community submission - ${(item.size / 1024).toFixed(1)}KB`,
    author: 'Community',
    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    type: item.type
  }));

  return (
    <div className="space-y-4">
      <MediaGallery 
        items={galleryItems} 
        className={className}
      />
      
      {/* Refresh button */}
      <div className="flex justify-center">
        <Button
          onClick={refresh}
          variant="ghost"
          size="sm"
          className="gap-2 text-caribbean-ocean hover:text-caribbean-ocean/80"
        >
          <RefreshCw className="h-4 w-4" />
          Show Different Photos
        </Button>
      </div>
    </div>
  );
}