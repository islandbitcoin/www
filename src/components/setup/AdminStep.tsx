import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { LoginArea } from '@/components/auth/LoginArea';
import { AlertCircle, Shield, Check } from 'lucide-react';
import { NUser } from '@nostrify/react/login';

interface AdminStepProps {
  user: NUser | undefined;
}

export function AdminStep({ user }: AdminStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-caribbean-ocean/10 rounded-full flex items-center justify-center">
          <Shield className="h-10 w-10 text-caribbean-ocean" />
        </div>
        <h2 className="text-2xl font-bold">Admin Setup</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The first user becomes the admin. You'll be able to add more admins later.
        </p>
      </div>
      
      {user ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <Label>Your Nostr Public Key</Label>
            <code className="block p-2 bg-white rounded text-xs break-all">
              {user.pubkey}
            </code>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Admin Capabilities:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Configure BTCPay Server integration
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Set game rewards and daily limits
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Monitor user payouts and balance
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Add or remove other admins
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please login with Nostr to claim admin access
            </AlertDescription>
          </Alert>
          <LoginArea className="max-w-60 mx-auto" />
        </div>
      )}
    </div>
  );
}