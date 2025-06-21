import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { useGameWallet } from '@/hooks/useGameWallet';
import { useToast } from '@/hooks/useToast';

interface WithdrawDialogProps {
  open: boolean;
  onClose: () => void;
}

export function WithdrawDialog({ open, onClose }: WithdrawDialogProps) {
  const [invoice, setInvoice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { userBalance, config, withdrawSats } = useGameWallet();
  const { toast } = useToast();
  
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice.trim()) {
      toast({
        title: 'Invalid invoice',
        description: 'Please paste a valid Lightning invoice',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const success = await withdrawSats(invoice);
      if (success) {
        setInvoice('');
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const copyExample = () => {
    const example = 'lnbc100n1p...';
    navigator.clipboard.writeText(example);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!userBalance) return null;
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-caribbean-mango" />
            Withdraw Sats
          </DialogTitle>
          <DialogDescription>
            Withdraw your earned sats to any Lightning wallet
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="text-center py-4 bg-caribbean-ocean/5 rounded-lg">
            <p className="text-3xl font-bold text-caribbean-ocean">
              {userBalance.balance.toLocaleString()} sats
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Available for withdrawal
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="invoice">Lightning Invoice</Label>
            <Textarea
              id="invoice"
              placeholder="Paste your Lightning invoice here (lnbc...)" 
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              className="font-mono text-sm min-h-[100px]"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Generate an invoice for {userBalance.balance} sats in your Lightning wallet
            </p>
          </div>
          
          {!config.isConnected && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                The game wallet is currently offline. Your withdrawal will be processed when the wallet reconnects.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={!invoice.trim() || isProcessing}
              className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Withdraw {userBalance.balance} sats
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={copyExample}
              className="text-xs text-muted-foreground hover:text-caribbean-ocean transition-colors"
            >
              {copied ? (
                <>
                  <Check className="inline h-3 w-3 mr-1" />
                  Copied example
                </>
              ) : (
                <>
                  <Copy className="inline h-3 w-3 mr-1" />
                  Copy example invoice format
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}