import { useSeoMeta } from '@unhead/react';
import { useState } from 'react';
import { User, Settings, Zap, MessageCircle, Eye, EyeOff, Copy, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Navigation } from '@/components/Navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { EditProfileForm } from '@/components/EditProfileForm';
import { useToast } from '@/hooks/useToast';
import { genUserName } from '@/lib/genUserName';

import { useNostrLogin } from '@nostrify/react/login';
import { nip19 } from 'nostr-tools';

const Profile = () => {
  const { user, metadata } = useCurrentUser();
  const { logins } = useNostrLogin();
  const { toast } = useToast();
  const [showNsec, setShowNsec] = useState(false);

  useSeoMeta({
    title: 'Profile - Island Bitcoin',
    description: 'Manage your Island Bitcoin profile and settings.',
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Please Log In</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need to be logged in to view your profile.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = (metadata?.name && typeof metadata.name === 'string') ? metadata.name : genUserName(user.pubkey);
  const profileImage = (metadata?.picture && typeof metadata.picture === 'string') ? metadata.picture : undefined;

  // Get the nsec key if available
  const getNsecKey = (): string | null => {
    if (!user) return null;
    const currentLogin = logins.find(login => login.pubkey === user.pubkey);
    if (currentLogin?.type === 'nsec' && 'nsec' in currentLogin && typeof currentLogin.nsec === 'string') {
      return currentLogin.nsec;
    }
    return null;
  };

  const nsecKey = getNsecKey();
  const npubKey = nip19.npubEncode(user.pubkey);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      {/* Profile Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-2xl">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {displayName}
              </h1>
              {metadata && metadata.about && typeof metadata.about === 'string' && (
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {metadata.about}
                </p>
              )}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {metadata && metadata.nip05 && typeof metadata.nip05 === 'string' && (
                  <Badge variant="secondary" className="text-xs">
                    ✓ Verified
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs font-mono">
                  {user.pubkey.slice(0, 8)}...{user.pubkey.slice(-8)}
                </Badge>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Tip
              </Button>
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Your Posts</CardTitle>
                <CardDescription>
                  Recent posts from your Nostr profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Your posts will appear here</p>
                  <p className="text-sm mt-2">Start sharing your thoughts with the community!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Edit Profile
                    </CardTitle>
                    <CardDescription>
                      Update your profile information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EditProfileForm />
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Public Key (npub)
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(npubKey, "Public key")}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                        {npubKey}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Public Key (hex)
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(user.pubkey, "Public key (hex)")}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                        {user.pubkey}
                      </p>
                    </div>

                    {nsecKey && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Private Key (nsec)
                          </label>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowNsec(!showNsec)}
                              className="h-6 px-2"
                            >
                              {showNsec ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (nsecKey) {
                                  copyToClipboard(nsecKey, "Private key");
                                }
                              }}
                              className="h-6 px-2"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                          {showNsec ? (nsecKey || '') : '•'.repeat(63)}
                        </p>
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            <strong>Keep this private!</strong> Your nsec key gives full access to your account. 
                            Store it safely and never share it with anyone.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    {metadata && metadata.nip05 && typeof metadata.nip05 === 'string' && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          NIP-05 Identifier
                        </label>
                        <p className="text-sm">{metadata.nip05}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lightning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(metadata && metadata.lud16 && typeof metadata.lud16 === 'string') || (metadata && metadata.lud06 && typeof metadata.lud06 === 'string') ? (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Lightning Address
                        </label>
                        <p className="text-sm font-mono">
                          {(metadata && typeof metadata.lud16 === 'string' ? metadata.lud16 : '') || (metadata && typeof metadata.lud06 === 'string' ? metadata.lud06 : '')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No Lightning address configured
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    --
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Posts
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    All time
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    --
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Followers
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Nostr network
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    --
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Zaps Received
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Total sats
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    --
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Engagement
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Avg per post
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;