import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { gameWalletManager } from '@/lib/gameWallet';
import { siteConfig } from '@/config/site.config';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';

export default function AdminSetup() {
  useSeoMeta({
    title: `Admin Setup - ${siteConfig.name}`,
    description: 'Initial admin setup for game wallet',
  });

  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSetup, setIsSetup] = useState(false);

  const config = gameWalletManager.getConfig();
  const hasAdmins = config.adminPubkeys.length > 0;

  const handleSetupAdmin = () => {
    if (!user) return;
    
    // Add current user as admin
    gameWalletManager.addAdmin(user.pubkey);
    setIsSetup(true);
    
    toast({
      title: 'Admin access granted!',
      description: 'You are now an admin of the game wallet system.',
    });
    
    // Redirect to admin page after 2 seconds
    setTimeout(() => {
      navigate('/admin');
    }, 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center mb-4">
                Please sign in with Nostr to access admin setup.
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

  if (hasAdmins && !gameWalletManager.isAdmin(user.pubkey)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Admin Already Configured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center mb-4">
                The admin has already been configured for this system.
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

  if (isSetup || gameWalletManager.isAdmin(user.pubkey)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Setup Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center mb-4">
                Admin access has been configured. Redirecting to admin panel...
              </p>
              <div className="text-center">
                <Link to="/admin">
                  <Button>Go to Admin Panel</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-16">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Setup
            </CardTitle>
            <CardDescription>
              Configure the first admin for the game wallet system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> The first user to access this page will become the admin.
                Make sure you are the intended administrator.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your Nostr public key:
              </p>
              <code className="block p-2 bg-gray-100 rounded text-xs break-all">
                {user.pubkey}
              </code>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">Admin Responsibilities:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Connect and manage the Lightning wallet</li>
                <li>Configure game rewards and limits</li>
                <li>Monitor payouts and wallet balance</li>
                <li>Add or remove other admins</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleSetupAdmin} 
              className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90"
            >
              <Shield className="mr-2 h-4 w-4" />
              Claim Admin Access
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}