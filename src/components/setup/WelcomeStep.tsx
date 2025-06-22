import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Rocket, Shield, Zap, Trophy } from 'lucide-react';
import { NUser } from '@nostrify/react/login';

interface WelcomeStepProps {
  user: NUser | undefined;
}

export function WelcomeStep({ user }: WelcomeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-caribbean-ocean/10 rounded-full flex items-center justify-center">
          <Rocket className="h-10 w-10 text-caribbean-ocean" />
        </div>
        <h2 className="text-2xl font-bold">Welcome to Island Bitcoin!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Let's set up your Bitcoin community site in just a few steps. This wizard will guide you through the initial configuration.
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-semibold">What we'll set up:</h3>
        <div className="grid gap-3">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-caribbean-ocean mt-0.5" />
            <div>
              <p className="font-medium">Admin Access</p>
              <p className="text-sm text-muted-foreground">
                Configure your admin account to manage the site
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-caribbean-ocean mt-0.5" />
            <div>
              <p className="font-medium">Lightning Withdrawals</p>
              <p className="text-sm text-muted-foreground">
                Connect BTCPay Server for instant payouts (optional)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-caribbean-ocean mt-0.5" />
            <div>
              <p className="font-medium">Game Rewards</p>
              <p className="text-sm text-muted-foreground">
                Set reward amounts for games and achievements
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {!user && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Please login with Nostr to continue setup
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}