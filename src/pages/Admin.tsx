import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wallet, 
  Settings, 
  Users, 
  AlertCircle, 
  Zap,
  Copy,
  Check,
  RefreshCw,
  Shield,
  DollarSign
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGameWallet } from '@/hooks/useGameWallet';
import { siteConfig } from '@/config/site.config';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Admin() {
  useSeoMeta({
    title: `Admin - ${siteConfig.name}`,
    description: 'Game wallet administration',
  });

  const { user } = useCurrentUser();
  const {
    config,
    walletBalance,
    isLoading,
    isAdmin,
    connectWallet,
    disconnectWallet,
    checkWalletBalance,
    updateConfig,
    totalDailyPayout,
  } = useGameWallet();

  const [nwcUri, setNwcUri] = useState('');
  const [copied, setCopied] = useState(false);
  const [showNwcUri, setShowNwcUri] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nwcUri) {
      await connectWallet(nwcUri);
      setNwcUri('');
      setShowNwcUri(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || !isAdmin) {
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
                You must be an admin to access this page.
              </p>
              <div className="text-center">
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
    <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Game Wallet Admin</h1>
          <p className="text-muted-foreground mt-2">
            Manage game rewards and wallet configuration
          </p>
        </div>

        {/* Wallet Status Card */}
        <Card className="mb-6 border-caribbean-ocean/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Status
              </CardTitle>
              {config.isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkWalletBalance}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Connection</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={config.isConnected ? "default" : "secondary"}>
                    {config.isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
              
              {config.isConnected && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet Balance</p>
                    <p className="text-2xl font-bold">
                      {walletBalance !== null ? `${walletBalance.toLocaleString()} sats` : '...'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Payouts</p>
                    <p className="text-2xl font-bold">
                      {totalDailyPayout.toLocaleString()} / {config.maxDailyPayout.toLocaleString()} sats
                    </p>
                  </div>
                </>
              )}
            </div>

            {!config.isConnected && (
              <form onSubmit={handleConnect} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="nwc-uri">NWC Connection URI</Label>
                  <Textarea
                    id="nwc-uri"
                    placeholder="nostr+walletconnect://..."
                    value={nwcUri}
                    onChange={(e) => setNwcUri(e.target.value)}
                    className="font-mono text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get this from your Lightning wallet's Nostr Wallet Connect settings
                  </p>
                </div>
                <Button type="submit" disabled={!nwcUri || isLoading}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </form>
            )}

            {config.isConnected && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNwcUri(!showNwcUri)}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {showNwcUri ? 'Hide' : 'Show'} Connection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={disconnectWallet}
                >
                  Disconnect
                </Button>
              </div>
            )}

            {showNwcUri && config.nwcUri && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <code className="text-xs break-all flex-1">
                      {config.nwcUri.substring(0, 50)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(config.nwcUri!)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Configuration Tabs */}
        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rewards">
              <DollarSign className="mr-2 h-4 w-4" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="limits">
              <Shield className="mr-2 h-4 w-4" />
              Limits
            </TabsTrigger>
            <TabsTrigger value="admins">
              <Users className="mr-2 h-4 w-4" />
              Admins
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trivia-easy">Trivia - Easy</Label>
                    <Input
                      id="trivia-easy"
                      type="number"
                      value={config.gameRewards.triviaEasy}
                      onChange={(e) => updateConfig({
                        gameRewards: {
                          ...config.gameRewards,
                          triviaEasy: parseInt(e.target.value) || 0,
                        }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="trivia-medium">Trivia - Medium</Label>
                    <Input
                      id="trivia-medium"
                      type="number"
                      value={config.gameRewards.triviaMedium}
                      onChange={(e) => updateConfig({
                        gameRewards: {
                          ...config.gameRewards,
                          triviaMedium: parseInt(e.target.value) || 0,
                        }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="trivia-hard">Trivia - Hard</Label>
                    <Input
                      id="trivia-hard"
                      type="number"
                      value={config.gameRewards.triviaHard}
                      onChange={(e) => updateConfig({
                        gameRewards: {
                          ...config.gameRewards,
                          triviaHard: parseInt(e.target.value) || 0,
                        }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="daily-challenge">Daily Challenge</Label>
                    <Input
                      id="daily-challenge"
                      type="number"
                      value={config.gameRewards.dailyChallenge}
                      onChange={(e) => updateConfig({
                        gameRewards: {
                          ...config.gameRewards,
                          dailyChallenge: parseInt(e.target.value) || 0,
                        }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="achievement-bonus">Achievement Bonus</Label>
                    <Input
                      id="achievement-bonus"
                      type="number"
                      value={config.gameRewards.achievementBonus}
                      onChange={(e) => updateConfig({
                        gameRewards: {
                          ...config.gameRewards,
                          achievementBonus: parseInt(e.target.value) || 0,
                        }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="referral-bonus">Referral Bonus</Label>
                    <Input
                      id="referral-bonus"
                      type="number"
                      value={config.gameRewards.referralBonus}
                      onChange={(e) => updateConfig({
                        gameRewards: {
                          ...config.gameRewards,
                          referralBonus: parseInt(e.target.value) || 0,
                        }
                      })}
                    />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-daily">Max Daily Payout (Total)</Label>
                    <Input
                      id="max-daily"
                      type="number"
                      value={config.maxDailyPayout}
                      onChange={(e) => updateConfig({
                        maxDailyPayout: parseInt(e.target.value) || 0,
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Total sats that can be paid out per day
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="max-user">Max Per User Per Day</Label>
                    <Input
                      id="max-user"
                      type="number"
                      value={config.maxPayoutPerUser}
                      onChange={(e) => updateConfig({
                        maxPayoutPerUser: parseInt(e.target.value) || 0,
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="min-withdrawal">Minimum Withdrawal</Label>
                    <Input
                      id="min-withdrawal"
                      type="number"
                      value={config.minWithdrawal}
                      onChange={(e) => updateConfig({
                        minWithdrawal: parseInt(e.target.value) || 0,
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="trivia-limit">Trivia Per Hour Limit</Label>
                    <Input
                      id="trivia-limit"
                      type="number"
                      value={config.rateLimits.triviaPerHour}
                      onChange={(e) => updateConfig({
                        rateLimits: {
                          ...config.rateLimits,
                          triviaPerHour: parseInt(e.target.value) || 0,
                        }
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
  );
}