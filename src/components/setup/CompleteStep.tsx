import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Settings, Users, Copy, Check, ExternalLink } from 'lucide-react';

interface CompleteStepProps {
  copied: boolean;
  copyEnvConfig: () => void;
  navigate: (path: string) => void;
}

export function CompleteStep({ copied, copyEnvConfig, navigate }: CompleteStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Setup Complete!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your Island Bitcoin site is ready. Here's what you can do next:
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-3">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/admin')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Go to Admin Panel
          </Button>
          
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/')}
          >
            <Users className="mr-2 h-4 w-4" />
            View Your Site
          </Button>
          
          <Button
            variant="outline"
            className="justify-start"
            onClick={copyEnvConfig}
          >
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy Environment Variables'}
          </Button>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro tip:</strong> Save the environment variables in a <code>.env</code> file for easy deployment.
          </AlertDescription>
        </Alert>
        
        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Quick Links:</h3>
          <div className="space-y-1 text-sm">
            <a
              href="https://github.com/yourusername/islandbitcoin-web"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-caribbean-ocean hover:underline"
            >
              Documentation
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://docs.btcpayserver.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-caribbean-ocean hover:underline"
            >
              BTCPay Server Docs
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}