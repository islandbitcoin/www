import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, Pickaxe, Zap, DollarSign, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useGameification } from '@/hooks/useGameification';
import { secureStorage } from '@/lib/secureStorage';
import { cn } from '@/lib/utils';

interface StackerState {
  sats: number;
  totalSatsEarned: number;
  clickPower: number;
  autoMiners: number;
  lightningNodes: number;
  miningFarms: number;
  lastPlayedDate: string;
  achievements: string[];
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

export function SatoshiStacker() {
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
    };
  });
  
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();
  const { recordActivity, checkAchievements } = useGameification();

  // Calculate passive income per second
  const passiveIncome = 
    (state.autoMiners * 1) + 
    (state.lightningNodes * 10) + 
    (state.miningFarms * 100);

  // Save state whenever it changes
  useEffect(() => {
    secureStorage.set('satoshiStackerState', state);
  }, [state]);

  // Passive income generation
  useEffect(() => {
    if (passiveIncome === 0) return;

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        sats: prev.sats + passiveIncome,
        totalSatsEarned: prev.totalSatsEarned + passiveIncome,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [passiveIncome]);

  // Check for achievements
  useEffect(() => {
    const checkStackerAchievements = () => {
      // First 1000 sats
      if (state.totalSatsEarned >= 1000 && !state.achievements.includes('first-1k')) {
        setState(prev => ({ ...prev, achievements: [...prev.achievements, 'first-1k'] }));
        toast({
          title: '🏆 Achievement Unlocked!',
          description: 'First 1,000 sats earned!',
        });
        checkAchievements('stacker-milestone', { sats: 1000 });
      }

      // 100k sats
      if (state.totalSatsEarned >= 100000 && !state.achievements.includes('first-100k')) {
        setState(prev => ({ ...prev, achievements: [...prev.achievements, 'first-100k'] }));
        toast({
          title: '🏆 Achievement Unlocked!',
          description: 'Stacked 100,000 sats! You\'re a true HODLer!',
        });
        checkAchievements('stacker-milestone', { sats: 100000 });
      }

      // 1M sats (0.01 BTC)
      if (state.totalSatsEarned >= 1000000 && !state.achievements.includes('first-million')) {
        setState(prev => ({ ...prev, achievements: [...prev.achievements, 'first-million'] }));
        toast({
          title: '🏆 Achievement Unlocked!',
          description: 'You\'re a Satoshi Millionaire! 0.01 BTC stacked!',
        });
        checkAchievements('stacker-milestone', { sats: 1000000 });
      }
    };

    checkStackerAchievements();
  }, [state.totalSatsEarned]);

  const handleClick = useCallback(() => {
    setIsAnimating(true);
    setState(prev => ({
      ...prev,
      sats: prev.sats + prev.clickPower,
      totalSatsEarned: prev.totalSatsEarned + prev.clickPower,
    }));
    
    setTimeout(() => setIsAnimating(false), 200);
    recordActivity({ minutesActive: 0.1 });
  }, [state.clickPower, recordActivity]);

  const buyUpgrade = (upgrade: Upgrade) => {
    if (state.sats < upgrade.cost) {
      toast({
        title: 'Insufficient sats',
        description: `You need ${upgrade.cost - state.sats} more sats!`,
        variant: 'destructive',
      });
      return;
    }

    setState(prev => ({ ...prev, sats: prev.sats - upgrade.cost }));
    upgrade.effect();
    
    toast({
      title: 'Upgrade purchased!',
      description: `${upgrade.name} acquired!`,
    });
  };

  const upgrades: Upgrade[] = [
    {
      id: 'click-power',
      name: 'Better Mouse',
      description: '+1 sat per click',
      cost: Math.floor(10 * Math.pow(1.5, state.clickPower - 1)),
      icon: <Pickaxe className="h-4 w-4" />,
      effect: () => setState(prev => ({ ...prev, clickPower: prev.clickPower + 1 })),
      owned: state.clickPower - 1,
    },
    {
      id: 'auto-miner',
      name: 'Auto Miner',
      description: '+1 sat/second',
      cost: Math.floor(100 * Math.pow(1.3, state.autoMiners)),
      icon: <Coins className="h-4 w-4" />,
      effect: () => setState(prev => ({ ...prev, autoMiners: prev.autoMiners + 1 })),
      owned: state.autoMiners,
    },
    {
      id: 'lightning-node',
      name: 'Lightning Node',
      description: '+10 sats/second',
      cost: Math.floor(1000 * Math.pow(1.3, state.lightningNodes)),
      icon: <Zap className="h-4 w-4" />,
      effect: () => setState(prev => ({ ...prev, lightningNodes: prev.lightningNodes + 1 })),
      owned: state.lightningNodes,
    },
    {
      id: 'mining-farm',
      name: 'Mining Farm',
      description: '+100 sats/second',
      cost: Math.floor(10000 * Math.pow(1.3, state.miningFarms)),
      icon: <TrendingUp className="h-4 w-4" />,
      effect: () => setState(prev => ({ ...prev, miningFarms: prev.miningFarms + 1 })),
      owned: state.miningFarms,
    },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const btcValue = (state.sats / 100000000).toFixed(8);

  return (
    <Card className="border-caribbean-sand">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-caribbean-mango" />
              Satoshi Stacker
            </CardTitle>
            <CardDescription>
              Stack sats and build your Bitcoin empire!
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {passiveIncome} sats/sec
          </Badge>
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
              {state.achievements.includes('first-100k') && (
                <Badge variant="secondary" className="text-xs">
                  🥈 100K Stacker
                </Badge>
              )}
              {state.achievements.includes('first-million') && (
                <Badge variant="secondary" className="text-xs">
                  🥇 Satoshi Millionaire
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Progress to next milestone */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Next milestone</span>
            <span>
              {state.totalSatsEarned < 1000 ? '1,000' :
               state.totalSatsEarned < 100000 ? '100,000' :
               state.totalSatsEarned < 1000000 ? '1,000,000' : '10,000,000'} sats
            </span>
          </div>
          <Progress
            value={
              state.totalSatsEarned < 1000 ? (state.totalSatsEarned / 1000) * 100 :
              state.totalSatsEarned < 100000 ? (state.totalSatsEarned / 100000) * 100 :
              state.totalSatsEarned < 1000000 ? (state.totalSatsEarned / 1000000) * 100 :
              (state.totalSatsEarned / 10000000) * 100
            }
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}