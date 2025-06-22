/**
 * Trivia Service - Fetches questions from GitHub repository
 * 
 * Handles fetching, caching, and managing trivia questions from the
 * islandbitcoin/bitcoin-trivia repository with offline support.
 */

import { secureStorage } from '@/lib/secureStorage';
import { getFallbackQuestions, getFallbackMetadata } from './triviaFallback';

// Types matching the GitHub repository schema
export interface GitHubQuestion {
  id: string;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correct_answer: 'a' | 'b' | 'c' | 'd';
  difficulty: number; // 1-10 scale
  level: number; // 1-21 progression
  category: string;
  explanation: string;
  created_at: string;
}

export interface QuestionCache {
  data: GitHubQuestion[];
  timestamp: number;
  etag?: string;
}

export interface TriviaMetadata {
  totalQuestions: number;
  levels: number[];
  categories: string[];
  difficultyRange: [number, number];
  lastUpdated: string;
}

// Convert letter answer to index
const letterToIndex = (letter: 'a' | 'b' | 'c' | 'd'): number => {
  return letter.charCodeAt(0) - 'a'.charCodeAt(0);
};

// Convert old format to new format for backward compatibility
export const convertToLegacyFormat = (question: GitHubQuestion) => {
  // Convert options object to array
  const optionsArray = [
    question.options.a,
    question.options.b,
    question.options.c,
    question.options.d
  ];
  
  return {
    id: question.id,
    question: question.question,
    options: optionsArray,
    correctAnswer: letterToIndex(question.correct_answer),
    explanation: question.explanation,
    difficulty: question.difficulty <= 3 ? 'easy' : question.difficulty <= 6 ? 'medium' : 'hard',
    category: question.category.toLowerCase().replace(' ', '_')
  };
};

export class TriviaService {
  private static instance: TriviaService;
  private baseUrl = 'https://raw.githubusercontent.com/islandbitcoin/bitcoin-trivia/main/data';
  private cacheKey = 'trivia_questions_cache';
  private metaCacheKey = 'trivia_metadata_cache';
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  private inMemoryCache: Map<string, GitHubQuestion[] | TriviaMetadata> = new Map();

  private constructor() {}

  static getInstance(): TriviaService {
    if (!TriviaService.instance) {
      TriviaService.instance = new TriviaService();
    }
    return TriviaService.instance;
  }

  /**
   * Fetch all questions from GitHub
   */
  async fetchQuestions(level?: number): Promise<GitHubQuestion[]> {
    try {
      // Check in-memory cache first
      const memCacheKey = `questions_${level || 'all'}`;
      if (this.inMemoryCache.has(memCacheKey)) {
        const cached = this.inMemoryCache.get(memCacheKey);
        if (Array.isArray(cached)) {
          return cached as GitHubQuestion[];
        }
      }

      // Check persistent cache
      const cached = this.getCachedQuestions();
      if (cached && this.isCacheValid(cached.timestamp)) {
        const questions = level 
          ? cached.data.filter(q => q.level === level)
          : cached.data;
        
        this.inMemoryCache.set(memCacheKey, questions);
        return questions;
      }

      // Fetch from GitHub
      const response = await fetch(`${this.baseUrl}/questions.json`, {
        headers: {
          'Accept': 'application/json',
          ...(cached?.etag && { 'If-None-Match': cached.etag })
        }
      });

      if (response.status === 304 && cached) {
        // Not modified, update timestamp and return cached
        this.updateCacheTimestamp();
        return cached.data;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }

      const data = await response.json();
      // Handle different possible data structures
      let questions: GitHubQuestion[] = [];
      if (Array.isArray(data)) {
        questions = data;
      } else if (data.questions && Array.isArray(data.questions)) {
        questions = data.questions;
      } else if (data.data && Array.isArray(data.data)) {
        questions = data.data;
      }
      
      // Cache the results
      this.cacheQuestions(questions, response.headers.get('etag') || undefined);
      
      // Filter by level if requested
      const result = level 
        ? questions.filter(q => q.level === level)
        : questions;
      
      this.inMemoryCache.set(memCacheKey, result);
      return result;

    } catch (error) {
      console.error('Error fetching questions:', error);
      
      // First try cached data
      const cached = this.getCachedQuestions();
      if (cached) {
        return level 
          ? cached.data.filter(q => q.level === level)
          : cached.data;
      }
      
      // If no cache, use fallback questions
      const fallbackQuestions = getFallbackQuestions(level);
      
      // Cache the fallback for future use
      this.cacheQuestions(fallbackQuestions);
      
      return fallbackQuestions;
    }
  }

  /**
   * Fetch questions by difficulty range
   */
  async fetchQuestionsByDifficulty(min: number, max: number): Promise<GitHubQuestion[]> {
    const allQuestions = await this.fetchQuestions();
    return allQuestions.filter(q => q.difficulty >= min && q.difficulty <= max);
  }

  /**
   * Fetch questions by category
   */
  async fetchQuestionsByCategory(category: string): Promise<GitHubQuestion[]> {
    const allQuestions = await this.fetchQuestions();
    return allQuestions.filter(q => 
      q.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get available categories
   */
  async fetchCategories(): Promise<string[]> {
    const metadata = await this.fetchMetadata();
    return metadata.categories;
  }

  /**
   * Get metadata about available questions
   */
  async fetchMetadata(): Promise<TriviaMetadata> {
    try {
      // Check cache first
      const cached = secureStorage.get<TriviaMetadata>(this.metaCacheKey);
      if (cached && this.isCacheValid(Date.now() - 3600000)) { // 1 hour cache for metadata
        return cached;
      }

      const questions = await this.fetchQuestions();
      
      const metadata: TriviaMetadata = {
        totalQuestions: questions.length,
        levels: [...new Set(questions.map(q => q.level))].sort((a, b) => a - b),
        categories: [...new Set(questions.map(q => q.category))].sort(),
        difficultyRange: [
          Math.min(...questions.map(q => q.difficulty)),
          Math.max(...questions.map(q => q.difficulty))
        ],
        lastUpdated: new Date().toISOString()
      };

      secureStorage.set(this.metaCacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      
      // Use fallback metadata
      return getFallbackMetadata();
    }
  }

  /**
   * Get a random question from a specific level
   */
  async getRandomQuestion(level: number, excludeIds?: string[]): Promise<GitHubQuestion | null> {
    const questions = await this.fetchQuestions(level);
    const available = excludeIds 
      ? questions.filter(q => !excludeIds.includes(q.id))
      : questions;
    
    if (available.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  /**
   * Get questions for dynamic level generation
   */
  async getQuestionsForDynamicLevel(
    level: number, 
    count: number, 
    excludeIds?: string[]
  ): Promise<GitHubQuestion[]> {
    const allQuestions = await this.fetchQuestions();
    
    // Calculate difficulty range for this level
    const minDifficulty = Math.max(1, (level - 1) * 0.5);
    const maxDifficulty = Math.min(10, level * 0.5 + 2);
    
    // Filter questions by level or difficulty range
    let available = allQuestions.filter(q => {
      if (q.level === level) return true;
      if (q.level === 0) { // Questions without specific level
        return q.difficulty >= minDifficulty && q.difficulty <= maxDifficulty;
      }
      return false;
    });
    
    // Exclude already answered questions
    if (excludeIds) {
      available = available.filter(q => !excludeIds.includes(q.id));
    }
    
    // Shuffle and return requested count
    const shuffled = this.shuffleArray(available);
    return shuffled.slice(0, count);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    secureStorage.remove(this.cacheKey);
    secureStorage.remove(this.metaCacheKey);
    this.inMemoryCache.clear();
  }

  /**
   * Check if specific question exists
   */
  async questionExists(questionId: string): Promise<boolean> {
    const questions = await this.fetchQuestions();
    return questions.some(q => q.id === questionId);
  }

  // Private helper methods

  private getCachedQuestions(): QuestionCache | null {
    return secureStorage.get<QuestionCache>(this.cacheKey) || null;
  }

  private cacheQuestions(questions: GitHubQuestion[], etag?: string): void {
    const cache: QuestionCache = {
      data: questions,
      timestamp: Date.now(),
      etag
    };
    secureStorage.set(this.cacheKey, cache);
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTTL;
  }

  private updateCacheTimestamp(): void {
    const cached = this.getCachedQuestions();
    if (cached) {
      cached.timestamp = Date.now();
      secureStorage.set(this.cacheKey, cached);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Export singleton instance
export const triviaService = TriviaService.getInstance();