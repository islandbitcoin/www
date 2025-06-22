import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calculator, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { siteConfig } from '@/config/site.config';

interface PriceData {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

async function fetchBitcoinPrice(): Promise<PriceData> {
  try {
    const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
    const data = await response.json();
    
    // Get price in configured currency
    const currency = siteConfig.community.currency;
    const price = parseFloat(data.data.rates[currency]);
    
    // Mock 24h data for now (in production, use a proper API)
    const change24h = (Math.random() - 0.5) * 10; // -5% to +5%
    const high24h = price * (1 + Math.abs(change24h) / 100);
    const low24h = price * (1 - Math.abs(change24h) / 100);
    
    return { price, change24h, high24h, low24h };
  } catch (error) {
    console.error('Failed to fetch Bitcoin price:', error);
    throw error;
  }
}

interface BitcoinPriceProps {
  compact?: boolean;
}

export function BitcoinPrice({ compact = false }: BitcoinPriceProps) {
  const [fiatAmount, setFiatAmount] = useState('100');
  const [satsAmount, setSatsAmount] = useState('');
  const currency = siteConfig.community.currency;
  
  const { data: priceData, isLoading, refetch } = useQuery({
    queryKey: ['bitcoin-price'],
    queryFn: fetchBitcoinPrice,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
  
  useEffect(() => {
    if (priceData && fiatAmount) {
      const fiat = parseFloat(fiatAmount);
      if (!isNaN(fiat)) {
        const sats = Math.round((fiat / priceData.price) * 100000000);
        setSatsAmount(sats.toLocaleString());
      }
    }
  }, [fiatAmount, priceData]);
  
  const handleSatsChange = (value: string) => {
    const sats = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(sats) && priceData) {
      const fiat = (sats / 100000000) * priceData.price;
      setFiatAmount(fiat.toFixed(2));
    }
  };
  
  if (isLoading) {
    return (
      <Card className="border-caribbean-sand">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!priceData) {
    return null;
  }
  
  const isPositive = priceData.change24h > 0;
  
  // Compact version for sidebar
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">₿</span>
        <span>{currency === 'USD' ? '$' : currency}{priceData.price.toLocaleString()}</span>
        <span className={`flex items-center gap-0.5 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(priceData.change24h).toFixed(1)}%
        </span>
      </div>
    );
  }
  
  return (
    <Card className="border-caribbean-sand hover:border-caribbean-ocean/30 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Bitcoin Price</CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => refetch()}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {currency === 'USD' ? '$' : currency} {priceData.price.toLocaleString()}
            </span>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(priceData.change24h).toFixed(2)}%</span>
            </div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            24h: High {currency} {priceData.high24h.toLocaleString()} • Low {currency} {priceData.low24h.toLocaleString()}
          </div>
        </div>
        
        <div className="space-y-3 pt-2 border-t border-caribbean-sand">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calculator className="h-4 w-4 text-caribbean-ocean" />
            <span>Sats Calculator</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={fiatAmount}
                onChange={(e) => setFiatAmount(e.target.value)}
                placeholder="0"
                className="flex-1 text-sm"
              />
              <span className="text-sm font-medium w-12">{currency}</span>
            </div>
            
            <div className="text-center text-caribbean-ocean">
              <span className="text-xl">=</span>
            </div>
            
            <div className="flex gap-2 items-center">
              <Input
                type="text"
                value={satsAmount}
                onChange={(e) => handleSatsChange(e.target.value)}
                placeholder="0"
                className="flex-1 text-sm"
              />
              <span className="text-sm font-medium w-12">sats</span>
            </div>
          </div>
          
          <div className="text-xs text-center text-muted-foreground pt-2">
            1 Bitcoin = 100,000,000 satoshis
          </div>
        </div>
      </CardContent>
    </Card>
  );
}