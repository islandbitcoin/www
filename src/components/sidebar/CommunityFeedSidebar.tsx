import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { NostrPostBox, NostrFeed } from '@/components/social';
import { BitcoinPrice } from '@/components/financial';
import { StreakDisplay } from '@/components/games';
import { RelaySelector } from '@/components/common/RelaySelector';
import { RelayStatusIndicator } from '@/components/common/RelayStatusIndicator';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Globe, Users, Zap, ChevronRight, AlertCircle } from 'lucide-react';
import { siteConfig } from '@/config/site.config';

interface CommunityFeedSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommunityFeedSidebar({ isOpen, onOpenChange }: CommunityFeedSidebarProps) {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('community');

  const CommunityHighlights = () => (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs sm:text-sm font-semibold">Active Members</h4>
        <Badge variant="secondary" className="text-xs">
          {siteConfig.nostr.communityDomains.length} domains
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {siteConfig.nostr.communityDomains.slice(0, 4).map((domain) => (
          <Card key={domain} className="p-1.5 sm:p-2 text-center">
            <p className="text-xs text-muted-foreground truncate">@{domain}</p>
          </Card>
        ))}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full text-xs sm:text-sm"
        onClick={() => setActiveTab('directory')}
      >
        View All Members
        <ChevronRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );

  const _EmptyFeedMessage = ({ mode }: { mode: string }) => (
    <Card className="border-dashed">
      <div className="p-6 text-center space-y-3">
        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">No posts found</p>
          <p className="text-xs text-muted-foreground">
            {mode === 'community' 
              ? 'Community members haven\'t posted yet' 
              : 'Try switching to a different relay'}
          </p>
        </div>
        <RelaySelector className="w-full max-w-xs mx-auto" />
      </div>
    </Card>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
          <SheetTitle className="text-lg sm:text-xl">Island Bitcoin Community</SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            Connect with the Caribbean Bitcoin community
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
            {siteConfig.features.bitcoinPrice && <BitcoinPrice compact />}
            {user && <StreakDisplay compact />}
          </div>
        </SheetHeader>

        <div className="px-4 sm:px-6 py-2 sm:py-3 space-y-2 sm:space-y-3 border-b bg-muted/30 shrink-0">
          <RelayStatusIndicator className="w-full justify-start" />
          {user && (
            <NostrPostBox />
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b h-auto p-0 shrink-0">
            <TabsTrigger 
              value="community" 
              className="rounded-none border-r data-[state=active]:bg-background data-[state=active]:shadow-none py-2 sm:py-3 text-xs sm:text-sm"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Community</span>
              <span className="sm:hidden">Comm</span>
            </TabsTrigger>
            <TabsTrigger 
              value="global" 
              className="rounded-none border-r data-[state=active]:bg-background data-[state=active]:shadow-none py-2 sm:py-3 text-xs sm:text-sm"
            >
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Global
            </TabsTrigger>
            <TabsTrigger 
              value="directory" 
              className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none py-2 sm:py-3 text-xs sm:text-sm"
            >
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Directory</span>
              <span className="sm:hidden">Dir</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 overflow-auto">
            <TabsContent value="community" className="p-3 sm:p-4 space-y-3 sm:space-y-4 mt-0">
              <CommunityHighlights />
              <Separator />
              <div className="overflow-x-hidden">
                <NostrFeed 
                  limit={20} 
                  mode="community"
                  showDebugInfo={false}
                />
              </div>
            </TabsContent>

            <TabsContent value="global" className="p-3 sm:p-4 space-y-3 sm:space-y-4 mt-0">
              <div className="space-y-2 mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Latest posts from the global Nostr network
                </p>
                <RelaySelector className="w-full" />
              </div>
              <div className="overflow-x-hidden">
                <NostrFeed 
                  limit={20} 
                  mode="general"
                  showDebugInfo={false}
                />
              </div>
            </TabsContent>

            <TabsContent value="directory" className="p-3 sm:p-4 space-y-3 sm:space-y-4 mt-0">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Community Domains</h3>
                  <div className="space-y-2">
                    {siteConfig.nostr.communityDomains.map((domain) => (
                      <Card key={domain} className="p-2 sm:p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className="text-xs sm:text-sm font-medium truncate">@{domain}</span>
                          <Badge variant="outline" className="text-xs w-fit">
                            NIP-05 Verified
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">How to Join</h3>
                  <ol className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="break-words">1. Get a NIP-05 identifier from one of our community domains</li>
                    <li className="break-words">2. Start posting with the #islandbitcoin tag</li>
                    <li className="break-words">3. Connect with other Caribbean Bitcoiners</li>
                  </ol>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}