/**
 * Bitcoin Trivia Questions Database
 * 
 * Contains all trivia questions organized by difficulty and category.
 * Extracted from components for better maintainability and reusability.
 */

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'basics' | 'technical' | 'history' | 'lightning' | 'culture';
}

export interface TriviaProgress {
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
export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Basics
  {
    id: 'btc-1',
    question: 'What is the maximum supply of Bitcoin?',
    options: ['21 million', '100 million', '1 billion', 'Unlimited'],
    correctAnswer: 0,
    explanation: 'Bitcoin has a hard cap of 21 million coins, making it a deflationary asset.',
    difficulty: 'easy',
    category: 'basics'
  },
  {
    id: 'btc-2',
    question: 'Who created Bitcoin?',
    options: ['Vitalik Buterin', 'Satoshi Nakamoto', 'Nick Szabo', 'Hal Finney'],
    correctAnswer: 1,
    explanation: 'Satoshi Nakamoto is the pseudonymous creator of Bitcoin, whose real identity remains unknown.',
    difficulty: 'easy',
    category: 'history'
  },
  {
    id: 'btc-3',
    question: 'When was the Bitcoin whitepaper published?',
    options: ['2007', '2008', '2009', '2010'],
    correctAnswer: 1,
    explanation: 'The Bitcoin whitepaper was published on October 31, 2008.',
    difficulty: 'medium',
    category: 'history'
  },
  {
    id: 'btc-4',
    question: 'What is a satoshi?',
    options: ['A Bitcoin wallet', 'The smallest unit of Bitcoin', 'A type of mining hardware', 'A Bitcoin exchange'],
    correctAnswer: 1,
    explanation: 'A satoshi is the smallest unit of Bitcoin, equal to 0.00000001 BTC.',
    difficulty: 'easy',
    category: 'basics'
  },
  {
    id: 'btc-5',
    question: 'How often does Bitcoin halving occur?',
    options: ['Every year', 'Every 2 years', 'Every 4 years', 'Every 10 years'],
    correctAnswer: 2,
    explanation: 'Bitcoin halving occurs approximately every 4 years (210,000 blocks), reducing mining rewards by half.',
    difficulty: 'medium',
    category: 'technical'
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
    category: 'lightning'
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
    category: 'culture'
  },
  {
    id: 'btc-8',
    question: 'What is Bitcoin\'s average block time?',
    options: ['1 minute', '10 minutes', '30 minutes', '1 hour'],
    correctAnswer: 1,
    explanation: 'Bitcoin targets an average block time of 10 minutes through difficulty adjustment.',
    difficulty: 'medium',
    category: 'technical'
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
    category: 'history'
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
    category: 'technical'
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
    category: 'technical'
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
    category: 'technical'
  },
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
    category: 'technical'
  },
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
    category: 'technical'
  },
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
    category: 'history'
  },
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
    category: 'technical'
  },
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
    category: 'technical'
  },
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
    category: 'technical'
  },
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
    category: 'technical'
  },
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
    category: 'culture'
  },
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
    category: 'culture'
  },
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
    category: 'technical'
  },
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
    category: 'technical'
  },
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
    category: 'culture'
  }
];

// Utility functions for trivia questions
export const getQuestionsByDifficulty = (difficulty: TriviaQuestion['difficulty']): TriviaQuestion[] => {
  return TRIVIA_QUESTIONS.filter(q => q.difficulty === difficulty);
};

export const getQuestionsByCategory = (category: TriviaQuestion['category']): TriviaQuestion[] => {
  return TRIVIA_QUESTIONS.filter(q => q.category === category);
};

export const getRandomQuestion = (excludeIds: string[] = []): TriviaQuestion | null => {
  const availableQuestions = TRIVIA_QUESTIONS.filter(q => !excludeIds.includes(q.id));
  if (availableQuestions.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
};

export const getRandomQuestionByDifficulty = (
  difficulty: TriviaQuestion['difficulty'],
  excludeIds: string[] = []
): TriviaQuestion | null => {
  const availableQuestions = getQuestionsByDifficulty(difficulty).filter(q => !excludeIds.includes(q.id));
  if (availableQuestions.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
};