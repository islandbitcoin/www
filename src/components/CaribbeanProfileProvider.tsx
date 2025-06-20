import { ReactNode } from 'react';
import { useCaribbeanProfile } from '@/hooks/useCaribbeanProfile';

export function CaribbeanProfileProvider({ children }: { children: ReactNode }) {
  useCaribbeanProfile();
  return <>{children}</>;
}