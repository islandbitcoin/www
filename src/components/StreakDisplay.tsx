import { Flame, Trophy, Target, Calendar, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGameification } from '@/hooks/useGameification';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  compact?: boolean;
}

export function StreakDisplay({ compact = false }: StreakDisplayProps) {
  const { streak, level, stats, useRecoveryToken } = useGameification();

  const getFlameColor = (days: number) => {
    if (days === 0) return 'text-gray-400';
    if (days < 7) return 'text-orange-500';
    if (days < 30) return 'text-orange-600';
    if (days < 100) return 'text-red-600';
    return 'text-blue-600';
  };

  const getFlameSize = (days: number) => {
    if (days === 0) return 'h-8 w-8';
    if (days < 7) return 'h-10 w-10';
    if (days < 30) return 'h-12 w-12';
    if (days < 100) return 'h-14 w-14';
    return 'h-16 w-16';
  };

  // Compact version for sidebar
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-sm cursor-pointer">
              <Flame className={cn('h-4 w-4', getFlameColor(streak.currentStreak))} />
              <span className="font-semibold">{streak.currentStreak}</span>
              <span className="text-muted-foreground">streak</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>🔥 {streak.currentStreak} day streak!</p>
              <p className="text-xs">Best: {streak.longestStreak} days</p>
              <p className="text-xs">Level {level.level} • {level.points} pts</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="border-caribbean-sand hover:border-caribbean-ocean/30 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Daily Streak
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-xs">
                  Level {level.level}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{level.points} total points</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Flame className={cn(
              getFlameSize(streak.currentStreak),
              getFlameColor(streak.currentStreak),
              'animate-pulse'
            )} />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {streak.currentStreak}
          </div>
          <div className="text-sm text-muted-foreground">
            {streak.currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Progress to next milestone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next milestone</span>
            <span className="font-medium flex items-center gap-1">
              <Target className="h-3 w-3" />
              {streak.nextMilestone} days
            </span>
          </div>
          <Progress value={streak.streakPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {streak.daysToNextMilestone} days to go
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-center p-3 bg-caribbean-sand/20 rounded-lg">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-caribbean-mango" />
            <div className="text-lg font-semibold">{streak.longestStreak}</div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
          <div className="text-center p-3 bg-caribbean-sand/20 rounded-lg">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-caribbean-ocean" />
            <div className="text-lg font-semibold">{streak.totalDaysActive}</div>
            <div className="text-xs text-muted-foreground">Total Days</div>
          </div>
        </div>

        {/* Recovery Tokens */}
        {streak.recoveryTokens > 0 && (
          <div className="flex items-center justify-between p-3 bg-caribbean-turquoise/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-caribbean-turquoise" />
              <span className="text-sm font-medium">Recovery Tokens</span>
            </div>
            <Badge className="bg-caribbean-turquoise/20 text-caribbean-ocean">
              {streak.recoveryTokens}
            </Badge>
          </div>
        )}

        {/* Achievement Progress */}
        <div className="pt-2 border-t border-caribbean-sand">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Achievements</span>
            <span className="font-medium">
              {stats.unlockedCount}/{stats.totalAchievements}
            </span>
          </div>
          <Progress value={stats.completionPercentage} className="h-2" />
        </div>

        {/* Motivational Message */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground italic">
            {streak.currentStreak === 0 && "Start your streak today! 🏝️"}
            {streak.currentStreak > 0 && streak.currentStreak < 7 && "Keep going! You're building momentum! 💪"}
            {streak.currentStreak >= 7 && streak.currentStreak < 30 && "One week strong! You're on fire! 🔥"}
            {streak.currentStreak >= 30 && streak.currentStreak < 100 && "A whole month! You're unstoppable! 🚀"}
            {streak.currentStreak >= 100 && "Legendary dedication! You're a true HODLer! 🏆"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}