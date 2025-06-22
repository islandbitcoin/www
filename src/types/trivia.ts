/**
 * Trivia type definitions
 * 
 * Defines types for both legacy and new trivia question formats
 * to support backward compatibility during migration.
 */

// Legacy format (current implementation)
export interface LegacyTriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-3 index
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'basics' | 'technical' | 'history' | 'lightning' | 'culture';
}

// New format (from GitHub)
export interface GitHubTriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty: number; // 1-10 scale
  level: number; // 1-21 progression
  category: string; // More categories available
  explanation: string;
  created_at: string;
}

// Unified format for game use
export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-3 index for consistency
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard'; // Mapped from 1-10
  numericDifficulty: number; // Original 1-10 value
  category: string;
  level: number;
  isFromGitHub: boolean;
}

// Progress tracking
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
  // New fields for enhanced tracking
  levelProgress?: Map<number, LevelProgress>;
  categoryProgress?: Map<string, CategoryProgress>;
  difficultyStats?: DifficultyStats;
}

export interface LevelProgress {
  level: number;
  questionsAnswered: number;
  correctAnswers: number;
  totalQuestions: number;
  bestScore: number;
  unlocked: boolean;
  completed: boolean;
  firstPlayedDate?: string;
  lastPlayedDate?: string;
  perfectRun: boolean;
}

export interface CategoryProgress {
  category: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  masteryLevel: number; // 0-3 (novice, intermediate, expert, master)
  lastPlayedDate: string;
}

export interface DifficultyStats {
  easy: { answered: number; correct: number };
  medium: { answered: number; correct: number };
  hard: { answered: number; correct: number };
  averageDifficulty: number;
}

// Dynamic level configuration
export interface DynamicLevel {
  level: number;
  name: string;
  description: string;
  questionCount: number;
  requiredCorrect: number;
  difficultyRange: [number, number];
  categories?: string[]; // Optional category restrictions
  reward: {
    base: number;
    bonus: number;
    perfect: number;
  };
  unlockRequirements?: {
    previousLevel?: number;
    minTotalQuestions?: number;
    minAccuracy?: number;
  };
}

// Game session tracking
export interface TriviaSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  questionsAnswered: number;
  correctAnswers: number;
  satsEarned: number;
  levelsPlayed: number[];
  categoriesPlayed: string[];
  streak: number;
  bestStreak: number;
}

// Achievement definitions
export interface TriviaAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'questions' | 'accuracy' | 'streak' | 'level' | 'category' | 'perfect';
    value: number;
    category?: string;
    level?: number;
  };
  reward: number;
  unlocked: boolean;
  unlockedDate?: string;
}

// Utility type for question filters
export interface QuestionFilter {
  levels?: number[];
  categories?: string[];
  difficultyRange?: [number, number];
  excludeAnswered?: boolean;
  excludeIds?: string[];
}

// Type guards
export function isGitHubQuestion(question: unknown): question is GitHubTriviaQuestion {
  return question !== null && 
    typeof question === 'object' &&
    'correct_answer' in question &&
    'difficulty' in question &&
    'level' in question &&
    typeof (question as GitHubTriviaQuestion).correct_answer === 'string' && 
    typeof (question as GitHubTriviaQuestion).difficulty === 'number' &&
    typeof (question as GitHubTriviaQuestion).level === 'number';
}

export function isLegacyQuestion(question: unknown): question is LegacyTriviaQuestion {
  return question !== null && 
    typeof question === 'object' &&
    'correctAnswer' in question &&
    'difficulty' in question &&
    typeof (question as LegacyTriviaQuestion).correctAnswer === 'number' &&
    ['easy', 'medium', 'hard'].includes((question as LegacyTriviaQuestion).difficulty);
}

// Conversion utilities
export function convertGitHubToUnified(github: GitHubTriviaQuestion): TriviaQuestion {
  const letterToIndex = (letter: 'A' | 'B' | 'C' | 'D'): number => {
    return letter.charCodeAt(0) - 'A'.charCodeAt(0);
  };

  const mapDifficulty = (numeric: number): 'easy' | 'medium' | 'hard' => {
    if (numeric <= 3) return 'easy';
    if (numeric <= 6) return 'medium';
    return 'hard';
  };

  return {
    id: github.id,
    question: github.question,
    options: github.options,
    correctAnswer: letterToIndex(github.correct_answer),
    explanation: github.explanation,
    difficulty: mapDifficulty(github.difficulty),
    numericDifficulty: github.difficulty,
    category: github.category,
    level: github.level,
    isFromGitHub: true,
  };
}

export function convertLegacyToUnified(legacy: LegacyTriviaQuestion): TriviaQuestion {
  const mapDifficultyToNumeric = (diff: 'easy' | 'medium' | 'hard'): number => {
    switch (diff) {
      case 'easy': return 2;
      case 'medium': return 5;
      case 'hard': return 8;
    }
  };

  // Try to extract level from ID (e.g., "btc-1" -> level 1)
  const levelMatch = legacy.id.match(/btc-(\d+)/);
  const estimatedLevel = levelMatch ? Math.ceil(parseInt(levelMatch[1]) / 12) : 1;

  return {
    id: legacy.id,
    question: legacy.question,
    options: legacy.options,
    correctAnswer: legacy.correctAnswer,
    explanation: legacy.explanation,
    difficulty: legacy.difficulty,
    numericDifficulty: mapDifficultyToNumeric(legacy.difficulty),
    category: legacy.category,
    level: estimatedLevel,
    isFromGitHub: false,
  };
}