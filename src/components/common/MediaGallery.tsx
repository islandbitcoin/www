import { useState, memo } from 'react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  url: string;
  thumbnail?: string;
  title: string;
  description?: string;
  author?: string;
  date?: string;
  type: 'image' | 'video';
}

interface MediaGalleryProps {
  items: MediaItem[];
  className?: string;
}

export const MediaGallery = memo(function MediaGallery({ items, className }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => new Set(prev).add(id));
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    
    const newIndex = direction === 'prev' 
      ? (selectedIndex - 1 + items.length) % items.length
      : (selectedIndex + 1) % items.length;
    
    setSelectedIndex(newIndex);
  };

  const handleShare = async (item: MediaItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: item.url,
        });
      } catch {
        // Ignore share errors - user may have cancelled
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(item.url);
    }
  };

  const handleDownload = (item: MediaItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
        {items.map((item, index) => (
          <Card
            key={item.id}
            className="group cursor-pointer overflow-hidden border-caribbean-sand hover:border-caribbean-ocean/30 transition-all"
            onClick={() => openLightbox(index)}
          >
            <div className="relative aspect-square">
              {item.type === 'video' ? (
                <>
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    onLoadedData={() => handleImageLoad(item.id)}
                  />
                  {/* Video indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/50 rounded-full p-3">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <OptimizedImage
                  src={item.thumbnail || item.url}
                  alt={item.title}
                  className="w-full h-full"
                  onLoad={() => handleImageLoad(item.id)}
                />
              )}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                  {item.author && (
                    <p className="text-xs opacity-80 mt-1">by {item.author}</p>
                  )}
                </div>
              </div>

              {/* Loading state */}
              {!loadedImages.has(item.id) && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-caribbean-ocean/10 to-caribbean-sunset/10" />
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => closeLightbox()}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95">
          {selectedIndex !== null && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={closeLightbox}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Navigation buttons */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('prev');
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('next');
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              {/* Media content */}
              <div className="relative max-w-full max-h-[80vh]">
                {items[selectedIndex].type === 'video' ? (
                  <video
                    src={items[selectedIndex].url}
                    className="max-w-full max-h-[80vh] object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <OptimizedImage
                    src={items[selectedIndex].url}
                    alt={items[selectedIndex].title}
                    className="max-w-full max-h-[80vh] object-contain"
                    priority
                  />
                )}
              </div>

              {/* Info bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{items[selectedIndex].title}</h3>
                    {items[selectedIndex].description && (
                      <p className="text-sm opacity-80 mt-1">{items[selectedIndex].description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs opacity-60">
                      {items[selectedIndex].author && (
                        <span>by {items[selectedIndex].author}</span>
                      )}
                      {items[selectedIndex].date && (
                        <span>{items[selectedIndex].date}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(items[selectedIndex]);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(items[selectedIndex]);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
});