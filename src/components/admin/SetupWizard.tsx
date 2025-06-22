import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Coins
} from 'lucide-react';
import { useSetupWizard, SetupStep } from '@/hooks/useSetupWizard';
import { 
  WelcomeStep, 
  AdminStep, 
  BTCPayStep, 
  RewardsStep, 
  CompleteStep 
} from '@/components/setup';

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Get started with Island Bitcoin',
    icon: <Rocket className="h-5 w-5" />
  },
  {
    id: 'admin',
    title: 'Admin Setup',
    description: 'Configure your admin account',
    icon: <Shield className="h-5 w-5" />
  },
  {
    id: 'btcpay',
    title: 'BTCPay Server',
    description: 'Connect Lightning withdrawals (optional)',
    icon: <Zap className="h-5 w-5" />,
    optional: true
  },
  {
    id: 'rewards',
    title: 'Game Rewards',
    description: 'Set reward amounts',
    icon: <Coins className="h-5 w-5" />
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Your site is ready!',
    icon: <CheckCircle className="h-5 w-5" />
  }
];

export const SetupWizard = memo(function SetupWizard() {
  const {
    currentStep,
    currentStepData,
    setupData,
    progress,
    copied,
    user,
    config,
    canProceed,
    handleNext,
    handlePrevious,
    handleSkip,
    updateSetupData,
    copyEnvConfig,
    navigate
  } = useSetupWizard(SETUP_STEPS);

  const renderStep = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return <WelcomeStep user={user} />;
        
      case 'admin':
        return <AdminStep user={user} />;
        
      case 'btcpay':
        return <BTCPayStep setupData={setupData} updateSetupData={updateSetupData} />;
        
      case 'rewards':
        return <RewardsStep 
          setupData={setupData} 
          updateSetupData={updateSetupData}
          maxDailyPayout={config.maxDailyPayout}
        />;
        
      case 'complete':
        return <CompleteStep 
          copied={copied}
          copyEnvConfig={copyEnvConfig}
          navigate={navigate}
        />;
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4">
              {SETUP_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    index <= currentStep ? 'text-caribbean-ocean' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index <= currentStep
                        ? 'bg-caribbean-ocean text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-xs mt-2 text-center">{step.title}</span>
                  {step.optional && (
                    <span className="text-xs text-gray-400">(optional)</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {currentStepData.icon}
                {currentStepData.title}
              </CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStepData.optional && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}
              
              {currentStep < SETUP_STEPS.length - 1 ? (
                <Button onClick={handleNext} disabled={!canProceed}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});