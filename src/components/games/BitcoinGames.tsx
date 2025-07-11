import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Coins } from 'lucide-react';
import { BitcoinTrivia } from './BitcoinTrivia';
import { SatoshiStackerWithRewards } from './SatoshiStackerWithRewards';
import { AnonymousSatsBalance } from '@/components/financial/AnonymousSatsBalance';
import { Leaderboard } from './Leaderboard';
import { ReferralLeaderboard } from './ReferralLeaderboard';
import { useGameWallet } from '@/hooks/useGameWallet';

export function BitcoinGames() {
  const [activeTab, setActiveTab] = useState('trivia');
  const { config } = useGameWallet();
  
  // Check if Satoshi Stacker is enabled
  const isSatoshiStackerEnabled = config.gameVisibility?.satoshiStacker ?? false;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Bitcoin Education Games</h2>
        <p className="text-muted-foreground">
          Learn about Bitcoin while earning real sats!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isSatoshiStackerEnabled ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="trivia" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Bitcoin Trivia
                </TabsTrigger>
                <TabsTrigger value="stacker" className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Satoshi Stacker
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="trivia" className="mt-6">
                <BitcoinTrivia />
              </TabsContent>
              
              <TabsContent value="stacker" className="mt-6">
                <SatoshiStackerWithRewards />
              </TabsContent>
            </Tabs>
          ) : (
            // Only show Bitcoin Trivia when Satoshi Stacker is disabled
            <BitcoinTrivia />
          )}
        </div>
        
        <div className="space-y-6">
          <AnonymousSatsBalance />
          <Leaderboard />
          <ReferralLeaderboard />
        </div>
      </div>
    </div>
  );
}