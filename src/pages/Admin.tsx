import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  AlertCircle, 
  Shield,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  QrCode,
  XCircle,
  Clock
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGameWallet } from '@/hooks/useGameWallet';
import { siteConfig } from '@/config/site.config';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GamePayout, gameWalletManager } from '@/lib/gameWallet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import { AdminErrorBoundary } from '@/components/ErrorBoundary';
import { useLoginActions } from '@/hooks/useLoginActions';

// Payouts table component
function PayoutsTable() {
  const { getPayouts } = useGameWallet();
  const payouts = useMemo(() => getPayouts(), [getPayouts]);
  
  // Sort payouts by timestamp (newest first)
  const sortedPayouts = useMemo(() => {
    return [...payouts].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [payouts]);

  if (sortedPayouts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payouts recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPayouts.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} />
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedPayouts.map((payout) => (
          <PayoutCard key={payout.id} payout={payout} />
        ))}
      </div>
      
      <div className="text-sm text-muted-foreground text-center md:text-left">
        Total payouts: {payouts.length} | 
        Total amount: {payouts.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} sats
      </div>
    </div>
  );
}

// Individual payout row component
function PayoutRow({ payout }: { payout: GamePayout }) {
  const { resetWithdrawal } = useGameWallet();
  const author = useAuthor(payout.userPubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || `${payout.userPubkey.slice(0, 8)}...`;
  
  const getStatusIcon = () => {
    switch (payout.status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = () => {
    const isWithdrawal = payout.gameType === 'withdrawal';
    switch (payout.status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return (
          <Badge 
            variant="secondary" 
            className={isWithdrawal ? "bg-blue-100 text-blue-800 border-blue-200 animate-pulse" : ""}
          >
            {isWithdrawal ? 'Awaiting Payment' : 'Pending'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{payout.status}</Badge>;
    }
  };

  const formatGameType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {metadata?.picture && (
            <img 
              src={metadata.picture} 
              alt="" 
              className="h-6 w-6 rounded-full"
            />
          )}
          <span className="text-sm">{displayName}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {payout.gameType === 'withdrawal' && (
            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
          )}
          {formatGameType(payout.gameType)}
        </div>
      </TableCell>
      <TableCell className="font-mono">{payout.amount} sats</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatTimestamp(payout.timestamp)}
      </TableCell>
      <TableCell>
        {(() => {
          const canReset = payout.gameType === 'withdrawal' && 
            (payout.status === 'paid' || payout.status === 'pending') &&
            payout.pullPaymentId?.startsWith('pullpayment_');
          
          return (
            <>
              {canReset && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Reset withdrawal of ${payout.amount} sats? This will restore the balance to the user.`)) {
                      resetWithdrawal(payout.id);
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700 mt-1"
                >
                  Reset Withdrawal
                </Button>
              )}
              {payout.pullPaymentId && (
                <div className="text-xs text-muted-foreground mt-1">
                  {payout.pullPaymentId.startsWith('internal_') ? (
                    <span>Internal transfer</span>
                  ) : payout.pullPaymentId.startsWith('pullpayment_') ? (
                    <span>Pull payment generated</span>
                  ) : (
                    <details>
                      <summary className="cursor-pointer hover:text-foreground">
                        Payment ID
                      </summary>
                      <code className="block mt-1 p-2 bg-gray-50 rounded text-xs break-all">
                        {payout.pullPaymentId}
                      </code>
                    </details>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </TableCell>
    </TableRow>
  );
}

// Mobile payout card component
function PayoutCard({ payout }: { payout: GamePayout }) {
  const { resetWithdrawal } = useGameWallet();
  const author = useAuthor(payout.userPubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || `${payout.userPubkey.slice(0, 8)}...`;
  
  const getStatusBadge = () => {
    const isWithdrawal = payout.gameType === 'withdrawal';
    switch (payout.status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return (
          <Badge 
            variant="secondary" 
            className={isWithdrawal ? "bg-blue-100 text-blue-800 border-blue-200 animate-pulse" : ""}
          >
            {isWithdrawal ? 'Awaiting Payment' : 'Pending'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{payout.status}</Badge>;
    }
  };

  const formatGameType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  const canReset = payout.gameType === 'withdrawal' && 
    (payout.status === 'paid' || payout.status === 'pending') &&
    payout.pullPaymentId?.startsWith('pullpayment_');

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {metadata?.picture && (
              <img 
                src={metadata.picture} 
                alt="" 
                className="h-8 w-8 rounded-full"
              />
            )}
            <div>
              <div className="font-medium text-sm">{displayName}</div>
              <div className="text-xs text-muted-foreground">
                {formatGameType(payout.gameType)}
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <div className="text-lg font-semibold">{payout.amount} sats</div>
            <div className="text-xs text-muted-foreground">
              {formatTimestamp(payout.timestamp)}
            </div>
          </div>
          {payout.gameType === 'withdrawal' && (
            <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        
        
        {canReset && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm(`Reset withdrawal of ${payout.amount} sats? This will restore the balance to the user.`)) {
                resetWithdrawal(payout.id);
              }
            }}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Reset Withdrawal
          </Button>
        )}
        
        {payout.pullPaymentId && (
          <div className="text-xs text-muted-foreground">
            {payout.pullPaymentId.startsWith('internal_') ? (
              <span>Internal transfer</span>
            ) : payout.pullPaymentId.startsWith('pullpayment_') ? (
              <span>Pull payment generated</span>
            ) : (
              <span className="font-mono">ID: {payout.pullPaymentId.slice(0, 16)}...</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function Admin() {
  useSeoMeta({
    title: `Admin - ${siteConfig.name}`,
    description: 'Game wallet administration' });

  const { user } = useCurrentUser();
  const { toast } = useToast();
  const loginActions = useLoginActions();
  const {
    config,
    isAdmin,
    updateConfig,
    totalDailyPayout,
    awardSats,
    getResetableWithdrawals,
    resetWithdrawal,
    canUserEarnMore } = useGameWallet();
  
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Check if browser extension is available
  const hasExtension = typeof window !== 'undefined' && window.nostr;
  
  // Auto-reconnect with extension on mount
  useEffect(() => {
    const tryAutoReconnect = async () => {
      // Only try auto-reconnect if no user is logged in and extension is available
      if (!user && hasExtension && !isReconnecting) {
        try {
          setIsReconnecting(true);
          
          // First check if extension is authorized by trying to get public key
          const pubkey = await window.nostr?.getPublicKey();
          
          if (pubkey) {
            // Check if this pubkey is an admin
            const isAdminPubkey = config.adminPubkeys.includes(pubkey);
            
            if (isAdminPubkey) {
              // Extension is authorized and user is admin, complete the login
              await loginActions.extension();
              
              // Don't reload immediately - let the state update propagate
              // The component will re-render when user state changes
            } else {
              // User is not an admin
              setIsReconnecting(false);
            }
          }
        } catch {
          // Extension not authorized or other error
          setIsReconnecting(false);
        }
      }
    };
    
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(tryAutoReconnect, 100);
    
    return () => clearTimeout(timer);
  }, [hasExtension, config.adminPubkeys]); // Add minimal dependencies
  
  // When user state changes, turn off reconnecting
  useEffect(() => {
    if (user && isReconnecting) {
      setIsReconnecting(false);
    }
  }, [user, isReconnecting]);

  // Show reconnect button for browser extension users
  if (!user && hasExtension && !isReconnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quick Login Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your browser extension needs to authorize this page to access admin features.
              </p>
              <Button 
                onClick={async () => {
                  setIsReconnecting(true);
                  try {
                    await loginActions.extension();
                    // Give it a moment to update state before reloading
                    setTimeout(() => {
                      window.location.reload();
                    }, 500);
                  } catch (error) {
                    console.error('Extension login error:', error);
                    toast({
                      title: 'Login failed',
                      description: error instanceof Error ? error.message : 'Please make sure your browser extension is unlocked and try again.',
                      variant: 'destructive'
                    });
                    setIsReconnecting(false);
                  }
                }}
                className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90"
                disabled={isReconnecting}
              >
                <Shield className="mr-2 h-4 w-4" />
                Authorize with Browser Extension
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Browser extensions require authorization on each page for security.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Show loading state while reconnecting
  if (isReconnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-caribbean-ocean"></div>
                <p className="text-muted-foreground">Reconnecting with browser extension...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    const hasAdmins = config.adminPubkeys.length > 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center mb-4">
                {hasAdmins 
                  ? "You must be an admin to access this page."
                  : "No admins have been configured yet."
                }
              </p>
              <div className="text-center space-x-2">
                {!hasAdmins && user && (
                  <Link to="/admin-setup">
                    <Button className="bg-caribbean-ocean hover:bg-caribbean-ocean/90">
                      <Shield className="mr-2 h-4 w-4" />
                      Setup Admin Access
                    </Button>
                  </Link>
                )}
                <Link to="/">
                  <Button variant="outline">Return Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <AdminErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Game Wallet Admin</h1>
            <p className="text-muted-foreground mt-2">
              Manage game rewards and wallet configuration
            </p>
          </div>

        {/* Statistics Card */}
        <Card className="mb-6 border-caribbean-ocean/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-caribbean-ocean" />
              Today's Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Daily Payouts</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {totalDailyPayout.toLocaleString()} / {config.maxDailyPayout.toLocaleString()} sats
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((totalDailyPayout / config.maxDailyPayout) * 100).toFixed(1)}% of daily limit used
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Withdrawal Method</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={config.pullPaymentId ? "default" : "secondary"}>
                    {config.pullPaymentId ? "Pull Payments" : "Not Configured"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {config.pullPaymentId ? "Instant QR code withdrawals" : "Configure pull payments below"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Tabs */}
        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1">
            <TabsTrigger value="rewards" className="text-xs md:text-sm">
              <DollarSign className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span>Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="limits" className="text-xs md:text-sm">
              <Shield className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span>Limits</span>
            </TabsTrigger>
            <TabsTrigger value="payouts" className="text-xs md:text-sm">
              <ArrowUpRight className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span>Payouts</span>
            </TabsTrigger>
            <TabsTrigger value="btcpay" className="text-xs md:text-sm">
              <QrCode className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span>Pull Payments</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="text-xs md:text-sm">
              <Users className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span>Admins</span>
            </TabsTrigger>
          </TabsList>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <CardTitle>Game Rewards</CardTitle>
                <CardDescription>
                  Configure sats rewards for each game type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trivia-easy" className="text-sm">Trivia - Easy</Label>
                    <div className="relative">
                      <Input
                        id="trivia-easy"
                        type="number"
                        value={config.gameRewards.triviaEasy}
                        onChange={(e) => updateConfig({
                          gameRewards: {
                            ...config.gameRewards,
                            triviaEasy: parseInt(e.target.value) || 0 }
                        })}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">sats</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trivia-medium" className="text-sm">Trivia - Medium</Label>
                    <div className="relative">
                      <Input
                        id="trivia-medium"
                        type="number"
                        value={config.gameRewards.triviaMedium}
                        onChange={(e) => updateConfig({
                          gameRewards: {
                            ...config.gameRewards,
                            triviaMedium: parseInt(e.target.value) || 0 }
                        })}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">sats</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trivia-hard" className="text-sm">Trivia - Hard</Label>
                    <div className="relative">
                      <Input
                        id="trivia-hard"
                        type="number"
                        value={config.gameRewards.triviaHard}
                        onChange={(e) => updateConfig({
                          gameRewards: {
                            ...config.gameRewards,
                            triviaHard: parseInt(e.target.value) || 0 }
                        })}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">sats</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="daily-challenge" className="text-sm">Daily Challenge</Label>
                    <div className="relative">
                      <Input
                        id="daily-challenge"
                        type="number"
                        value={config.gameRewards.dailyChallenge}
                        onChange={(e) => updateConfig({
                          gameRewards: {
                            ...config.gameRewards,
                            dailyChallenge: parseInt(e.target.value) || 0 }
                        })}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">sats</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="achievement-bonus" className="text-sm">Achievement Bonus</Label>
                    <div className="relative">
                      <Input
                        id="achievement-bonus"
                        type="number"
                        value={config.gameRewards.achievementBonus}
                        onChange={(e) => updateConfig({
                          gameRewards: {
                            ...config.gameRewards,
                            achievementBonus: parseInt(e.target.value) || 0 }
                        })}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">sats</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="referral-bonus" className="text-sm">Referral Bonus</Label>
                    <div className="relative">
                      <Input
                        id="referral-bonus"
                        type="number"
                        value={config.gameRewards.referralBonus}
                        onChange={(e) => updateConfig({
                          gameRewards: {
                            ...config.gameRewards,
                            referralBonus: parseInt(e.target.value) || 0 }
                        })}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">sats</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Limits Tab */}
          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle>Payout Limits & Anti-Abuse</CardTitle>
                <CardDescription>
                  Configure daily limits and rate limiting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-daily" className="text-sm">Max Daily Payout (Total)</Label>
                    <div className="relative">
                      <Input
                        id="max-daily"
                        type="number"
                        value={config.maxDailyPayout}
                        onChange={(e) => updateConfig({
                          maxDailyPayout: parseInt(e.target.value) || 0 })}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">sats</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total sats that can be paid out per day
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-user" className="text-sm">Max Per User Per Day</Label>
                    <div className="relative">
                      <Input
                        id="max-user"
                        type="number"
                        value={config.maxPayoutPerUser}
                        onChange={(e) => updateConfig({
                          maxPayoutPerUser: parseInt(e.target.value) || 0 })}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">sats</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min-withdrawal" className="text-sm">Minimum Withdrawal</Label>
                    <div className="relative">
                      <Input
                        id="min-withdrawal"
                        type="number"
                        value={config.minWithdrawal}
                        onChange={(e) => updateConfig({
                          minWithdrawal: parseInt(e.target.value) || 0 })}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">sats</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trivia-limit" className="text-sm">Trivia Per Hour Limit</Label>
                    <Input
                      id="trivia-limit"
                      type="number"
                      value={config.rateLimits.triviaPerHour}
                      onChange={(e) => updateConfig({
                        rateLimits: {
                          ...config.rateLimits,
                          triviaPerHour: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenance"
                    checked={config.maintenanceMode}
                    onCheckedChange={(checked) => updateConfig({ maintenanceMode: checked })}
                  />
                  <Label htmlFor="maintenance" className="cursor-pointer">
                    Maintenance Mode (disables all payouts)
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payout History</CardTitle>
                    <CardDescription>
                      Track all game payouts and withdrawals
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        gameWalletManager.cleanupOldPayouts();
                        window.location.reload();
                      }}
                    >
                      Clean Simulated
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (user) {
                          const success = await awardSats(100, 'trivia', { test: true, reason: 'Admin test award' });
                          if (success) {
                            toast({
                              title: 'Test sats awarded',
                              description: '100 sats added to your balance for testing'
                            });
                          } else {
                            toast({
                              title: 'Failed to award sats',
                              description: `Check console for details. Reason: ${canUserEarnMore.reason || 'Unknown'}`,
                              variant: 'destructive'
                            });
                          }
                        }
                      }}
                      className="bg-blue-50 hover:bg-blue-100"
                    >
                      Add 100 Test Sats
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const resetableWithdrawals = getResetableWithdrawals();
                        if (resetableWithdrawals.length === 0) {
                          toast({
                            title: 'No withdrawals to reset',
                            description: 'No failed withdrawals found'
                          });
                          return;
                        }
                        
                        if (confirm(`Reset ${resetableWithdrawals.length} failed withdrawal(s)? This will restore the sats to user balances.`)) {
                          let resetCount = 0;
                          resetableWithdrawals.forEach(withdrawal => {
                            if (resetWithdrawal(withdrawal.id)) {
                              resetCount++;
                            }
                          });
                          
                          toast({
                            title: 'Withdrawals reset',
                            description: `${resetCount} withdrawal(s) reset successfully`
                          });
                        }
                      }}
                      className="bg-yellow-50 hover:bg-yellow-100"
                    >
                      Reset Failed Withdrawals
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PayoutsTable />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pull Payments Tab */}
          <TabsContent value="btcpay">
            <Card>
              <CardHeader>
                <CardTitle>Pull Payment Configuration</CardTitle>
                <CardDescription>
                  Configure BTCPay Server pull payment for instant QR code withdrawals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.pullPaymentId && config.btcPayServerUrl ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      Pull payment is configured and ready for instant withdrawals
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure pull payment to enable instant QR code withdrawals
                    </AlertDescription>
                  </Alert>
                )}
                
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm">
                    <strong>How it works:</strong> Users generate QR codes instantly using your BTCPay Server pull payment. 
                    Create a pull payment in BTCPay Server, then enter the ID and server URL below.
                  </AlertDescription>
                </Alert>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const serverUrl = formData.get('serverUrl') as string;
                  const storeId = formData.get('storeId') as string;
                  const apiKey = formData.get('apiKey') as string;
                  const pullPaymentId = formData.get('pullPaymentId') as string;
                  
                  await updateConfig({
                    btcPayServerUrl: serverUrl.trim(),
                    btcPayStoreId: storeId.trim(),
                    btcPayApiKey: apiKey.trim(),
                    pullPaymentId: pullPaymentId.trim() || undefined
                  });
                  
                  toast({
                    title: 'Pull payment configured',
                    description: 'Configuration synced across all browsers!' });
                }} className="space-y-4">
                  <div>
                    <Label htmlFor="server-url">BTCPay Server URL</Label>
                    <Input
                      id="server-url"
                      name="serverUrl"
                      type="url"
                      placeholder="https://your-btcpay-server.com"
                      defaultValue={config.btcPayServerUrl || ''}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The URL of your BTCPay Server instance
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="store-id">Store ID</Label>
                    <Input
                      id="store-id"
                      name="storeId"
                      type="text"
                      placeholder="STORE123..."
                      defaultValue={config.btcPayStoreId || ''}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your BTCPay Store ID (found in Store Settings)
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      name="apiKey"
                      type="password"
                      placeholder="••••••••••••••••"
                      defaultValue={config.btcPayApiKey || ''}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Create an API key in BTCPay Server with pull payment permissions
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="pull-payment-id">Shared Pull Payment ID (Optional)</Label>
                    <Input
                      id="pull-payment-id"
                      name="pullPaymentId"
                      type="text"
                      placeholder="abc123def456..."
                      defaultValue={config.pullPaymentId || ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Fallback shared pull payment for when API is not available
                    </p>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <QrCode className="mr-2 h-4 w-4" />
                    Save Pull Payment Configuration
                  </Button>
                </form>
                
                {config.pullPaymentId && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (confirm('Are you sure you want to remove pull payment configuration?')) {
                          await updateConfig({
                            pullPaymentId: undefined,
                            btcPayServerUrl: undefined,
                            btcPayStoreId: undefined,
                            btcPayApiKey: undefined
                          });
                          toast({
                            title: 'Pull payment removed',
                            description: 'Configuration removed from all browsers!' });
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove Configuration
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Admin Management</CardTitle>
                <CardDescription>
                  Manage admin access to the game wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Current Admins</Label>
                    <div className="mt-2 space-y-2">
                      {config.adminPubkeys.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No admins configured</p>
                      ) : (
                        config.adminPubkeys.map((pubkey) => (
                          <div key={pubkey} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <code className="text-xs">{pubkey.slice(0, 16)}...{pubkey.slice(-8)}</code>
                            {pubkey === user.pubkey && (
                              <Badge variant="secondary">You</Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      To add or remove admins, use the game wallet CLI or contact the system administrator.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </AdminErrorBoundary>
  );
}