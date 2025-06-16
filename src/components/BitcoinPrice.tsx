import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BitcoinPriceData {
  bitcoin: {
    usd: number;
    usd_24h_change: number;
  };
}

export function BitcoinPrice() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bitcoin-price'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch Bitcoin price');
      }
      return response.json() as Promise<BitcoinPriceData>;
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Badge variant="secondary" className="text-xs">
        BTC: --
      </Badge>
    );
  }

  const price = data.bitcoin.usd;
  const change24h = data.bitcoin.usd_24h_change;
  const isPositive = change24h >= 0;

  return (
    <Badge 
      variant={isPositive ? "default" : "destructive"} 
      className="text-xs font-mono flex items-center space-x-1"
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span>
        ${price.toLocaleString()} 
        <span className="ml-1 opacity-80">
          ({isPositive ? '+' : ''}{change24h.toFixed(1)}%)
        </span>
      </span>
    </Badge>
  );
}