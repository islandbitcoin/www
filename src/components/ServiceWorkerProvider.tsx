import { ReactNode } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

export function ServiceWorkerProvider({ children }: { children: ReactNode }) {
  useServiceWorker();
  return <>{children}</>;
}