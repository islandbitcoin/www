/**
 * Fallback service for when GitHub questions are unavailable
 * 
 * Converts legacy questions to GitHub format for compatibility
 */

import { TRIVIA_QUESTIONS } from '@/data/triviaQuestions';
import { GitHubQuestion } from './triviaService';

// Convert difficulty to numeric scale
const mapDifficultyToNumeric = (difficulty: 'easy' | 'medium' | 'hard'): number => {
  switch (difficulty) {
    case 'easy': return 2;
    case 'medium': return 5;
    case 'hard': return 8;
  }
};

// Convert answer index to letter
const indexToLetter = (index: number): 'A' | 'B' | 'C' | 'D' => {
  return String.fromCharCode('A'.charCodeAt(0) + index) as 'A' | 'B' | 'C' | 'D';
};

// Estimate level from question ID
const estimateLevel = (id: string): number => {
  const match = id.match(/btc-(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num <= 12) return 1;
    if (num <= 24) return 2;
  }
  return 1;
};

export function convertLegacyToGitHub(): GitHubQuestion[] {
  return TRIVIA_QUESTIONS.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correct_answer: indexToLetter(q.correctAnswer),
    difficulty: mapDifficultyToNumeric(q.difficulty),
    level: estimateLevel(q.id),
    category: q.category,
    explanation: q.explanation,
    created_at: new Date().toISOString()
  }));
}

export function getFallbackQuestions(level?: number): GitHubQuestion[] {
  const allQuestions = convertLegacyToGitHub();
  
  if (level) {
    return allQuestions.filter(q => q.level === level);
  }
  
  return allQuestions;
}

export function getFallbackMetadata() {
  const questions = convertLegacyToGitHub();
  const levels = [...new Set(questions.map(q => q.level))].sort((a, b) => a - b);
  
  return {
    totalQuestions: questions.length,
    levels,
    categories: [...new Set(questions.map(q => q.category))].sort(),
    difficultyRange: [1, 10] as [number, number],
    lastUpdated: new Date().toISOString()
  };
}