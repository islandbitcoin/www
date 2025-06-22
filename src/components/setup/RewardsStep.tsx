import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';
import { SetupData } from '@/hooks/useSetupWizard';

interface RewardsStepProps {
  setupData: SetupData;
  updateSetupData: (updates: Partial<SetupData>) => void;
  maxDailyPayout: number;
}

export function RewardsStep({ setupData, updateSetupData, maxDailyPayout }: RewardsStepProps) {
  const updateReward = (field: keyof SetupData['rewards'], value: number) => {
    updateSetupData({
      rewards: {
        ...setupData.rewards,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-caribbean-ocean/10 rounded-full flex items-center justify-center">
          <Coins className="h-10 w-10 text-caribbean-ocean" />
        </div>
        <h2 className="text-2xl font-bold">Game Rewards</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Set how many sats players earn for each achievement. You can adjust these anytime.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reward-easy">Easy Trivia Questions</Label>
              <Badge variant="secondary">Easy</Badge>
            </div>
            <Input
              id="reward-easy"
              type="number"
              min="1"
              value={setupData.rewards.triviaEasy}
              onChange={(e) => updateReward('triviaEasy', parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Reward for answering easy questions correctly
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reward-medium">Medium Trivia Questions</Label>
              <Badge variant="secondary">Medium</Badge>
            </div>
            <Input
              id="reward-medium"
              type="number"
              min="1"
              value={setupData.rewards.triviaMedium}
              onChange={(e) => updateReward('triviaMedium', parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Reward for answering medium questions correctly
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reward-hard">Hard Trivia Questions</Label>
              <Badge variant="secondary">Hard</Badge>
            </div>
            <Input
              id="reward-hard"
              type="number"
              min="1"
              value={setupData.rewards.triviaHard}
              onChange={(e) => updateReward('triviaHard', parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Reward for answering hard questions correctly
            </p>
          </div>
        </div>
        
        <Alert>
          <Coins className="h-4 w-4" />
          <AlertDescription>
            Total daily payout limit: {maxDailyPayout} sats. You can change this in the admin panel.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}