/**
 * React hook for fetching and managing trivia questions
 * 
 * Provides a clean interface to the TriviaService with React Query
 * integration for caching, loading states, and error handling.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { triviaService, GitHubQuestion, TriviaMetadata } from '@/lib/services/triviaService';
import { useToast } from '@/hooks/useToast';
import { useEffect } from 'react';

interface UseTriviaQuestionsOptions {
  level?: number;
  category?: string;
  difficultyRange?: [number, number];
  enabled?: boolean;
}

interface UseTriviaQuestionsResult {
  questions: GitHubQuestion[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

/**
 * Hook to fetch trivia questions with various filters
 */
export function useTriviaQuestions(options: UseTriviaQuestionsOptions = {}): UseTriviaQuestionsResult {
  const { level, category, difficultyRange, enabled = true } = options;
  const { toast } = useToast();

  // Create a unique query key based on filters
  const queryKey = ['trivia-questions', { level, category, difficultyRange }];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // Fetch base questions
      let questions: GitHubQuestion[];
      
      if (level) {
        questions = await triviaService.fetchQuestions(level);
      } else if (difficultyRange) {
        questions = await triviaService.fetchQuestionsByDifficulty(
          difficultyRange[0], 
          difficultyRange[1]
        );
      } else {
        questions = await triviaService.fetchQuestions();
      }

      // Apply category filter if specified
      if (category) {
        questions = questions.filter(q => 
          q.category.toLowerCase() === category.toLowerCase()
        );
      }

      return questions;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Show error toast on failure
  useEffect(() => {
    if (query.error && !query.isFetching) {
      toast({
        title: 'Failed to load questions',
        description: 'Using cached questions if available',
        variant: 'destructive',
      });
    }
  }, [query.error, query.isFetching, toast]);

  return {
    questions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  } as UseTriviaQuestionsResult;
}

/**
 * Hook to fetch trivia metadata
 */
export function useTriviaMetadata() {
  return useQuery({
    queryKey: ['trivia-metadata'],
    queryFn: () => triviaService.fetchMetadata(),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Hook to get a random question for a level
 */
export function useRandomQuestion(level: number, excludeIds?: string[]) {
  return useQuery({
    queryKey: ['trivia-random', level, excludeIds],
    queryFn: () => triviaService.getRandomQuestion(level, excludeIds),
    enabled: level > 0,
    staleTime: 0, // Always fetch fresh random question
  });
}

/**
 * Hook to get questions for dynamic level
 */
export function useDynamicLevelQuestions(
  level: number, 
  count: number, 
  excludeIds?: string[]
) {
  return useQuery({
    queryKey: ['trivia-dynamic-level', level, count, excludeIds],
    queryFn: () => triviaService.getQuestionsForDynamicLevel(level, count, excludeIds),
    enabled: level > 0 && count > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to prefetch questions for next level
 */
export function usePrefetchNextLevel(currentLevel: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchNextLevel = async () => {
      const nextLevel = currentLevel + 1;
      
      // Check if next level exists in metadata
      const metadata = queryClient.getQueryData<TriviaMetadata>(['trivia-metadata']);
      if (metadata && metadata.levels.includes(nextLevel)) {
        queryClient.prefetchQuery({
          queryKey: ['trivia-questions', { level: nextLevel }],
          queryFn: () => triviaService.fetchQuestions(nextLevel),
          staleTime: 24 * 60 * 60 * 1000,
        });
      }
    };

    prefetchNextLevel();
  }, [currentLevel, queryClient]);
}

/**
 * Hook to manage question cache
 */
export function useTriviaCache() {
  const queryClient = useQueryClient();

  const clearCache = () => {
    triviaService.clearCache();
    queryClient.removeQueries({ queryKey: ['trivia'] });
  };

  const refreshQuestions = async () => {
    triviaService.clearCache();
    await queryClient.invalidateQueries({ queryKey: ['trivia'] });
  };

  const getCacheSize = (): number => {
    const cacheData = queryClient.getQueriesData({ queryKey: ['trivia'] });
    return cacheData.length;
  };

  return {
    clearCache,
    refreshQuestions,
    getCacheSize,
  };
}