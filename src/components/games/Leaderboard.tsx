import { useMemo, useState, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Users, Clock } from 'lucide-react';
import { useGameWallet } from '@/hooks/useGameWallet';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';

interface LeaderboardEntry {
  pubkey: string;
  score: number;
  gameCount: number;
  rank?: number;
}

const LeaderboardRow = memo(function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const author = useAuthor(entry.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || genUserName(entry.pubkey);
  
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };
  
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex-shrink-0 w-8 flex items-center justify-center">
        {getRankIcon()}
      </div>
      
      <Avatar className="h-10 w-10">
        {metadata?.picture && <AvatarImage src={metadata.picture} />}
        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{displayName}</p>
        <p className="text-sm text-muted-foreground">
          {entry.gameCount} games played
        </p>
      </div>
      
      <div className="text-right">
        <p className="font-bold text-lg">{entry.score.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">sats earned</p>
      </div>
    </div>
  );
});

export const Leaderboard = memo(function Leaderboard() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'alltime'>('daily');
  const { getPayouts } = useGameWallet();
  
  const leaderboardData = useMemo(() => {
    const payouts = getPayouts({ status: 'paid' });
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
    
    // Filter payouts by timeframe
    const filteredPayouts = payouts.filter(payout => {
      const payoutDate = new Date(payout.timestamp);
      
      if (timeframe === 'daily') {
        return payoutDate >= startOfDay;
      } else if (timeframe === 'weekly') {
        return payoutDate >= startOfWeek;
      }
      return true; // all time
    }).filter(payout => payout.gameType !== 'withdrawal'); // Exclude withdrawals
    
    // Aggregate scores by user
    const userScores = new Map<string, { score: number; gameCount: number }>();
    
    filteredPayouts.forEach(payout => {
      const current = userScores.get(payout.userPubkey) || { score: 0, gameCount: 0 };
      userScores.set(payout.userPubkey, {
        score: current.score + payout.amount,
        gameCount: current.gameCount + 1
      });
    });
    
    // Convert to array and sort
    const entries: LeaderboardEntry[] = Array.from(userScores.entries())
      .map(([pubkey, data]) => ({
        pubkey,
        score: data.score,
        gameCount: data.gameCount
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10
    
    return entries;
  }, [getPayouts, timeframe]);
  
  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'alltime':
        return 'All Time';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Leaderboard</CardTitle>
            <CardDescription>
              Top earners {getTimeframeLabel().toLowerCase()}
            </CardDescription>
          </div>
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="alltime" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              All Time
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={timeframe} className="mt-6">
            {leaderboardData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No games played {getTimeframeLabel().toLowerCase()} yet.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Be the first to play and earn!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboardData.map((entry, index) => (
                  <LeaderboardRow
                    key={entry.pubkey}
                    entry={entry}
                    rank={index + 1}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});