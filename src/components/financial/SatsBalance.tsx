import { Zap, Wallet, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameWallet } from '@/hooks/useGameWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useState, useEffect } from 'react';
import { WithdrawDialog } from './WithdrawDialog';
import type { UserBalance } from '@/lib/gameWallet';

export function SatsBalance() {
  const { user } = useCurrentUser();
  const { userBalance: walletBalance, config } = useGameWallet();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [userBalance, setUserBalance] = useState(walletBalance);
  
  // Update local state when wallet balance changes
  useEffect(() => {
    if (walletBalance) {
      setUserBalance(walletBalance);
    }
  }, [walletBalance]);
  
  // Listen for balance update events
  useEffect(() => {
    if (!user) return;
    
    const handleBalanceUpdate = (event: CustomEvent<{ pubkey: string; balance: UserBalance }>) => {
      if (event.detail.pubkey === user.pubkey) {
        setUserBalance(event.detail.balance);
      }
    };
    
    window.addEventListener('gameWalletBalanceUpdate', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('gameWalletBalanceUpdate', handleBalanceUpdate as EventListener);
    };
  }, [user]);
  
  if (!user || !userBalance) {
    return null;
  }
  
  const canWithdraw = userBalance.balance >= config.minWithdrawal;
  
  return (
    <>
      <Card className="border-caribbean-sand hover:border-caribbean-ocean/30 transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-caribbean-mango" />
              Your Sats Balance
            </CardTitle>
            {userBalance.pendingBalance > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{userBalance.pendingBalance} pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="h-8 w-8 text-caribbean-mango" />
              <span className="text-3xl font-bold">
                {userBalance.balance.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">available sats</p>
            {userBalance.pendingBalance > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ({userBalance.pendingBalance} pending)
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div>
              <p className="font-medium">{userBalance.totalEarned.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
            <div>
              <p className="font-medium">{userBalance.totalWithdrawn.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Withdrawn</p>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={() => setShowWithdraw(true)}
            disabled={!canWithdraw}
          >
            <Send className="mr-2 h-4 w-4" />
            Withdraw Sats
          </Button>
          
          {!canWithdraw && (
            <p className="text-xs text-center text-muted-foreground">
              Minimum withdrawal: {config.minWithdrawal} sats
            </p>
          )}
        </CardContent>
      </Card>
      
      <WithdrawDialog 
        open={showWithdraw} 
        onClose={() => setShowWithdraw(false)} 
      />
    </>
  );
}