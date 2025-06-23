import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, TrendingUp, Pickaxe, Zap, DollarSign, Trophy, Loader2, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { secureStorage } from '@/lib/secureStorage';
import { cn } from '@/lib/utils';
import { 
  generateChallenge, 
  solveChallenge, 
  verifySolution, 
  calculateDifficulty, 
  estimateSolveTime,
  type ProofOfWorkChallenge
} from '@/lib/proofOfWork';
import {
  getRewardAmount,
  getRewardTier,
  hasClaimedReward,
  claimReward,
  isClaimRateSuspicious,
  recordClaimAttempt,
  REWARD_TIERS,
  validateLightningAddress
} from '@/services/lightningRewards';

interface StackerState {
  sats: number;
  totalSatsEarned: number;
  clickPower: number;
  autoMiners: number;
  lightningNodes: number;
  miningFarms: number;
  lastPlayedDate: string;
  achievements: string[];
  realSatsEarned: number;
  lastClaimScore: number;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  effect: () => void;
  owned: number;
  maxOwned?: number;
}

export const SatoshiStackerWithRewards = memo(function SatoshiStackerWithRewards() {
  const [state, setState] = useState<StackerState>(() => {
    const saved = secureStorage.get<StackerState>('satoshiStackerState');
    return saved || {
      sats: 0,
      totalSatsEarned: 0,
      clickPower: 1,
      autoMiners: 0,
      lightningNodes: 0,
      miningFarms: 0,
      lastPlayedDate: new Date().toISOString(),
      achievements: [],
      realSatsEarned: 0,
      lastClaimScore: 0,
    };
  });
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [lightningAddress, setLightningAddress] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState<ProofOfWorkChallenge | null>(null);
  const [rewardInvoice, setRewardInvoice] = useState<string>('');
  const [miningProgress, setMiningProgress] = useState(0);
  
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const miningAbortController = useRef<AbortController | null>(null);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  // Calculate passive income
  const passiveIncome = state.autoMiners * 1 + state.lightningNodes * 10 + state.miningFarms * 100;

  // Calculate BTC value
  const btcValue = (state.sats / 100_000_000).toFixed(8);

  // Save state on change
  useEffect(() => {
    secureStorage.set('satoshiStackerState', state);
  }, [state]);

  // Passive income effect
  useEffect(() => {
    if (passiveIncome > 0) {
      const interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          sats: prev.sats + passiveIncome,
          totalSatsEarned: prev.totalSatsEarned + passiveIncome,
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [passiveIncome]);

  // Check achievements
  const checkAchievements = useCallback(() => {
    const newAchievements: string[] = [];
    
    if (state.totalSatsEarned >= 1000 && !state.achievements.includes('first-1k')) {
      newAchievements.push('first-1k');
      toast({
        title: "Achievement Unlocked!",
        description: "First 1K Sats - Keep stacking!",
      });
    }
    
    if (state.totalSatsEarned >= 10000 && !state.achievements.includes('hodler')) {
      newAchievements.push('hodler');
      toast({
        title: "Achievement Unlocked!",
        description: "HODLer - Diamond hands forming!",
      });
    }
    
    if (state.totalSatsEarned >= 100000 && !state.achievements.includes('whale')) {
      newAchievements.push('whale');
      toast({
        title: "Achievement Unlocked!",
        description: "Whale Alert - You're making waves!",
      });
    }
    
    if (newAchievements.length > 0) {
      setState(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...newAchievements],
      }));
    }
  }, [state.totalSatsEarned, state.achievements, toast]);

  useEffect(() => {
    checkAchievements();
  }, [state.totalSatsEarned, checkAchievements]);

  // Handle click
  const handleClick = useCallback(() => {
    setIsAnimating(true);
    setState(prev => ({
      ...prev,
      sats: prev.sats + prev.clickPower,
      totalSatsEarned: prev.totalSatsEarned + prev.clickPower,
    }));
    
    setTimeout(() => setIsAnimating(false), 100);
    
    // Track engagement
    // Note: incrementEngagement is not available in the current gameification hook
  }, [state.clickPower]);

  // Define upgrades
  const upgrades: Upgrade[] = [
    {
      id: 'click-power',
      name: 'Better Mouse',
      description: '+1 sats per click',
      cost: Math.floor(10 * Math.pow(1.5, state.clickPower - 1)),
      icon: <TrendingUp className="h-4 w-4" />,
      effect: () => setState(prev => ({ ...prev, clickPower: prev.clickPower + 1 })),
      owned: state.clickPower - 1,
    },
    {
      id: 'auto-miner',
      name: 'Auto Miner',
      description: '+1 sats per second',
      cost: Math.floor(100 * Math.pow(1.5, state.autoMiners)),
      icon: <Pickaxe className="h-4 w-4" />,
      effect: () => setState(prev => ({ ...prev, autoMiners: prev.autoMiners + 1 })),
      owned: state.autoMiners,
    },
    {
      id: 'lightning-node',
      name: 'Lightning Node',
      description: '+10 sats per second',
      cost: Math.floor(1000 * Math.pow(1.5, state.lightningNodes)),
      icon: <Zap className="h-4 w-4" />,
      effect: () => setState(prev => ({ ...prev, lightningNodes: prev.lightningNodes + 1 })),
      owned: state.lightningNodes,
    },
    {
      id: 'mining-farm',
      name: 'Mining Farm',
      description: '+100 sats per second',
      cost: Math.floor(10000 * Math.pow(1.5, state.miningFarms)),
      icon: <Coins className="h-4 w-4" />,
      effect: () => setState(prev => ({ ...prev, miningFarms: prev.miningFarms + 1 })),
      owned: state.miningFarms,
    },
  ];

  // Buy upgrade
  const buyUpgrade = (upgrade: Upgrade) => {
    if (state.sats >= upgrade.cost) {
      setState(prev => ({ ...prev, sats: prev.sats - upgrade.cost }));
      upgrade.effect();
      
      toast({
        title: "Upgrade Purchased!",
        description: `You bought ${upgrade.name}`,
      });
    }
  };

  // Check if eligible for reward
  const isEligibleForReward = () => {
    if (!user) return false;
    const rewardAmount = getRewardAmount(state.sats);
    if (rewardAmount === 0) return false;
    if (hasClaimedReward(user.pubkey, state.sats)) return false;
    if (state.sats <= state.lastClaimScore) return false;
    return true;
  };

  // Start proof of work mining
  const startMining = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login with Nostr to claim rewards",
        variant: "destructive",
      });
      return;
    }

    if (!lightningAddress || !validateLightningAddress(lightningAddress)) {
      toast({
        title: "Invalid Lightning Address",
        description: "Please enter a valid Lightning address",
        variant: "destructive",
      });
      return;
    }

    if (isClaimRateSuspicious(user.pubkey)) {
      toast({
        title: "Rate Limited",
        description: "Too many claims. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setIsMining(true);
    setMiningProgress(0);
    recordClaimAttempt(user.pubkey);

    // Generate challenge
    const difficulty = calculateDifficulty(state.sats, Math.floor(state.totalSatsEarned / 10000));
    const challenge = generateChallenge(user.pubkey, state.sats, difficulty);
    setCurrentChallenge(challenge);

    // Create abort controller
    miningAbortController.current = new AbortController();

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setMiningProgress(prev => Math.min(prev + Math.random() * 10, 95));
      }, 500);

      // Solve challenge
      const solution = await solveChallenge(challenge, miningAbortController.current.signal);
      
      clearInterval(progressInterval);
      
      if (solution) {
        setMiningProgress(100);
        
        // Verify solution
        const isValid = await verifySolution(challenge, solution);
        if (isValid) {
          // Claim reward
          const response = await claimReward({
            playerPubkey: user.pubkey,
            score: state.sats,
            proofOfWork: {
              challenge: challenge.challenge,
              nonce: solution.nonce,
              hash: solution.hash,
            },
            lightningAddress,
          });

          if (response.success && response.invoice) {
            setRewardInvoice(response.invoice);
            setState(prev => ({
              ...prev,
              realSatsEarned: prev.realSatsEarned + (response.satoshis || 0),
              lastClaimScore: state.sats,
            }));
            
            toast({
              title: "Reward Earned!",
              description: `You earned ${response.satoshis} real sats!`,
            });
          } else {
            toast({
              title: "Claim Failed",
              description: response.error || "Unable to generate invoice",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error('Mining error:', error);
      toast({
        title: "Mining Failed",
        description: "An error occurred during mining",
        variant: "destructive",
      });
    } finally {
      setIsMining(false);
    }
  };

  // Cancel mining
  const cancelMining = () => {
    if (miningAbortController.current) {
      miningAbortController.current.abort();
      setIsMining(false);
      setMiningProgress(0);
    }
  };

  // Copy invoice to clipboard
  const copyInvoice = () => {
    if (rewardInvoice) {
      navigator.clipboard.writeText(rewardInvoice);
      toast({
        title: "Copied!",
        description: "Lightning invoice copied to clipboard",
      });
    }
  };

  // Get next reward tier
  const currentTier = getRewardTier(state.sats);
  const nextTier = REWARD_TIERS.find(t => t.minScore > state.sats);
  const progressToNextTier = nextTier 
    ? ((state.sats - (currentTier?.minScore || 0)) / (nextTier.minScore - (currentTier?.minScore || 0))) * 100
    : 100;

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-caribbean-mango" />
                Satoshi Stacker
              </CardTitle>
              <CardDescription>
                Stack sats and earn real Bitcoin rewards!
              </CardDescription>
            </div>
            <div className="text-right space-y-1">
              <Badge variant="outline" className="text-xs">
                {passiveIncome} sats/sec
              </Badge>
              {state.realSatsEarned > 0 && (
                <Badge variant="default" className="text-xs bg-caribbean-ocean">
                  {state.realSatsEarned} real sats earned
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Balance */}
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-caribbean-ocean">
              {formatNumber(state.sats)} sats
            </div>
            <div className="text-sm text-muted-foreground">
              ≈ {btcValue} BTC
            </div>
            <div className="text-xs text-muted-foreground">
              Total earned: {formatNumber(state.totalSatsEarned)} sats
            </div>
          </div>

          {/* Reward Progress */}
          {currentTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>{currentTier.description}</span>
                <span>{currentTier.satoshis} sats reward</span>
              </div>
              <Progress value={progressToNextTier} className="h-2" />
              {nextTier && (
                <p className="text-xs text-muted-foreground text-center">
                  {formatNumber(nextTier.minScore - state.sats)} sats to {nextTier.description}
                </p>
              )}
            </div>
          )}

          {/* Click Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleClick}
              className={cn(
                "bg-caribbean-mango hover:bg-caribbean-mango/90 transition-all",
                "active:scale-95 select-none",
                isAnimating && "scale-110"
              )}
            >
              <Coins className="mr-2 h-5 w-5" />
              Stack Sats
              <span className="ml-2 text-xs opacity-75">
                +{state.clickPower}
              </span>
            </Button>
          </div>

          {/* Claim Reward Button */}
          {isEligibleForReward() && (
            <div className="flex justify-center">
              <Button
                onClick={() => setShowRewardDialog(true)}
                variant="outline"
                className="bg-gradient-to-r from-caribbean-ocean to-caribbean-turquoise text-white border-0"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Claim {getRewardAmount(state.sats)} Real Sats!
              </Button>
            </div>
          )}

          {/* Upgrades */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Upgrades
            </h4>
            
            {upgrades.map((upgrade) => (
              <div
                key={upgrade.id}
                className="flex items-center justify-between p-3 rounded-lg border border-caribbean-sand hover:border-caribbean-ocean/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-caribbean-ocean">
                    {upgrade.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{upgrade.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {upgrade.description}
                    </p>
                    {upgrade.owned > 0 && (
                      <p className="text-xs text-caribbean-palm mt-1">
                        Owned: {upgrade.owned}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => buyUpgrade(upgrade)}
                  disabled={state.sats < upgrade.cost}
                  className="min-w-[100px]"
                >
                  {formatNumber(upgrade.cost)} sats
                </Button>
              </div>
            ))}
          </div>

          {/* Achievements */}
          {state.achievements.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Achievements
              </h4>
              <div className="flex flex-wrap gap-2">
                {state.achievements.includes('first-1k') && (
                  <Badge variant="secondary" className="text-xs">
                    🥉 First 1K Sats
                  </Badge>
                )}
                {state.achievements.includes('hodler') && (
                  <Badge variant="secondary" className="text-xs">
                    🥈 HODLer (10K)
                  </Badge>
                )}
                {state.achievements.includes('whale') && (
                  <Badge variant="secondary" className="text-xs">
                    🥇 Whale Alert (100K)
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reward Claim Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Claim Your Bitcoin Reward!</DialogTitle>
            <DialogDescription>
              Complete a proof of work challenge to claim {getRewardAmount(state.sats)} real sats
            </DialogDescription>
          </DialogHeader>

          {!isMining && !rewardInvoice && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>How it works:</strong> Solve a computational puzzle to prove you're not a bot. 
                  The difficulty increases with higher rewards. Estimated time: {estimateSolveTime(calculateDifficulty(state.sats, 0))}.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="lightning-address">Lightning Address</Label>
                <Input
                  id="lightning-address"
                  type="email"
                  placeholder="satoshi@getalby.com"
                  value={lightningAddress}
                  onChange={(e) => setLightningAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Lightning address to receive sats
                </p>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowRewardDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={startMining} disabled={!lightningAddress}>
                  Start Mining
                </Button>
              </DialogFooter>
            </div>
          )}

          {isMining && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-caribbean-ocean" />
                <p className="text-sm font-medium">Mining proof of work...</p>
                <Progress value={miningProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  Difficulty: {currentChallenge?.difficulty || 0} leading zeros
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={cancelMining}>
                  Cancel Mining
                </Button>
              </DialogFooter>
            </div>
          )}

          {rewardInvoice && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Success! Your Lightning invoice is ready.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Lightning Invoice</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={rewardInvoice}
                    className="font-mono text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyInvoice}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pay this invoice from any Lightning wallet to receive your sats
                </p>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRewardDialog(false);
                    setRewardInvoice('');
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});