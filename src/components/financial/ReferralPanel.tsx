import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Copy, 
  Share2, 
  Trophy, 
  Gift,
  Check,
  Info
} from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { useGameWallet } from '@/hooks/useGameWallet';

export function ReferralPanel() {
  const { user } = useCurrentUser();
  const { config } = useGameWallet();
  const { 
    stats, 
    referralLink, 
    copyReferralLink, 
    shareReferralLink 
  } = useReferral();
  const [copied, setCopied] = useState(false);
  
  const referralReward = config.gameRewards?.referralBonus || 100;
  const signupBonus = Math.floor(referralReward * 0.25);

  const handleCopy = () => {
    copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <Card className="border-caribbean-sand">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-caribbean-ocean" />
            Referral Program
          </CardTitle>
          <CardDescription>
            Earn {referralReward} sats for each friend who joins and plays!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Login to get your referral link and start earning
            </AlertDescription>
          </Alert>
          <LoginArea className="w-full" />
        </CardContent>
      </Card>
    );
  }

  const referralProgress = stats ? (stats.successfulReferrals / 10) * 100 : 0;

  return (
    <Card className="border-caribbean-sand">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-caribbean-ocean" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Share your link and earn sats when friends join!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Referrals</p>
            <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Sats Earned</p>
            <p className="text-2xl font-bold text-caribbean-ocean">
              {stats?.totalRewardsEarned || 0}
            </p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Your Referral Link</Label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={shareReferralLink}
              className="flex-shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Referral Code: <code className="font-bold">{stats?.referralCode}</code>
          </p>
        </div>

        {/* How it Works */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Gift className="h-4 w-4" />
            How it Works
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">1</Badge>
              <div>
                <p className="font-medium">Share your link</p>
                <p className="text-muted-foreground">
                  Friends get {signupBonus} sats when they sign up
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">2</Badge>
              <div>
                <p className="font-medium">They play a game</p>
                <p className="text-muted-foreground">
                  After their first game, you earn {referralReward} sats
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">3</Badge>
              <div>
                <p className="font-medium">Unlimited earnings</p>
                <p className="text-muted-foreground">
                  No limit on referrals!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress to Next Milestone */}
        {stats && stats.successfulReferrals < 10 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress to Referral Master</span>
              <span className="font-medium">{stats.successfulReferrals}/10</span>
            </div>
            <Progress value={referralProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Refer 10 friends to unlock the Referral Master achievement!
            </p>
          </div>
        )}

        {/* Achievement Unlocked */}
        {stats && stats.successfulReferrals >= 10 && (
          <Alert className="border-green-200 bg-green-50">
            <Trophy className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm">
              <strong>Referral Master!</strong> You've successfully referred 10+ friends
            </AlertDescription>
          </Alert>
        )}

        {/* Call to Action */}
        <div className="pt-2">
          <Button
            onClick={shareReferralLink}
            className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share & Earn Sats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}