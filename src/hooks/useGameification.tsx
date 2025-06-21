import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { streakManager } from '@/lib/streaks';
import { achievementManager, Achievement } from '@/lib/achievements';
import { Trophy, Flame, Star, Zap } from 'lucide-react';

export function useGameification() {
  const { toast } = useToast();
  const [streakData, setStreakData] = useState(streakManager.getStreakStats());
  const [achievements, setAchievements] = useState(achievementManager.getAllAchievements());
  const [level, setLevel] = useState(achievementManager.getLevel());

  // Update data
  const refreshData = useCallback(() => {
    setStreakData(streakManager.getStreakStats());
    setAchievements(achievementManager.getAllAchievements());
    setLevel(achievementManager.getLevel());
  }, []);

  // Record activity
  const recordActivity = useCallback((activity: {
    posts?: number;
    interactions?: number;
    minutesActive?: number;
  }) => {
    streakManager.recordActivity(activity);
    refreshData();
  }, [refreshData]);

  // Check and show achievements
  const showAchievementToast = useCallback((achievement: Achievement) => {
    const rarityColors = {
      common: 'text-gray-600',
      rare: 'text-blue-600',
      epic: 'text-purple-600',
      legendary: 'text-yellow-600',
    };

    toast({
      title: 'Achievement Unlocked!',
      description: (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{achievement.icon}</span>
          <div>
            <p className={`font-semibold ${rarityColors[achievement.rarity]}`}>
              {achievement.name}
            </p>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            <p className="text-xs mt-1">+{achievement.points} points</p>
          </div>
        </div>
      ),
      duration: 5000,
    });
  }, [toast]);

  // Check for new achievements after actions
  const checkAchievements = useCallback((type: 'post' | 'streak' | 'social' | 'bitcoin' | 'trivia-correct' | 'stacker-milestone', data?: any) => {
    let unlocked: Achievement[] = [];

    switch (type) {
      case 'post':
        if (data) {
          unlocked = achievementManager.checkPostAchievements(data);
        }
        break;
      case 'streak':
        unlocked = achievementManager.checkStreakAchievements(streakData.currentStreak);
        break;
      case 'social':
        unlocked = achievementManager.checkSocialAchievements(data);
        break;
      case 'bitcoin':
        unlocked = achievementManager.checkBitcoinAchievements(data);
        break;
      case 'trivia-correct':
        // Check trivia achievements
        if (data?.streak === 5) {
          const triviaStreak = achievementManager.unlockAchievement('trivia-streak');
          if (triviaStreak) unlocked.push(triviaStreak);
        }
        break;
      case 'stacker-milestone':
        // Check stacker achievements
        if (data?.sats >= 1000000) {
          const millionaire = achievementManager.unlockAchievement('satoshi-millionaire');
          if (millionaire) unlocked.push(millionaire);
        }
        break;
    }

    unlocked.forEach(achievement => showAchievementToast(achievement));
    
    if (unlocked.length > 0) {
      refreshData();
    }

    return unlocked;
  }, [streakData.currentStreak, showAchievementToast, refreshData]);

  // Check streak on mount and daily
  useEffect(() => {
    const checkResult = streakManager.checkStreak();
    
    if (checkResult.streakBroken && checkResult.canRecover) {
      toast({
        title: 'Streak at risk!',
        description: 'Your streak is about to break. Use a recovery token to save it?',
        action: (
          <button
            onClick={() => {
              if (streakManager.useRecoveryToken()) {
                toast({
                  title: 'Streak recovered!',
                  description: 'Your streak has been saved. Don\'t forget to stay active today!',
                });
                refreshData();
              }
            }}
            className="text-sm font-medium text-caribbean-ocean hover:underline"
          >
            Use Token ({streakData.recoveryTokens} left)
          </button>
        ),
        duration: 10000,
      });
    } else if (checkResult.streakBroken && !checkResult.canRecover) {
      toast({
        title: 'Streak broken',
        description: 'Your daily streak has been reset. Start a new one today!',
        variant: 'destructive',
      });
    }

    // Check for early adopter achievement
    const earlyAdopter = achievementManager.checkEarlyAdopter();
    if (earlyAdopter) {
      showAchievementToast(earlyAdopter);
      refreshData();
    }

    // Update data every minute
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Streak milestone notification
  useEffect(() => {
    const milestones = [3, 7, 14, 21, 30, 50, 69, 100, 150, 200, 365];
    if (milestones.includes(streakData.currentStreak)) {
      toast({
        title: `${streakData.currentStreak} Day Streak! 🔥`,
        description: `Amazing dedication! You've been active for ${streakData.currentStreak} days straight!`,
        duration: 7000,
      });
    }
  }, [streakData.currentStreak, toast]);

  return {
    // Streak data
    streak: streakData,
    
    // Achievement data
    achievements,
    unlockedAchievements: achievements.filter(a => a.unlockedAt),
    level,
    
    // Actions
    recordActivity,
    checkAchievements,
    useRecoveryToken: () => {
      const success = streakManager.useRecoveryToken();
      if (success) {
        refreshData();
      }
      return success;
    },
    
    // Stats
    stats: {
      totalAchievements: achievements.length,
      unlockedCount: achievements.filter(a => a.unlockedAt).length,
      totalPoints: level.points,
      completionPercentage: (achievements.filter(a => a.unlockedAt).length / achievements.length) * 100,
    },
  };
}