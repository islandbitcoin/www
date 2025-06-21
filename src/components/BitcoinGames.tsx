import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Coins, Gamepad2, Trophy } from 'lucide-react';
import { BitcoinTrivia } from './BitcoinTrivia';
import { SatoshiStacker } from './SatoshiStacker';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';

export function BitcoinGames() {
  const [activeTab, setActiveTab] = useState('trivia');
  const { user } = useCurrentUser();

  if (!user) {
    return (
      <Card className="border-caribbean-sand">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-caribbean-ocean" />
            Bitcoin Games
          </CardTitle>
          <CardDescription>
            Learn and earn while having fun!
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Trophy className="h-12 w-12 mx-auto text-caribbean-ocean/50" />
            <p className="text-muted-foreground">
              Sign in to play Bitcoin games and earn achievements!
            </p>
            <LoginArea className="max-w-60 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Bitcoin Education Games</h2>
        <p className="text-muted-foreground">
          Learn about Bitcoin while earning virtual sats and achievements!
        </p>
      </div>

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
          <SatoshiStacker />
        </TabsContent>
      </Tabs>
    </div>
  );
}