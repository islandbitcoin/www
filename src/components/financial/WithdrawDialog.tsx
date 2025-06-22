import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Loader2, AlertCircle, QrCode } from "lucide-react";
import { useGameWallet } from "@/hooks/useGameWallet";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { generateWithdrawalQR, isPullPaymentConfigured } from "@/lib/pullPayment";

interface WithdrawDialogProps {
  open: boolean;
  onClose: () => void;
}

export function WithdrawDialog({ open, onClose }: WithdrawDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [lnurlString, setLnurlString] = useState<string>("");
  const [pullPaymentId, setPullPaymentId] = useState<string>("");
  const { userBalance, config, withdrawSats } = useGameWallet();
  const { user } = useCurrentUser();
  const { toast } = useToast();

  // Check if pull payment is configured
  const isPullPaymentReady = isPullPaymentConfigured(config);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setQrCodeUrl("");
      setLnurlString("");
      setPullPaymentId("");
    }
  }, [open]);

  const handleWithdraw = async () => {
    if (!userBalance || !user) return;

    // Check if pull payment is configured
    if (!isPullPaymentReady) {
      toast({
        title: "Withdrawals not configured",
        description: "Please ask the admin to configure pull payments for withdrawals",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Generate withdrawal QR code using pull payment
      const result = await generateWithdrawalQR(
        {
          pullPaymentId: config.pullPaymentId,
          serverUrl: config.btcPayServerUrl!,
          storeId: config.btcPayStoreId,
          apiKey: config.btcPayApiKey,
        },
        userBalance.balance,
        `Island Bitcoin Game Withdrawal`,
        user.pubkey
      );

      if (!result) {
        throw new Error("Failed to generate withdrawal QR code");
      }

      setQrCodeUrl(result.qrCodeUrl);
      setLnurlString(result.lnurl);
      setPullPaymentId(result.pullPaymentId);

      // DON'T update balance yet - wait for user to actually scan the QR code
      // The balance will be updated when the pull payment is actually claimed
      } catch (error) {
      toast({
        title: "Failed to generate withdrawal",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!userBalance) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-caribbean-mango" />
            Withdraw Sats
          </DialogTitle>
          <DialogDescription>{qrCodeUrl ? "Scan this QR code with your Lightning wallet" : "Generate QR code to withdraw your sats"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center py-4 bg-caribbean-ocean/5 rounded-lg">
            <p className="text-3xl font-bold text-caribbean-ocean">{userBalance.balance.toLocaleString()} sats</p>
            <p className="text-sm text-muted-foreground mt-1">Available for withdrawal</p>
          </div>

          {!qrCodeUrl ? (
            // Show withdraw button when QR not generated yet
            <div className="space-y-4">
              {!isPullPaymentReady && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Withdrawals are not configured yet. Please ask the admin to set up pull payments.</AlertDescription>
                </Alert>
              )}
              
              {isPullPaymentReady && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm">
                    <strong>Remember:</strong> Refresh your browser before withdrawing to ensure your balance is up to date with your latest winnings!
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleWithdraw} disabled={isProcessing || !isPullPaymentReady} className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate Withdrawal QR Code
                  </>
                )}
              </Button>

              <Button type="button" variant="ghost" onClick={onClose} disabled={isProcessing} className="w-full">
                Cancel
              </Button>
            </div>
          ) : (
            // Show QR code when generated
            <div className="space-y-4">
              {/* Space for demo video */}
              <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <p className="text-sm text-muted-foreground">Demo video placeholder</p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <img src={qrCodeUrl} alt="LNURL-withdraw QR Code" className="rounded-lg" />
                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium">Scan this QR code</p>
                  <p className="text-lg font-bold text-caribbean-ocean">Available: {userBalance.balance} sats</p>
                </div>

                {/* Step-by-step instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">!</span>
                    Important: Follow These Steps
                  </h4>
                  <ol className="space-y-2 text-sm text-blue-800">
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">1.</span>
                      <span>Open a lightning wallet that accepts LNURL-withdraw QR Codes (e.g. Flash, Fedi, Breez, Blink, Zeus) </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">2.</span>
                      <span>Scan the QR code above</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="font-bold text-blue-600">3.</span>
                      <div>
                        <span className="font-semibold">IMPORTANT:</span> Your wallet will show an amount field, and it may not automatically fill it in. You
                        must enter the exact amount to withdraw.
                        <div className="mt-1 bg-yellow-100 border border-yellow-300 rounded px-2 py-1">
                          <span className="font-bold">Enter: {userBalance.balance} sats</span>
                        </div>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">4.</span>
                      <span>Click "Withdraw" or "Receive" in your wallet</span>
                    </li>
                  </ol>
                  <div className="mt-3 text-xs text-blue-700 bg-blue-100 rounded p-2">
                    💡 <strong>Tip:</strong> You must enter the exact amount ({userBalance.balance} sats) to receive your funds
                  </div>
                </div>
                {/* Show LNURL string for manual entry */}
                <div className="w-full">
                  <Label className="text-xs">Or copy LNURL manually:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={lnurlString} readOnly className="text-xs font-mono" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(lnurlString);
                        toast({
                          title: "Copied!",
                          description: "LNURL copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQrCodeUrl("");
                      setLnurlString("");
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={async () => {
                      // Mark withdrawal as complete and update balance
                      // Use the unique pull payment ID if available
                      const ppId = pullPaymentId || config.pullPaymentId;
                      const success = await withdrawSats(`pullpayment:${ppId}`);
                      if (success) {
                        toast({
                          title: "Withdrawal recorded",
                          description: "Your balance has been updated",
                        });
                        onClose();
                      }
                    }}
                    className="flex-1 bg-caribbean-ocean hover:bg-caribbean-ocean/90"
                  >
                    I've Claimed It
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
