import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useGameification } from '@/hooks/useGameification';
import { useGameWallet } from '@/hooks/useGameWallet';
import { useAnonymousPlay } from '@/hooks/useAnonymousPlay';
import { useReferral } from '@/hooks/useReferral';
import { secureStorage } from '@/lib/secureStorage';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TRIVIA_QUESTIONS, TriviaQuestion, TriviaProgress } from '@/data/triviaQuestions';


export const BitcoinTrivia = memo(function BitcoinTrivia() {
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState<TriviaProgress>(() => {
    const saved = secureStorage.get<TriviaProgress>('bitcoinTriviaProgress');
    return saved || {
      totalQuestionsAnswered: 0,
      correctAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastPlayedDate: new Date().toISOString(),
      answeredQuestions: [],
      satsEarned: 0,
      currentLevel: 1,
      levelCompleted: false };
  });
  const { toast } = useToast();
  const { recordActivity, checkAchievements } = useGameification();
  const { config, canUserEarnMore, userBalance } = useGameWallet();
  const { awardSats } = useAnonymousPlay();
  const { checkReferralCompletion } = useReferral();

  // Get level questions
  const getLevelQuestions = (level: number) => {
    if (level === 1) {
      // Level 1: First 12 questions (easy to medium)
      return TRIVIA_QUESTIONS.slice(0, 12);
    } else if (level === 2) {
      // Level 2: Hard questions (btc-13 through btc-24)
      return TRIVIA_QUESTIONS.slice(12, 24);
    }
    return [];
  };
  
  // Get a random question that hasn't been answered yet in current level
  const getNextQuestion = () => {
    const levelQuestions = getLevelQuestions(progress.currentLevel);
    const unansweredQuestions = levelQuestions.filter(
      q => !progress.answeredQuestions.includes(q.id)
    );
    
    if (unansweredQuestions.length === 0) {
      // Level completed
      return null;
    }
    
    return unansweredQuestions[Math.floor(Math.random() * unansweredQuestions.length)];
  };

  useEffect(() => {
    if (!currentQuestion && !progress.levelCompleted) {
      setCurrentQuestion(getNextQuestion());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.levelCompleted]);

  const handleAnswer = async (answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const isCorrect = answerIndex === currentQuestion!.correctAnswer;
    
    // Use configured rewards from game wallet
    const satsReward = isCorrect ? 
      (currentQuestion!.difficulty === 'easy' ? config.gameRewards.triviaEasy : 
       currentQuestion!.difficulty === 'medium' ? config.gameRewards.triviaMedium : 
       config.gameRewards.triviaHard) : 0;
    
    const newProgress: TriviaProgress = {
      totalQuestionsAnswered: progress.totalQuestionsAnswered + 1,
      correctAnswers: progress.correctAnswers + (isCorrect ? 1 : 0),
      currentStreak: isCorrect ? progress.currentStreak + 1 : 0,
      bestStreak: isCorrect ? 
        Math.max(progress.bestStreak, progress.currentStreak + 1) : 
        progress.bestStreak,
      lastPlayedDate: new Date().toISOString(),
      answeredQuestions: [...progress.answeredQuestions, currentQuestion!.id],
      satsEarned: progress.satsEarned + satsReward,
      currentLevel: progress.currentLevel,
      levelCompleted: false
    };
    
    // Check if level is completed
    const levelQuestions = getLevelQuestions(progress.currentLevel);
    const levelAnsweredCount = newProgress.answeredQuestions.filter(
      id => levelQuestions.some(q => q.id === id)
    ).length;
    
    if (levelAnsweredCount >= 12) {
      newProgress.levelCompleted = true;
    }
    
    setProgress(newProgress);
    secureStorage.set('bitcoinTriviaProgress', newProgress);
    
    // Track activity
    recordActivity({ minutesActive: 1 });
    
    // Award real sats if correct
    if (isCorrect && satsReward > 0) {
      const awarded = await awardSats(satsReward, 'trivia');
      
      if (!awarded) {
        // Revert sats earned if award failed
        newProgress.satsEarned -= satsReward;
        setProgress(newProgress);
        secureStorage.set('bitcoinTriviaProgress', newProgress);
      } else {
        // Check if this completes a referral (first game played)
        if (newProgress.totalQuestionsAnswered === 1) {
          checkReferralCompletion();
        }
      }
    }
    
    // Check achievements
    if (isCorrect) {
      checkAchievements('trivia-correct', { streak: newProgress.currentStreak });
      if (newProgress.currentStreak === 5) {
        toast({
          title: '🔥 5 Question Streak!',
          description: 'You\'re on fire! Keep learning about Bitcoin!' });
      }
    }
  };

  const nextQuestion = () => {
    const nextQ = getNextQuestion();
    if (nextQ) {
      setCurrentQuestion(nextQ);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };
  
  const startNextLevel = () => {
    const newLevel = progress.currentLevel + 1;
    const newProgress = {
      ...progress,
      currentLevel: newLevel,
      levelCompleted: false,
      answeredQuestions: progress.answeredQuestions // Keep all answered questions
    };
    setProgress(newProgress);
    secureStorage.set('bitcoinTriviaProgress', newProgress);
    
    const nextQ = getNextQuestion();
    if (nextQ) {
      setCurrentQuestion(nextQ);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const accuracy = progress.totalQuestionsAnswered > 0 ?
    Math.round((progress.correctAnswers / progress.totalQuestionsAnswered) * 100) : 0;

  return (
    <Card className="border-caribbean-sand">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-caribbean-ocean" />
              Bitcoin Trivia
            </CardTitle>
            <CardDescription>
              Test your knowledge and earn sats!
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Zap className="h-4 w-4 text-caribbean-mango" />
              <span className="font-semibold">{userBalance?.balance || 0} sats</span>
            </div>
            {userBalance?.pendingBalance ? (
              <p className="text-xs text-muted-foreground mt-1">
                +{userBalance.pendingBalance} pending
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Streak: {progress.currentStreak}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily limit warning */}
        {!canUserEarnMore.allowed && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              {canUserEarnMore.reason}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-caribbean-ocean">{progress.totalQuestionsAnswered}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-caribbean-palm">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-caribbean-sunset">{progress.bestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>

        {/* Question or Level Complete */}
        {currentQuestion ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={currentQuestion.difficulty === 'easy' ? 'secondary' : 
                            currentQuestion.difficulty === 'medium' ? 'default' : 'destructive'}>
                {currentQuestion.difficulty}
              </Badge>
              <Badge variant="outline">{currentQuestion.category}</Badge>
            </div>
            
            <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
            
            {/* Answer Options */}
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showIncorrect = showResult && isSelected && !isCorrect;
              
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left",
                    showCorrect && "border-green-500 bg-green-50",
                    showIncorrect && "border-red-500 bg-red-50",
                    !showResult && "hover:bg-caribbean-ocean/10"
                  )}
                  onClick={() => handleAnswer(index)}
                  disabled={showResult}
                >
                  <span className="flex items-center gap-2 w-full">
                    {showCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {showIncorrect && <XCircle className="h-4 w-4 text-red-600" />}
                    {option}
                  </span>
                </Button>
              );
            })}
          </div>
          
          {/* Explanation */}
          {showResult && (
            <div className="p-4 bg-caribbean-ocean/10 rounded-lg">
              <p className="text-sm">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>
        ) : progress.levelCompleted ? (
          // Show level complete UI when no current question but level is completed
          <div className="space-y-3">
            <div className="p-4 bg-caribbean-mango/10 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-2">Level {progress.currentLevel} Complete! 🎉</h3>
              <p className="text-sm text-muted-foreground">
                You've mastered this level. Ready for harder questions?
              </p>
            </div>
            {progress.currentLevel < 2 ? (
              <Button 
                onClick={startNextLevel} 
                className="w-full bg-caribbean-mango hover:bg-caribbean-mango/90"
              >
                <Brain className="mr-2 h-4 w-4" />
                Start Level {progress.currentLevel + 1}
              </Button>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Congratulations! You've completed all levels! 🏆
              </div>
            )}
          </div>
        ) : (
          // Loading state or error
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        )}

        {/* Next Question Button - only show when we have a current question and result is shown */}
        {showResult && currentQuestion && !progress.levelCompleted && (
          <Button 
            onClick={nextQuestion} 
            className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Next Question
          </Button>
        )}

        {/* Level Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Level {progress.currentLevel} Progress</span>
            <span>
              {progress.answeredQuestions.filter(id => 
                getLevelQuestions(progress.currentLevel).some(q => q.id === id)
              ).length} / 12
            </span>
          </div>
          <Progress 
            value={(progress.answeredQuestions.filter(id => 
              getLevelQuestions(progress.currentLevel).some(q => q.id === id)
            ).length / 12) * 100} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
});