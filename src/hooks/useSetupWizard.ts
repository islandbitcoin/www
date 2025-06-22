import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGameWallet } from '@/hooks/useGameWallet';
import { useToast } from '@/hooks/useToast';
import { gameWalletManager } from '@/lib/gameWallet';

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  optional?: boolean;
}

export interface SetupData {
  btcPayUrl: string;
  storeId: string;
  apiKey: string;
  rewards: {
    triviaEasy: number;
    triviaMedium: number;
    triviaHard: number;
  };
}

export function useSetupWizard(steps: SetupStep[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({
    btcPayUrl: '',
    storeId: '',
    apiKey: '',
    rewards: {
      triviaEasy: 5,
      triviaMedium: 10,
      triviaHard: 21
    }
  });
  const [copied, setCopied] = useState(false);
  
  const { user } = useCurrentUser();
  const { config, updateConfig } = useGameWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const isSetupComplete = config.adminPubkeys.length > 0;
  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  useEffect(() => {
    // If setup is already complete, redirect to admin
    if (isSetupComplete && currentStep === 0) {
      navigate('/admin');
    }
  }, [isSetupComplete, currentStep, navigate]);

  const handleNext = async () => {
    const step = steps[currentStep];
    
    if (step.id === 'admin' && user) {
      // Set up admin access
      gameWalletManager.addAdmin(user.pubkey);
      toast({
        title: 'Admin access granted!',
        description: 'You are now an admin.'
      });
    } else if (step.id === 'btcpay' && setupData.btcPayUrl) {
      // Save BTCPay configuration
      await updateConfig({
        btcPayServerUrl: setupData.btcPayUrl,
        btcPayStoreId: setupData.storeId,
        btcPayApiKey: setupData.apiKey
      });
      toast({
        title: 'BTCPay configured!',
        description: 'Lightning withdrawals are now enabled.'
      });
    } else if (step.id === 'rewards') {
      // Save reward configuration
      await updateConfig({
        gameRewards: {
          ...config.gameRewards,
          ...setupData.rewards
        }
      });
      toast({
        title: 'Rewards configured!',
        description: 'Game rewards have been set.'
      });
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const updateSetupData = (updates: Partial<SetupData>) => {
    setSetupData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'admin':
        return !!user;
      case 'btcpay':
        // BTCPay setup is optional
        return true;
      case 'rewards':
        return true;
      default:
        return true;
    }
  };

  const copyEnvConfig = async () => {
    const envConfig = `
# Environment Configuration
VITE_BTCPAY_SERVER_URL=${setupData.btcPayUrl || 'https://your-btcpay.com'}
VITE_BTCPAY_STORE_ID=${setupData.storeId || 'your-store-id'}
VITE_BTCPAY_API_KEY=${setupData.apiKey || 'your-api-key'}

# Game Rewards (in satoshis)
VITE_DEFAULT_TRIVIA_EASY_REWARD=${setupData.rewards.triviaEasy}
VITE_DEFAULT_TRIVIA_MEDIUM_REWARD=${setupData.rewards.triviaMedium}
VITE_DEFAULT_TRIVIA_HARD_REWARD=${setupData.rewards.triviaHard}
    `.trim();

    try {
      await navigator.clipboard.writeText(envConfig);
      setCopied(true);
      toast({
        title: 'Configuration copied!',
        description: 'Environment variables copied to clipboard.'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard. Please copy manually.',
        variant: 'destructive'
      });
    }
  };

  return {
    currentStep,
    currentStepData,
    setupData,
    progress,
    isSetupComplete,
    copied,
    user,
    config,
    canProceed: canProceed(),
    handleNext,
    handlePrevious,
    handleSkip,
    updateSetupData,
    copyEnvConfig,
    navigate
  };
}