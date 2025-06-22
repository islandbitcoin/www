import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, LogIn, Trophy, Zap } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useAnonymousPlay } from '@/hooks/useAnonymousPlay';
import { WithdrawDialog } from '@/components/financial/WithdrawDialog';
import { useState } from 'react';

export function AnonymousSatsBalance() {
  const { balance, isAnonymous, canWithdraw, getDisplayName } = useAnonymousPlay();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  return (
    <>
      <Card className="border-caribbean-sand">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-caribbean-ocean" />
            Your Balance
          </CardTitle>
          <CardDescription>
            {isAnonymous ? `Playing as ${getDisplayName()}` : 'Track your earnings'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-caribbean-ocean">
              {balance.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">sats earned</div>
          </div>

          {isAnonymous && balance > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <LogIn className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                Login with Nostr to withdraw your {balance} sats!
              </AlertDescription>
            </Alert>
          )}

          {canWithdraw && balance >= 100 ? (
            <Button 
              onClick={() => setShowWithdrawDialog(true)}
              className="w-full bg-caribbean-sunset hover:bg-caribbean-sunset/90"
            >
              <Zap className="h-4 w-4 mr-2" />
              Withdraw Sats
            </Button>
          ) : isAnonymous ? (
            <LoginArea className="w-full" />
          ) : (
            <Button disabled className="w-full">
              <Coins className="h-4 w-4 mr-2" />
              {balance < 100 ? `Min withdrawal: 100 sats` : 'Withdraw Sats'}
            </Button>
          )}

          {isAnonymous && (
            <div className="text-center space-y-2 pt-2">
              <p className="text-xs text-muted-foreground">
                Play games to earn sats!
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-caribbean-ocean">
                <Trophy className="h-3 w-3" />
                <span>No login required to play</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showWithdrawDialog && (
        <WithdrawDialog
          open={showWithdrawDialog}
          onClose={() => setShowWithdrawDialog(false)}
        />
      )}
    </>
  );
}