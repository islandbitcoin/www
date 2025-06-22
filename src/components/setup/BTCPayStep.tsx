import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Zap } from 'lucide-react';
import { SetupData } from '@/hooks/useSetupWizard';

interface BTCPayStepProps {
  setupData: SetupData;
  updateSetupData: (updates: Partial<SetupData>) => void;
}

export function BTCPayStep({ setupData, updateSetupData }: BTCPayStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-caribbean-ocean/10 rounded-full flex items-center justify-center">
          <Zap className="h-10 w-10 text-caribbean-ocean" />
        </div>
        <h2 className="text-2xl font-bold">BTCPay Server Setup</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Connect your BTCPay Server to enable Lightning withdrawals. This step is optional but recommended.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="btcpay-url">BTCPay Server URL</Label>
          <Input
            id="btcpay-url"
            type="url"
            placeholder="https://btcpay.yourdomain.com"
            value={setupData.btcPayUrl}
            onChange={(e) => updateSetupData({ btcPayUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            The URL of your BTCPay Server instance
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="store-id">Store ID</Label>
          <Input
            id="store-id"
            placeholder="your-store-id"
            value={setupData.storeId}
            onChange={(e) => updateSetupData({ storeId: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Found in BTCPay Server → Settings → General
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="your-api-key"
            value={setupData.apiKey}
            onChange={(e) => updateSetupData({ apiKey: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Create in BTCPay Server → Account → API Keys (needs pull payment permissions)
          </p>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Don't have BTCPay Server? You can skip this step and add it later, but users won't be able to withdraw their earnings.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}