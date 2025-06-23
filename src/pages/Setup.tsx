import { useSeoMeta } from '@unhead/react';
import { SetupWizard } from '@/components/lazy';
import { LazyWrapper, loadingSkeletons } from '@/components/LazyWrapper';
import { siteConfig } from '@/config/site.config';
import { AdminErrorBoundary } from '@/components/ErrorBoundary';

export default function Setup() {
  useSeoMeta({
    title: `Setup Wizard - ${siteConfig.name}`,
    description: 'Initial setup and configuration wizard',
  });

  return (
    <AdminErrorBoundary>
      <LazyWrapper fallback={loadingSkeletons.admin}>
        <SetupWizard />
      </LazyWrapper>
    </AdminErrorBoundary>
  );
}