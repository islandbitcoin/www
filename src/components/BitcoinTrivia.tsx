import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Trophy, Zap, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useGameification } from '@/hooks/useGameification';
import { useGameWallet } from '@/hooks/useGameWallet';
import { secureStorage } from '@/lib/secureStorage';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'basics' | 'technical' | 'history' | 'lightning' | 'culture';
}

interface TriviaProgress {
  totalQuestionsAnswered: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string;
  answeredQuestions: string[];
  satsEarned: number;
}

// Bitcoin trivia questions database
const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Basics
  {
    id: 'btc-1',
    question: 'What is the maximum supply of Bitcoin?',
    options: ['21 million', '100 million', '1 billion', 'Unlimited'],
    correctAnswer: 0,
    explanation: 'Bitcoin has a hard cap of 21 million coins, making it a deflationary asset.',
    difficulty: 'easy',
    category: 'basics',
  },
  {
    id: 'btc-2',
    question: 'Who created Bitcoin?',
    options: ['Vitalik Buterin', 'Satoshi Nakamoto', 'Nick Szabo', 'Hal Finney'],
    correctAnswer: 1,
    explanation: 'Satoshi Nakamoto is the pseudonymous creator of Bitcoin, whose real identity remains unknown.',
    difficulty: 'easy',
    category: 'history',
  },
  {
    id: 'btc-3',
    question: 'When was the Bitcoin whitepaper published?',
    options: ['2007', '2008', '2009', '2010'],
    correctAnswer: 1,
    explanation: 'The Bitcoin whitepaper was published on October 31, 2008.',
    difficulty: 'medium',
    category: 'history',
  },
  {
    id: 'btc-4',
    question: 'What is a satoshi?',
    options: ['A Bitcoin wallet', 'The smallest unit of Bitcoin', 'A type of mining hardware', 'A Bitcoin exchange'],
    correctAnswer: 1,
    explanation: 'A satoshi is the smallest unit of Bitcoin, equal to 0.00000001 BTC.',
    difficulty: 'easy',
    category: 'basics',
  },
  {
    id: 'btc-5',
    question: 'How often does Bitcoin halving occur?',
    options: ['Every year', 'Every 2 years', 'Every 4 years', 'Every 10 years'],
    correctAnswer: 2,
    explanation: 'Bitcoin halving occurs approximately every 4 years (210,000 blocks), reducing mining rewards by half.',
    difficulty: 'medium',
    category: 'technical',
  },
  {
    id: 'btc-6',
    question: 'What is the Lightning Network?',
    options: [
      'A faster blockchain',
      'A Layer 2 payment protocol',
      'A mining pool',
      'An exchange platform'
    ],
    correctAnswer: 1,
    explanation: 'The Lightning Network is a Layer 2 payment protocol that enables fast, cheap Bitcoin transactions.',
    difficulty: 'medium',
    category: 'lightning',
  },
  {
    id: 'btc-7',
    question: 'What does "HODL" mean in Bitcoin culture?',
    options: [
      'High Order Digital Ledger',
      'Hold On for Dear Life',
      'A misspelling of "hold"',
      'Highly Optimized Distributed Ledger'
    ],
    correctAnswer: 2,
    explanation: 'HODL originated from a misspelling of "hold" in a 2013 Bitcoin forum post and became a rallying cry for long-term holders.',
    difficulty: 'easy',
    category: 'culture',
  },
  {
    id: 'btc-8',
    question: 'What is Bitcoin\'s average block time?',
    options: ['1 minute', '10 minutes', '30 minutes', '1 hour'],
    correctAnswer: 1,
    explanation: 'Bitcoin targets an average block time of 10 minutes through difficulty adjustment.',
    difficulty: 'medium',
    category: 'technical',
  },
  {
    id: 'btc-9',
    question: 'What was the first commercial Bitcoin transaction?',
    options: [
      'Buying a car',
      'Purchasing pizza',
      'Paying for web hosting',
      'Buying coffee'
    ],
    correctAnswer: 1,
    explanation: 'On May 22, 2010, Laszlo Hanyecz bought two pizzas for 10,000 BTC, now celebrated as Bitcoin Pizza Day.',
    difficulty: 'medium',
    category: 'history',
  },
  {
    id: 'btc-10',
    question: 'What is a Bitcoin node?',
    options: [
      'A mining device',
      'A computer running Bitcoin software',
      'A Bitcoin ATM',
      'A type of wallet'
    ],
    correctAnswer: 1,
    explanation: 'A Bitcoin node is a computer that runs Bitcoin software and validates transactions and blocks.',
    difficulty: 'medium',
    category: 'technical',
  },
  // Hard questions
  {
    id: 'btc-11',
    question: 'What is the purpose of Bitcoin\'s difficulty adjustment?',
    options: [
      'To make mining more profitable',
      'To maintain ~10 minute block times',
      'To increase transaction fees',
      'To reduce energy consumption'
    ],
    correctAnswer: 1,
    explanation: 'Difficulty adjustment ensures blocks are mined approximately every 10 minutes regardless of total hash power.',
    difficulty: 'hard',
    category: 'technical',
  },
  {
    id: 'btc-12',
    question: 'What is a Bitcoin UTXO?',
    options: [
      'Unified Transaction Exchange Order',
      'Unspent Transaction Output',
      'Universal Token Exchange Operation',
      'User Transaction Export Object'
    ],
    correctAnswer: 1,
    explanation: 'UTXO (Unspent Transaction Output) represents the amount of Bitcoin that can be spent in future transactions.',
    difficulty: 'hard',
    category: 'technical',
  },
];

export function BitcoinTrivia() {
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
    };
  });
  const { toast } = useToast();
  const { recordActivity, checkAchievements } = useGameification();
  const { config, awardSats, canUserEarnMore, userBalance } = useGameWallet();

  // Get a random question that hasn't been answered yet
  const getNextQuestion = () => {
    const unansweredQuestions = TRIVIA_QUESTIONS.filter(
      q => !progress.answeredQuestions.includes(q.id)
    );
    
    if (unansweredQuestions.length === 0) {
      // Reset if all questions answered
      setProgress(prev => ({ ...prev, answeredQuestions: [] }));
      return TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
    }
    
    return unansweredQuestions[Math.floor(Math.random() * unansweredQuestions.length)];
  };

  useEffect(() => {
    if (!currentQuestion) {
      setCurrentQuestion(getNextQuestion());
    }
  }, []);

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
    };
    
    setProgress(newProgress);
    secureStorage.set('bitcoinTriviaProgress', newProgress);
    
    // Track activity
    recordActivity({ minutesActive: 1 });
    
    // Award real sats if correct
    if (isCorrect && satsReward > 0) {
      const awarded = await awardSats(satsReward, 'trivia', {
        questionId: currentQuestion!.id,
        difficulty: currentQuestion!.difficulty,
        streak: newProgress.currentStreak,
      });
      
      if (!awarded) {
        // Revert sats earned if award failed
        newProgress.satsEarned -= satsReward;
        setProgress(newProgress);
        secureStorage.set('bitcoinTriviaProgress', newProgress);
      }
    }
    
    // Check achievements
    if (isCorrect) {
      checkAchievements('trivia-correct', { streak: newProgress.currentStreak });
      if (newProgress.currentStreak === 5) {
        toast({
          title: '🔥 5 Question Streak!',
          description: 'You\'re on fire! Keep learning about Bitcoin!',
        });
      }
    }
  };

  const nextQuestion = () => {
    setCurrentQuestion(getNextQuestion());
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const accuracy = progress.totalQuestionsAnswered > 0 ?
    Math.round((progress.correctAnswers / progress.totalQuestionsAnswered) * 100) : 0;

  if (!currentQuestion) return null;

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
            <p className="text-xs text-muted-foreground mt-1">
              Streak: {progress.currentStreak}
            </p>
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

        {/* Question */}
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

        {/* Next Question Button */}
        {showResult && (
          <Button 
            onClick={nextQuestion} 
            className="w-full bg-caribbean-ocean hover:bg-caribbean-ocean/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Next Question
          </Button>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress.answeredQuestions.length} / {TRIVIA_QUESTIONS.length}</span>
          </div>
          <Progress 
            value={(progress.answeredQuestions.length / TRIVIA_QUESTIONS.length) * 100} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}