import { useSeoMeta } from '@unhead/react';
import { SetupWizard } from '@/components/lazy';
import { LazyWrapper, loadingSkeletons } from '@/components/LazyWrapper';
import { siteConfig } from '@/config/site.config';
import { useGameWallet } from '@/hooks/useGameWallet';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AdminErrorBoundary } from '@/components/ErrorBoundary';

export default function Setup() {
  useSeoMeta({
    title: `Setup Wizard - ${siteConfig.name}`,
    description: 'Initial setup and configuration wizard',
  });

  const { config } = useGameWallet();
  const navigate = useNavigate();

  useEffect(() => {
    // If setup is already complete (has admins), redirect to admin page
    if (config.adminPubkeys.length > 0) {
      navigate('/admin');
    }
  }, [config.adminPubkeys, navigate]);

  return (
    <AdminErrorBoundary>
      <LazyWrapper fallback={loadingSkeletons.admin}>
        <SetupWizard />
      </LazyWrapper>
    </AdminErrorBoundary>
  );
}