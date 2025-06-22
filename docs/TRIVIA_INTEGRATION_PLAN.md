# Bitcoin Trivia GitHub Integration Plan

## Overview
Transform the Bitcoin Trivia game from using static, hardcoded questions to dynamically fetching questions from the [bitcoin-trivia GitHub repository](https://github.com/islandbitcoin/bitcoin-trivia), enabling automatic updates and unlimited difficulty scaling.

## Current State Analysis

### Current Implementation
- **Questions**: 24 hardcoded questions in `/src/data/triviaQuestions.ts`
- **Difficulty**: 3 levels (easy, medium, hard)
- **Categories**: 5 categories (basics, technical, history, lightning, culture)
- **Levels**: 2 hardcoded levels with fixed question sets
- **Rewards**: Fixed rewards per difficulty (5, 10, 21 sats)

### GitHub Repository Structure
- **Questions**: JSON format in `data/questions.json`
- **Difficulty**: 1-10 scale (more granular)
- **Levels**: 1-21 planned progression
- **Categories**: 11+ categories (more comprehensive)
- **Schema**: Defined structure with additional metadata

## Implementation Plan

### Phase 1: Data Fetching Infrastructure

#### 1.1 Create Question Fetching Service
```typescript
// src/lib/services/triviaService.ts
interface GitHubQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty: number; // 1-10
  level: number; // 1-21
  category: string;
  explanation: string;
  created_at: string;
}

class TriviaService {
  private baseUrl = 'https://raw.githubusercontent.com/islandbitcoin/bitcoin-trivia/main/data';
  private cache: Map<string, GitHubQuestion[]> = new Map();
  
  async fetchQuestions(level?: number): Promise<GitHubQuestion[]>;
  async fetchQuestionsByDifficulty(min: number, max: number): Promise<GitHubQuestion[]>;
  async fetchCategories(): Promise<string[]>;
  async getCachedOrFetch(key: string, fetcher: () => Promise<any>): Promise<any>;
}
```

#### 1.2 Add Caching Layer
- Cache questions in localStorage with TTL (24 hours)
- Implement offline fallback to cached questions
- Progressive enhancement: start with cached, update in background

#### 1.3 Error Handling
- Fallback to local questions if GitHub is unavailable
- Retry logic with exponential backoff
- User-friendly error messages

### Phase 2: Game Logic Updates

#### 2.1 Dynamic Level System
```typescript
interface DynamicLevel {
  level: number;
  name: string;
  description: string;
  questionCount: number;
  difficultyRange: [number, number];
  requiredCorrect: number;
  reward: number;
}

// Generate levels based on available questions
function generateDynamicLevels(questions: GitHubQuestion[]): DynamicLevel[] {
  const maxLevel = Math.max(...questions.map(q => q.level));
  return Array.from({ length: maxLevel }, (_, i) => ({
    level: i + 1,
    name: `Level ${i + 1}`,
    description: getLevelDescription(i + 1),
    questionCount: getQuestionsPerLevel(i + 1),
    difficultyRange: getDifficultyRange(i + 1),
    requiredCorrect: Math.ceil(getQuestionsPerLevel(i + 1) * 0.7),
    reward: calculateReward(i + 1)
  }));
}
```

#### 2.2 Difficulty Mapping
- Map GitHub's 1-10 scale to reward tiers
- Create dynamic reward calculation based on difficulty
- Implement progressive difficulty within levels

#### 2.3 Category Selection
- Add category filter UI
- Allow users to focus on specific topics
- Track category-specific progress

### Phase 3: UI/UX Updates

#### 3.1 Level Selection Screen
```typescript
// New component: LevelSelector.tsx
- Display all available levels (1-21 when complete)
- Show locked/unlocked status
- Display progress per level
- Preview question count and rewards
```

#### 3.2 Progress Tracking
```typescript
interface EnhancedProgress {
  // Per-level tracking
  levelProgress: Map<number, {
    questionsAnswered: number;
    correctAnswers: number;
    bestScore: number;
    unlocked: boolean;
    completed: boolean;
  }>;
  
  // Category mastery
  categoryProgress: Map<string, {
    questionsAnswered: number;
    correctAnswers: number;
    masteryLevel: number;
  }>;
  
  // Global stats
  totalQuestionsAvailable: number;
  uniqueQuestionsAnswered: Set<string>;
  difficultyDistribution: Map<number, number>;
}
```

#### 3.3 Dynamic UI Elements
- Loading states while fetching questions
- Smooth transitions between levels
- Real-time progress indicators
- Achievement notifications for new levels

### Phase 4: Reward System Updates

#### 4.1 Dynamic Reward Calculation
```typescript
function calculateDynamicReward(question: GitHubQuestion): number {
  const baseReward = 2; // Base sats per question
  const difficultyMultiplier = question.difficulty * 0.5;
  const levelBonus = Math.floor(question.level / 3);
  const streakMultiplier = getCurrentStreak() > 5 ? 1.5 : 1;
  
  return Math.ceil(
    baseReward * (1 + difficultyMultiplier) + levelBonus
  ) * streakMultiplier;
}
```

#### 4.2 Achievement System
- "Level Master" - Complete all questions in a level
- "Category Expert" - 90%+ accuracy in a category
- "Difficulty Climber" - Answer 10+ questions at difficulty 8+
- "Marathon Runner" - Answer 50+ questions in one session
- "Perfect Level" - 100% accuracy on any level

### Phase 5: Integration Features

#### 5.1 Real-time Updates
- Webhook or polling for new questions
- Notification when new levels available
- Auto-refresh question pool daily

#### 5.2 Community Features
- Submit question suggestions
- Rate question difficulty
- Report issues with questions
- Leaderboard per level/category

#### 5.3 Analytics Integration
- Track most missed questions
- Identify difficulty spikes
- Monitor category preferences
- Measure engagement per level

## Migration Strategy

### Step 1: Backward Compatibility
1. Keep existing question structure
2. Add adapter layer to convert GitHub format
3. Maintain current save game format

### Step 2: Gradual Rollout
1. Start with fetching additional questions
2. Add new levels alongside existing ones
3. Migrate user progress seamlessly

### Step 3: Feature Flags
```typescript
const FEATURES = {
  DYNAMIC_QUESTIONS: process.env.VITE_ENABLE_DYNAMIC_QUESTIONS === 'true',
  EXTENDED_LEVELS: process.env.VITE_ENABLE_EXTENDED_LEVELS === 'true',
  CATEGORY_FILTER: process.env.VITE_ENABLE_CATEGORY_FILTER === 'true',
};
```

## Technical Implementation Details

### API Integration
```typescript
// src/hooks/useTriviaQuestions.ts
export function useTriviaQuestions(level?: number) {
  return useQuery({
    queryKey: ['trivia-questions', level],
    queryFn: async () => {
      const service = new TriviaService();
      return service.fetchQuestions(level);
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

### State Management
```typescript
// Enhanced game state
interface TriviaGameState {
  currentLevel: number;
  currentQuestion: GitHubQuestion | null;
  questionQueue: GitHubQuestion[];
  sessionStats: {
    questionsAnswered: number;
    correctAnswers: number;
    satsEarned: number;
    startTime: Date;
  };
  filters: {
    categories: string[];
    difficultyRange: [number, number];
    excludeAnswered: boolean;
  };
}
```

### Performance Optimizations
1. Lazy load questions by level
2. Prefetch next level in background
3. Index questions by ID for fast lookup
4. Compress cached data
5. Use Web Workers for data processing

## Success Metrics

### Technical Metrics
- Question fetch time < 500ms
- Cache hit rate > 80%
- Error rate < 1%
- Offline capability maintained

### User Engagement Metrics
- Average questions per session increase
- Level completion rate
- Return player rate
- Category diversity in play

### Content Metrics
- Questions available vs displayed
- Update frequency from GitHub
- User feedback on questions
- Difficulty accuracy (actual vs rated)

## Timeline

### Week 1-2: Infrastructure
- Implement TriviaService
- Add caching layer
- Create data adapters

### Week 3-4: Core Integration
- Update game logic
- Implement dynamic levels
- Add progress tracking

### Week 5-6: UI Updates
- Create level selector
- Update game interface
- Add loading states

### Week 7-8: Testing & Polish
- Comprehensive testing
- Performance optimization
- User feedback integration

## Risk Mitigation

### Technical Risks
1. **GitHub API limits**: Implement aggressive caching
2. **Network failures**: Robust offline support
3. **Data corruption**: Validation and sanitization
4. **Performance**: Lazy loading and pagination

### User Experience Risks
1. **Migration confusion**: Clear communication
2. **Progress loss**: Careful data migration
3. **Difficulty spikes**: Smooth progression curves
4. **Loading delays**: Optimistic UI updates

## Future Enhancements

1. **AI-Generated Questions**: Integrate with LLM for infinite questions
2. **Multiplayer Trivia**: Real-time competitive modes
3. **Custom Question Packs**: User-created content
4. **Study Mode**: Practice without rewards
5. **Spaced Repetition**: Smart question scheduling

---

This plan transforms Bitcoin Trivia from a static game to a dynamic, ever-expanding educational platform that grows with the community's contributions to the GitHub repository.