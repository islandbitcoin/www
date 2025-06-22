import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Trophy, Star, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TriviaProgress } from '@/data/triviaQuestions';
import { useTriviaMetadata } from '@/hooks/useTriviaQuestions';
import { Skeleton } from '@/components/ui/skeleton';

interface LevelSelectorProps {
  progress: TriviaProgress;
  onSelectLevel: (level: number) => void;
  className?: string;
}

export function LevelSelector({ progress, onSelectLevel, className }: LevelSelectorProps) {
  const { data: metadata, isLoading } = useTriviaMetadata();
  const [selectedLevel, setSelectedLevel] = useState(progress.currentLevel);

  if (isLoading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-caribbean-sand">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metadata) {
    return null;
  }

  const maxLevel = Math.max(...metadata.levels);
  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  const getLevelStats = (level: number) => {
    // Count questions answered for this specific level
    const levelAnswered = progress.answeredQuestions.filter(id => {
      // This is a simplified check - in production, you'd need to track which questions belong to which level
      const levelStart = (level - 1) * 12;
      const levelEnd = level * 12;
      const questionNumber = parseInt(id.split('-')[1] || '0');
      return questionNumber > levelStart && questionNumber <= levelEnd;
    }).length;

    const totalQuestions = 12; // Default questions per level
    const isUnlocked = level === 1 || progress.currentLevel >= level - 1;
    const isCompleted = levelAnswered >= totalQuestions && levelAnswered > 0;
    const accuracy = levelAnswered > 0 ? 100 : 0; // Simplified - would track correct answers

    return {
      levelAnswered,
      totalQuestions,
      isUnlocked,
      isCompleted,
      accuracy,
      progress: (levelAnswered / totalQuestions) * 100
    };
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 5) return 'Beginner';
    if (level <= 10) return 'Intermediate';
    if (level <= 15) return 'Advanced';
    return 'Expert';
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 5) return 'text-green-600';
    if (level <= 10) return 'text-blue-600';
    if (level <= 15) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-2xl font-bold mb-2">Select a Level</h2>
        <p className="text-muted-foreground">
          Choose your difficulty level. Complete levels to unlock new challenges!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {levels.map((level) => {
          const stats = getLevelStats(level);
          const isSelected = selectedLevel === level;

          return (
            <Card
              key={level}
              className={cn(
                "relative transition-all cursor-pointer",
                stats.isUnlocked ? "hover:shadow-lg" : "opacity-60",
                isSelected && "ring-2 ring-caribbean-ocean"
              )}
              onClick={() => {
                if (stats.isUnlocked) {
                  setSelectedLevel(level);
                }
              }}
            >
              {/* Lock overlay for locked levels */}
              {!stats.isUnlocked && (
                <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center z-10">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Level {level}</CardTitle>
                  <div className="flex items-center gap-2">
                    {stats.isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", getDifficultyColor(level))}
                    >
                      {getDifficultyLabel(level)}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {stats.levelAnswered} / {stats.totalQuestions} questions
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Progress value={stats.progress} className="h-2" />
                
                {stats.isCompleted && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Trophy className="h-4 w-4" />
                    <span>Completed!</span>
                  </div>
                )}

                {stats.isUnlocked && !stats.isCompleted && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span>In Progress</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={() => onSelectLevel(selectedLevel)}
          disabled={!getLevelStats(selectedLevel).isUnlocked}
          className="bg-caribbean-ocean hover:bg-caribbean-ocean/90"
        >
          Start Level {selectedLevel}
        </Button>
      </div>
    </div>
  );
}