// NOTE: This file should normally not be modified unless you are adding a new provider.
// To add new routes, edit the AppRouter.tsx file.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHead, UnheadProvider } from '@unhead/react/client';
import { InferSeoMetaPlugin } from '@unhead/addons';
import { Suspense } from 'react';
import NostrProvider from '@/components/NostrProvider';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NostrLoginProvider } from '@nostrify/react/login';
import { AppProvider } from '@/components/AppProvider';
import { AppConfig } from '@/contexts/AppContext';
import AppRouter from './AppRouter';
import { ServiceWorkerProvider } from '@/components/ServiceWorkerProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const head = createHead({
  plugins: [
    InferSeoMetaPlugin(),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

const defaultConfig: AppConfig = {
  theme: "light",
  relayUrl: "wss://relay.primal.net",
};

const presetRelays = [
  { url: 'wss://relay.nostr.band', name: 'Nostr.Band' },
  { url: 'wss://relay.damus.io', name: 'Damus' },
  { url: 'wss://relay.primal.net', name: 'Primal' },
  { url: 'wss://nos.lol', name: 'nos.lol' },
  { url: 'wss://relay.snort.social', name: 'Snort' },
  { url: 'wss://nostr.wine', name: 'Nostr.Wine' },
  { url: 'wss://relay.mostr.pub', name: 'Mostr' },
  { url: 'wss://nostr.bitcoiner.social', name: 'Bitcoiner.Social' },
];

export function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Root application error:', error, errorInfo);
        // In production, you might want to send this to an error tracking service
      }}
    >
      <UnheadProvider head={head}>
        <AppProvider storageKey="nostr:app-config" defaultConfig={defaultConfig} presetRelays={presetRelays}>
          <QueryClientProvider client={queryClient}>
            <NostrLoginProvider storageKey='nostr:login'>
              <NostrProvider>
                <TooltipProvider>
                  <ServiceWorkerProvider>
                    <Toaster />
                    <Sonner />
                    <Suspense>
                      <AppRouter />
                    </Suspense>
                  </ServiceWorkerProvider>
                </TooltipProvider>
              </NostrProvider>
            </NostrLoginProvider>
          </QueryClientProvider>
        </AppProvider>
      </UnheadProvider>
    </ErrorBoundary>
  );
}

export default App;
