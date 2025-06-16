import { useQuery } from '@tanstack/react-query';
import { Users, MessageCircle, Zap, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNostr } from '@nostrify/react';

export function IslandStats() {
  const { nostr } = useNostr();

  const { data: communityStats, isLoading } = useQuery({
    queryKey: ['island-stats'],
    queryFn: async () => {
      const signal = AbortSignal.timeout(3000);
      
      // Get recent Bitcoin-related posts
      const recentPosts = await nostr.query([
        { 
          kinds: [1], 
          '#t': ['bitcoin', 'btc', 'lightning', 'nostr'],
          limit: 100,
          since: Math.floor(Date.now() / 1000) - (24 * 60 * 60) // Last 24 hours
        }
      ], { signal });

      // Get unique authors
      const uniqueAuthors = new Set(recentPosts.map(event => event.pubkey));

      return {
        activeUsers: uniqueAuthors.size,
        recentPosts: recentPosts.length,
        // Mock data for demo purposes
        lightningTips: Math.floor(Math.random() * 1000) + 500,
        globalReach: 42 // Countries
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const stats = [
    {
      icon: Users,
      label: 'Active Users',
      value: isLoading ? '...' : communityStats?.activeUsers?.toString() || '0',
      description: 'Last 24 hours'
    },
    {
      icon: MessageCircle,
      label: 'Recent Posts',
      value: isLoading ? '...' : communityStats?.recentPosts?.toString() || '0',
      description: 'Bitcoin discussions'
    },
    {
      icon: Zap,
      label: 'Lightning Tips',
      value: isLoading ? '...' : communityStats?.lightningTips?.toString() || '0',
      description: 'Sats sent today'
    },
    {
      icon: Globe,
      label: 'Global Reach',
      value: isLoading ? '...' : `${communityStats?.globalReach || 0}+`,
      description: 'Countries'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="text-center border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <stat.icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {stat.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stat.description}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}