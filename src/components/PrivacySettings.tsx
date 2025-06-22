import { Shield, Eye, EyeOff, Globe, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePreferences } from '@/hooks/usePreferences';
import { useTorRelay } from '@/lib/torRelays';
import { useToast } from '@/hooks/useToast';

export function PrivacySettings() {
  const { preferences, updatePreferences } = usePreferences();
  const { isAvailable: torAvailable, toggle: toggleTor, relays: torRelays } = useTorRelay();
  const { toast } = useToast();

  const handlePrivacyModeToggle = (enabled: boolean) => {
    updatePreferences({ 
      privacyMode: enabled,
      autoLoadImages: !enabled, // Disable auto-loading images in privacy mode
      useTorRelays: enabled && torAvailable, // Enable Tor if available
    });

    toast({
      title: enabled ? 'Privacy Mode Enabled' : 'Privacy Mode Disabled',
      description: enabled 
        ? 'Enhanced privacy protections are now active' 
        : 'Standard privacy settings restored' });
  };

  const handleTorToggle = (enabled: boolean) => {
    if (!torAvailable && enabled) {
      toast({
        title: 'Tor Not Available',
        description: 'Please use Tor Browser or configure a proxy to enable Tor relays',
        variant: 'destructive' });
      return;
    }

    updatePreferences({ useTorRelays: enabled });
    if (enabled) {
      toggleTor();
    }

    toast({
      title: enabled ? 'Tor Relays Enabled' : 'Tor Relays Disabled',
      description: enabled 
        ? 'Connecting through .onion addresses when available' 
        : 'Using standard relay connections' });
  };

  return (
    <Card className="border-caribbean-sand">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control your privacy and security preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Mode */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="privacy-mode" className="flex items-center gap-2">
                {preferences.privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                Privacy Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Enhanced privacy with disabled tracking and image auto-loading
              </p>
            </div>
            <Switch
              id="privacy-mode"
              checked={preferences.privacyMode || false}
              onCheckedChange={handlePrivacyModeToggle}
            />
          </div>
          
          {preferences.privacyMode && (
            <Alert className="border-caribbean-ocean/20 bg-caribbean-ocean/5">
              <Lock className="h-4 w-4 text-caribbean-ocean" />
              <AlertDescription className="text-sm">
                Privacy mode active: Images won't auto-load, tracking disabled, and Tor preferred when available
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Tor Relays */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tor-relays" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Use Tor Relays
                {!torAvailable && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Requires Tor
                  </Badge>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                Connect through .onion addresses for enhanced anonymity
              </p>
            </div>
            <Switch
              id="tor-relays"
              checked={preferences.useTorRelays || false}
              onCheckedChange={handleTorToggle}
              disabled={!torAvailable}
            />
          </div>

          {preferences.useTorRelays && torAvailable && (
            <div className="pl-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Active Tor Relays:</p>
              {torRelays.map((relay) => (
                <div key={relay.onion} className="text-xs space-y-1">
                  <p className="font-mono text-caribbean-ocean">{relay.name}</p>
                  <p className="text-muted-foreground truncate">{relay.onion}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Privacy Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-images" className="text-sm">
              Auto-load images
            </Label>
            <Switch
              id="auto-images"
              checked={preferences.autoLoadImages !== false}
              onCheckedChange={(checked) => updatePreferences({ autoLoadImages: checked })}
              disabled={preferences.privacyMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ephemeral-default" className="text-sm">
              Default to ephemeral messages
            </Label>
            <Switch
              id="ephemeral-default"
              checked={preferences.ephemeralByDefault || false}
              onCheckedChange={(checked) => updatePreferences({ ephemeralByDefault: checked })}
            />
          </div>
        </div>

        {/* Privacy Tips */}
        <div className="pt-4 border-t border-caribbean-sand">
          <h4 className="text-sm font-medium mb-2">Privacy Tips:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use a VPN or Tor Browser for maximum privacy</li>
            <li>• Don't share personal information in public posts</li>
            <li>• Verify npub addresses before sending sensitive messages</li>
            <li>• Consider using ephemeral messages for sensitive conversations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}