import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Users, TrendingUp } from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { UserReferralStats } from '@/lib/referralSystem';

function ReferralLeaderboardRow({ 
  stats, 
  rank 
}: { 
  stats: UserReferralStats; 
  rank: number 
}) {
  const author = useAuthor(stats.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || genUserName(stats.pubkey);
  
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
          {stats.successfulReferrals} successful referrals
        </p>
      </div>
      
      <div className="text-right">
        <p className="font-bold text-lg">{stats.totalRewardsEarned.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">sats earned</p>
      </div>
    </div>
  );
}

export function ReferralLeaderboard() {
  const { getReferralLeaderboard } = useReferral();
  const leaderboard = getReferralLeaderboard();

  return (
    <Card className="border-caribbean-sand">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-caribbean-ocean" />
              Top Referrers
            </CardTitle>
            <CardDescription>
              Users who brought the most friends
            </CardDescription>
          </div>
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              No referrals yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to refer a friend!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((stats, index) => (
              <ReferralLeaderboardRow
                key={stats.pubkey}
                stats={stats}
                rank={index + 1}
              />
            ))}
          </div>
        )}
        
        {leaderboard.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Referral Rewards</span>
              <Badge variant="secondary" className="font-mono">
                {leaderboard.reduce((sum, s) => sum + s.totalRewardsEarned, 0).toLocaleString()} sats
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}