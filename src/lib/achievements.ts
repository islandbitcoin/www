/**
 * Achievement system with unlockable badges
 * Privacy-first: All achievements stored locally
 */

import { secureStorage } from './secureStorage';
import { NostrEvent } from '@nostrify/nostrify';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social' | 'streak' | 'bitcoin' | 'special' | 'secret';
  points: number;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementProgress {
  [achievementId: string]: {
    progress: number;
    lastUpdated: string;
  };
}

const ACHIEVEMENTS: Achievement[] = [
  // Social Achievements
  {
    id: 'first-post',
    name: 'Hello Island!',
    description: 'Make your first post',
    icon: '👋',
    category: 'social',
    points: 10,
    rarity: 'common',
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Interact with 50 different users',
    icon: '🦋',
    category: 'social',
    points: 50,
    maxProgress: 50,
    rarity: 'rare',
  },
  {
    id: 'influencer',
    name: 'Island Influencer',
    description: 'Receive 100 interactions on your posts',
    icon: '🌟',
    category: 'social',
    points: 100,
    maxProgress: 100,
    rarity: 'epic',
  },
  
  // Streak Achievements
  {
    id: 'streak-week',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    points: 25,
    rarity: 'common',
  },
  {
    id: 'streak-month',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '📅',
    category: 'streak',
    points: 100,
    rarity: 'rare',
  },
  {
    id: 'streak-satoshi',
    name: 'Satoshi Dedication',
    description: 'Maintain a 69-day streak',
    icon: '🎯',
    category: 'streak',
    points: 169,
    rarity: 'epic',
  },
  {
    id: 'streak-year',
    name: 'Yearly HODLer',
    description: 'Maintain a 365-day streak',
    icon: '🏆',
    category: 'streak',
    points: 500,
    rarity: 'legendary',
  },
  
  // Bitcoin Achievements
  {
    id: 'orange-pilled',
    name: 'Orange Pilled',
    description: 'Complete the Bitcoin basics quiz',
    icon: '🟠',
    category: 'bitcoin',
    points: 30,
    rarity: 'common',
  },
  {
    id: 'lightning-fast',
    name: 'Lightning Fast',
    description: 'Send or receive your first zap',
    icon: '⚡',
    category: 'bitcoin',
    points: 50,
    rarity: 'common',
  },
  {
    id: 'stack-sats',
    name: 'Stacking Sats',
    description: 'Play the stacking simulator 21 times',
    icon: '🪙',
    category: 'bitcoin',
    points: 21,
    maxProgress: 21,
    rarity: 'rare',
  },
  {
    id: 'trivia-streak',
    name: 'Bitcoin Scholar',
    description: 'Answer 5 trivia questions correctly in a row',
    icon: '🎓',
    category: 'bitcoin',
    points: 50,
    rarity: 'rare',
  },
  {
    id: 'satoshi-millionaire',
    name: 'Satoshi Millionaire',
    description: 'Stack 1 million sats in the simulator',
    icon: '💰',
    category: 'bitcoin',
    points: 100,
    rarity: 'epic',
  },
  {
    id: 'bitcoin-scholar',
    name: 'Bitcoin Scholar',
    description: 'Answer 100 trivia questions correctly',
    icon: '🎓',
    category: 'bitcoin',
    points: 200,
    maxProgress: 100,
    rarity: 'epic',
  },
  
  // Special Achievements
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Join within the first month of launch',
    icon: '🌅',
    category: 'special',
    points: 100,
    rarity: 'rare',
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Post between 2 AM and 5 AM',
    icon: '🦉',
    category: 'special',
    points: 25,
    rarity: 'common',
  },
  {
    id: 'caribbean-vibes',
    name: 'Caribbean Vibes',
    description: 'Use 5 different island emojis in posts',
    icon: '🏝️',
    category: 'special',
    points: 35,
    maxProgress: 5,
    rarity: 'common',
  },
  
  // Secret Achievements
  {
    id: 'secret-21',
    name: '???',
    description: 'A mysterious achievement',
    icon: '🤫',
    category: 'secret',
    points: 210,
    rarity: 'legendary',
  },
  {
    id: 'secret-moon',
    name: '???',
    description: 'To the moon!',
    icon: '🌙',
    category: 'secret',
    points: 100,
    rarity: 'epic',
  },
];

export class AchievementManager {
  private static instance: AchievementManager;
  private progress: AchievementProgress = {};

  private constructor() {
    this.loadProgress();
  }

  static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }

  private loadProgress() {
    this.progress = secureStorage.get<AchievementProgress>('achievements') || {};
  }

  private saveProgress() {
    secureStorage.set('achievements', this.progress);
  }

  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS.map(achievement => {
      const progress = this.progress[achievement.id];
      return {
        ...achievement,
        progress: progress?.progress || 0,
        unlockedAt: progress?.progress >= (achievement.maxProgress || 1) 
          ? progress.lastUpdated 
          : undefined,
      };
    });
  }

  getUnlockedAchievements(): Achievement[] {
    return this.getAllAchievements().filter(a => a.unlockedAt);
  }

  getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return this.getAllAchievements().filter(a => a.category === category);
  }

  getTotalPoints(): number {
    return this.getUnlockedAchievements().reduce((sum, a) => sum + a.points, 0);
  }

  getLevel(): { level: number; points: number; nextLevel: number; progress: number } {
    const points = this.getTotalPoints();
    const level = Math.floor(Math.sqrt(points / 50)) + 1;
    const currentLevelPoints = Math.pow(level - 1, 2) * 50;
    const nextLevelPoints = Math.pow(level, 2) * 50;
    const progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

    return {
      level,
      points,
      nextLevel: nextLevelPoints,
      progress,
    };
  }

  updateProgress(achievementId: string, increment: number = 1): Achievement | null {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return null;

    const current = this.progress[achievementId] || { progress: 0, lastUpdated: '' };
    const maxProgress = achievement.maxProgress || 1;
    
    if (current.progress >= maxProgress) {
      // Already unlocked
      return null;
    }

    current.progress = Math.min(current.progress + increment, maxProgress);
    current.lastUpdated = new Date().toISOString();
    
    this.progress[achievementId] = current;
    this.saveProgress();

    // Check if just unlocked
    if (current.progress >= maxProgress) {
      return {
        ...achievement,
        unlockedAt: current.lastUpdated,
        progress: current.progress,
      };
    }

    return null;
  }

  checkPostAchievements(event: NostrEvent) {
    const unlocked: Achievement[] = [];

    // First post
    if (!this.progress['first-post']?.progress) {
      const achievement = this.updateProgress('first-post');
      if (achievement) unlocked.push(achievement);
    }

    // Night owl (2 AM - 5 AM)
    const hour = new Date(event.created_at * 1000).getHours();
    if (hour >= 2 && hour < 5) {
      const achievement = this.updateProgress('night-owl');
      if (achievement) unlocked.push(achievement);
    }

    // Caribbean vibes - check for island emojis
    const islandEmojis = ['🏝️', '🌴', '🥥', '🦜', '🏖️', '🌺', '🦩', '🦀'];
    const emojiCount = islandEmojis.filter(emoji => event.content.includes(emoji)).length;
    if (emojiCount > 0) {
      const achievement = this.updateProgress('caribbean-vibes', emojiCount);
      if (achievement) unlocked.push(achievement);
    }

    // Secret achievements
    if (event.content.includes('21') && event.content.toLowerCase().includes('bitcoin')) {
      const achievement = this.updateProgress('secret-21');
      if (achievement) {
        achievement.name = '21 Million Club';
        achievement.description = 'Mention Bitcoin and 21 in the same post';
        unlocked.push(achievement);
      }
    }

    if (event.content.includes('🚀') && event.content.toLowerCase().includes('moon')) {
      const achievement = this.updateProgress('secret-moon');
      if (achievement) {
        achievement.name = 'To The Moon!';
        achievement.description = 'Post about going to the moon';
        unlocked.push(achievement);
      }
    }

    return unlocked;
  }

  checkStreakAchievements(currentStreak: number) {
    const unlocked: Achievement[] = [];
    
    const streakAchievements = [
      { days: 7, id: 'streak-week' },
      { days: 30, id: 'streak-month' },
      { days: 69, id: 'streak-satoshi' },
      { days: 365, id: 'streak-year' },
    ];

    for (const { days, id } of streakAchievements) {
      if (currentStreak >= days && !this.progress[id]?.progress) {
        const achievement = this.updateProgress(id);
        if (achievement) unlocked.push(achievement);
      }
    }

    return unlocked;
  }

  checkSocialAchievements(type: 'interaction' | 'received') {
    const unlocked: Achievement[] = [];

    if (type === 'interaction') {
      const achievement = this.updateProgress('social-butterfly');
      if (achievement) unlocked.push(achievement);
    } else {
      const achievement = this.updateProgress('influencer');
      if (achievement) unlocked.push(achievement);
    }

    return unlocked;
  }

  checkBitcoinAchievements(type: 'quiz' | 'zap' | 'game' | 'trivia') {
    const unlocked: Achievement[] = [];

    switch (type) {
      case 'quiz':
        const quizAchievement = this.updateProgress('orange-pilled');
        if (quizAchievement) unlocked.push(quizAchievement);
        break;
      case 'zap':
        const zapAchievement = this.updateProgress('lightning-fast');
        if (zapAchievement) unlocked.push(zapAchievement);
        break;
      case 'game':
        const gameAchievement = this.updateProgress('stack-sats');
        if (gameAchievement) unlocked.push(gameAchievement);
        break;
      case 'trivia':
        const triviaAchievement = this.updateProgress('bitcoin-scholar');
        if (triviaAchievement) unlocked.push(triviaAchievement);
        break;
    }

    return unlocked;
  }

  // Special check for early adopter
  checkEarlyAdopter() {
    const launchDate = new Date('2024-03-01'); // Set your launch date
    const joinDate = new Date();
    const daysSinceLaunch = Math.floor((joinDate.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLaunch <= 30) {
      return this.updateProgress('early-adopter');
    }
    
    return null;
  }
}

export const achievementManager = AchievementManager.getInstance();