import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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
  currentLevel: number;
  levelCompleted: boolean;
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
    category: 'basics' },
  {
    id: 'btc-2',
    question: 'Who created Bitcoin?',
    options: ['Vitalik Buterin', 'Satoshi Nakamoto', 'Nick Szabo', 'Hal Finney'],
    correctAnswer: 1,
    explanation: 'Satoshi Nakamoto is the pseudonymous creator of Bitcoin, whose real identity remains unknown.',
    difficulty: 'easy',
    category: 'history' },
  {
    id: 'btc-3',
    question: 'When was the Bitcoin whitepaper published?',
    options: ['2007', '2008', '2009', '2010'],
    correctAnswer: 1,
    explanation: 'The Bitcoin whitepaper was published on October 31, 2008.',
    difficulty: 'medium',
    category: 'history' },
  {
    id: 'btc-4',
    question: 'What is a satoshi?',
    options: ['A Bitcoin wallet', 'The smallest unit of Bitcoin', 'A type of mining hardware', 'A Bitcoin exchange'],
    correctAnswer: 1,
    explanation: 'A satoshi is the smallest unit of Bitcoin, equal to 0.00000001 BTC.',
    difficulty: 'easy',
    category: 'basics' },
  {
    id: 'btc-5',
    question: 'How often does Bitcoin halving occur?',
    options: ['Every year', 'Every 2 years', 'Every 4 years', 'Every 10 years'],
    correctAnswer: 2,
    explanation: 'Bitcoin halving occurs approximately every 4 years (210,000 blocks), reducing mining rewards by half.',
    difficulty: 'medium',
    category: 'technical' },
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
    category: 'lightning' },
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
    category: 'culture' },
  {
    id: 'btc-8',
    question: 'What is Bitcoin\'s average block time?',
    options: ['1 minute', '10 minutes', '30 minutes', '1 hour'],
    correctAnswer: 1,
    explanation: 'Bitcoin targets an average block time of 10 minutes through difficulty adjustment.',
    difficulty: 'medium',
    category: 'technical' },
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
    category: 'history' },
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
    category: 'technical' },
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
    category: 'technical' },
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
    category: 'technical' },
  // Level 2 - Hard questions
  {
    id: 'btc-13',
    question: 'What is the purpose of Bitcoin\'s nonce in mining?',
    options: [
      'To encrypt transactions',
      'To find a valid block hash',
      'To verify signatures',
      'To generate private keys'
    ],
    correctAnswer: 1,
    explanation: 'The nonce is a number that miners change to find a hash that meets the difficulty target.',
    difficulty: 'hard',
    category: 'technical' },
  {
    id: 'btc-14',
    question: 'What is a Bitcoin covenant?',
    options: [
      'A legal contract for Bitcoin ownership',
      'A restriction on how Bitcoin can be spent',
      'A type of mining pool agreement',
      'A Lightning Network channel type'
    ],
    correctAnswer: 1,
    explanation: 'Covenants are proposed mechanisms to restrict how Bitcoin can be spent in future transactions.',
    difficulty: 'hard',
    category: 'technical' },
  {
    id: 'btc-15',
    question: 'What is the significance of block height 478,558?',
    options: [
      'First Lightning transaction',
      'Bitcoin Cash fork',
      'SegWit activation',
      'Taproot activation'
    ],
    correctAnswer: 2,
    explanation: 'Block 478,558 was where Bitcoin Cash forked from Bitcoin on August 1, 2017.',
    difficulty: 'hard',
    category: 'history' },
  {
    id: 'btc-16',
    question: 'What is a "dust attack" in Bitcoin?',
    options: [
      'Mining with low hash power',
      'Sending tiny amounts to track users',
      'Spamming the mempool',
      'Creating empty blocks'
    ],
    correctAnswer: 1,
    explanation: 'A dust attack involves sending tiny amounts of Bitcoin to addresses to potentially track wallet activity.',
    difficulty: 'hard',
    category: 'technical' },
  {
    id: 'btc-17',
    question: 'What does BIP stand for?',
    options: [
      'Bitcoin Investment Protocol',
      'Blockchain Integration Process',
      'Bitcoin Improvement Proposal',
      'Basic Implementation Pattern'
    ],
    correctAnswer: 2,
    explanation: 'BIP (Bitcoin Improvement Proposal) is the standard for proposing changes to Bitcoin.',
    difficulty: 'hard',
    category: 'technical' },
  {
    id: 'btc-18',
    question: 'What is the "nothing at stake" problem?',
    options: [
      'A Bitcoin mining issue',
      'A proof-of-stake vulnerability',
      'A Lightning Network bug',
      'A wallet security flaw'
    ],
    correctAnswer: 1,
    explanation: 'The "nothing at stake" problem is a theoretical issue with proof-of-stake where validators can vote on multiple chains without cost.',
    difficulty: 'hard',
    category: 'technical' },
  {
    id: 'btc-19',
    question: 'What is Bitcoin\'s "time warp" attack?',
    options: [
      'Manipulating block timestamps to lower difficulty',
      'Double spending using time delays',
      'Reversing old transactions',
      'Accelerating block production'
    ],
    correctAnswer: 0,
    explanation: 'The time warp attack involves manipulating timestamps to artificially lower mining difficulty.',
    difficulty: 'hard',
    category: 'technical' },
  {
    id: 'btc-20',
    question: 'What is a "whale" in Bitcoin terminology?',
    options: [
      'A large mining pool',
      'Someone holding large amounts of Bitcoin',
      'A type of blockchain explorer',
      'A consensus mechanism'
    ],
    correctAnswer: 1,
    explanation: 'A whale is someone who holds a large amount of Bitcoin, capable of influencing market prices.',
    difficulty: 'hard',
    category: 'culture' },
  {
    id: 'btc-21',
    question: 'What is the "Bitcoin Obituaries" website tracking?',
    options: [
      'Failed Bitcoin businesses',
      'Times Bitcoin was declared dead',
      'Lost Bitcoin wallets',
      'Deprecated Bitcoin features'
    ],
    correctAnswer: 1,
    explanation: 'Bitcoin Obituaries tracks the hundreds of times media has declared Bitcoin dead or dying.',
    difficulty: 'hard',
    category: 'culture' },
  {
    id: 'btc-22',
    question: 'What is a "coinbase transaction"?',
    options: [
      'A transaction on Coinbase exchange',
      'The first transaction in a block',
      'A multi-signature transaction',
      'A Lightning Network payment'
    ],
    correctAnswer: 1,
    explanation: 'A coinbase transaction is the first transaction in a block that creates new Bitcoin as a mining reward.',
    difficulty: 'hard',
    category: 'technical' },
  {
    id: 'btc-23',
    question: 'What is "replace-by-fee" (RBF)?',
    options: [
      'Automatic fee adjustment',
      'Replacing unconfirmed transactions',
      'Mining pool fee sharing',
      'Lightning channel fees'
    ],
    correctAnswer: 1,
    explanation: 'RBF allows replacing an unconfirmed transaction with a higher fee version to speed up confirmation.',
    difficulty: 'hard',
    category: 'technical' },
  {
    id: 'btc-24',
    question: 'What percentage of Bitcoin\'s total supply is estimated to be lost forever?',
    options: [
      'About 5%',
      'About 10%',
      'About 20%',
      'About 30%'
    ],
    correctAnswer: 2,
    explanation: 'Approximately 20% of Bitcoin is estimated to be lost forever due to lost keys, forgotten wallets, etc.',
    difficulty: 'hard',
    category: 'culture' },
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
      currentLevel: 1,
      levelCompleted: false };
  });
  const { toast } = useToast();
  const { recordActivity, checkAchievements } = useGameification();
  const { config, awardSats, canUserEarnMore, userBalance } = useGameWallet();

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
      const awarded = await awardSats(satsReward, 'trivia', {
        questionId: currentQuestion!.id,
        difficulty: currentQuestion!.difficulty,
        streak: newProgress.currentStreak });
      
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
}