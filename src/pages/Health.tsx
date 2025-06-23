import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNostr } from '@nostrify/react';
import { gameWalletManager } from '@/lib/wallet';
import { configSyncService } from '@/lib/configSync';

interface HealthCheck {
  name: string;
  status: 'checking' | 'healthy' | 'unhealthy' | 'warning';
  message: string;
  latency?: number;
}

export default function Health() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Application', status: 'checking', message: 'Checking...' },
    { name: 'Nostr Relay', status: 'checking', message: 'Checking...' },
    { name: 'Local Storage', status: 'checking', message: 'Checking...' },
    { name: 'Config Service', status: 'checking', message: 'Checking...' },
    { name: 'BTCPay Server', status: 'checking', message: 'Checking...' },
  ]);
  
  const { nostr } = useNostr();

  useEffect(() => {
    const runHealthChecks = async () => {
      const newChecks: HealthCheck[] = [];
      
      // Application health
      newChecks.push({
        name: 'Application',
        status: 'healthy',
        message: `Version: ${import.meta.env.VITE_APP_VERSION || '2.0.0'}`,
      });
      
      // Nostr relay health
      try {
        const start = Date.now();
        const events = await nostr.query([{ kinds: [0], limit: 1 }], { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - start;
        
        newChecks.push({
          name: 'Nostr Relay',
          status: events.length > 0 ? 'healthy' : 'warning',
          message: events.length > 0 ? 'Connected and responding' : 'Connected but no data',
          latency,
        });
      } catch (error) {
        newChecks.push({
          name: 'Nostr Relay',
          status: 'unhealthy',
          message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
      
      // Local storage health
      try {
        const testKey = 'health-check-test';
        localStorage.setItem(testKey, 'test');
        const value = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (value === 'test') {
          const usage = JSON.stringify(localStorage).length;
          newChecks.push({
            name: 'Local Storage',
            status: 'healthy',
            message: `Available and working (${(usage / 1024).toFixed(1)}KB used)`,
          });
        } else {
          throw new Error('Read/write test failed');
        }
      } catch (error) {
        newChecks.push({
          name: 'Local Storage',
          status: 'unhealthy',
          message: `Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
      
      // Config service health
      try {
        const config = gameWalletManager.getConfig();
        const hasAdmins = config.adminPubkeys.length > 0;
        
        newChecks.push({
          name: 'Config Service',
          status: hasAdmins ? 'healthy' : 'warning',
          message: hasAdmins ? `${config.adminPubkeys.length} admin(s) configured` : 'No admins configured',
        });
      } catch (error) {
        newChecks.push({
          name: 'Config Service',
          status: 'unhealthy',
          message: `Config error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
      
      // BTCPay server health
      try {
        const config = gameWalletManager.getConfig();
        if (config.btcPayServerUrl && config.pullPaymentId) {
          const serverHealth = await configSyncService.checkServerHealth();
          
          newChecks.push({
            name: 'BTCPay Server',
            status: serverHealth ? 'healthy' : 'warning',
            message: serverHealth ? 'Connected to sync service' : 'Sync service unavailable',
          });
        } else {
          newChecks.push({
            name: 'BTCPay Server',
            status: 'warning',
            message: 'Not configured',
          });
        }
      } catch (error) {
        newChecks.push({
          name: 'BTCPay Server',
          status: 'unhealthy',
          message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
      
      setChecks(newChecks);
    };
    
    runHealthChecks();
    
    // Run health checks every 30 seconds
    const interval = setInterval(runHealthChecks, 30000);
    
    return () => clearInterval(interval);
  }, [nostr]);
  
  const overallStatus = checks.every(c => c.status === 'healthy') 
    ? 'healthy' 
    : checks.some(c => c.status === 'unhealthy') 
      ? 'unhealthy' 
      : 'warning';
  
  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-gray-500" />;
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };
  
  const getStatusBadge = (status: HealthCheck['status']) => {
    const variants = {
      checking: 'secondary',
      healthy: 'default',
      warning: 'secondary',
      unhealthy: 'destructive',
    } as const;
    
    const labels = {
      checking: 'Checking',
      healthy: 'Healthy',
      warning: 'Warning',
      unhealthy: 'Unhealthy',
    };
    
    return (
      <Badge variant={variants[status]} className="ml-2">
        {labels[status]}
      </Badge>
    );
  };
  
  // Return JSON for automated monitoring
  if (window.location.search.includes('format=json')) {
    return (
      <pre className="p-4">
        {JSON.stringify({
          status: overallStatus,
          timestamp: new Date().toISOString(),
          checks: checks.map(c => ({
            name: c.name,
            status: c.status,
            message: c.message,
            latency: c.latency,
          })),
        }, null, 2)}
      </pre>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Health</span>
              {getStatusBadge(overallStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checks.map((check) => (
                <div key={check.name} className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-medium">{check.name}</h3>
                      {check.latency !== undefined && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({check.latency}ms)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>API Endpoint:</strong> <code>/health?format=json</code>
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Use this endpoint for automated monitoring and alerts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}