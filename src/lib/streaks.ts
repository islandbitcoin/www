/**
 * Daily streak tracking system
 * Privacy-first: All data stored locally with encryption
 */

import { secureStorage } from './secureStorage';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalDaysActive: number;
  streakStartDate: string;
  recoveryTokens: number;
  milestones: number[];
}

export interface StreakActivity {
  date: string;
  posts: number;
  interactions: number;
  minutesActive: number;
  achievements: string[];
}

const STREAK_KEY = 'userStreak';
const ACTIVITY_KEY = 'dailyActivity';
const MILESTONES = [3, 7, 14, 21, 30, 50, 69, 100, 150, 200, 365];

export class StreakManager {
  private static instance: StreakManager;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startDailyCheck();
  }

  static getInstance(): StreakManager {
    if (!StreakManager.instance) {
      StreakManager.instance = new StreakManager();
    }
    return StreakManager.instance;
  }

  private startDailyCheck() {
    // Check every minute if day has changed
    this.checkInterval = setInterval(() => {
      const today = this.getToday();
      const lastCheck = secureStorage.get<string>('lastStreakCheck');
      
      if (lastCheck !== today) {
        this.checkStreak();
        secureStorage.set('lastStreakCheck', today);
      }
    }, 60000); // Every minute
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getYesterday(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }

  getStreakData(): StreakData {
    return secureStorage.get<StreakData>(STREAK_KEY) || {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalDaysActive: 0,
      streakStartDate: '',
      recoveryTokens: 1, // Start with 1 free recovery
      milestones: [],
    };
  }

  private saveStreakData(data: StreakData) {
    secureStorage.set(STREAK_KEY, data);
  }

  recordActivity(activity: Partial<StreakActivity>) {
    const today = this.getToday();
    const activities = this.getActivities();
    
    const todayActivity = activities[today] || {
      date: today,
      posts: 0,
      interactions: 0,
      minutesActive: 0,
      achievements: [],
    };

    // Update activity
    todayActivity.posts += activity.posts || 0;
    todayActivity.interactions += activity.interactions || 0;
    todayActivity.minutesActive += activity.minutesActive || 0;
    if (activity.achievements) {
      todayActivity.achievements = [...new Set([...todayActivity.achievements, ...activity.achievements])];
    }

    activities[today] = todayActivity;
    secureStorage.set(ACTIVITY_KEY, activities);

    // Update streak if this is first activity today
    const streakData = this.getStreakData();
    if (streakData.lastActiveDate !== today) {
      this.updateStreak();
    }
  }

  private getActivities(): Record<string, StreakActivity> {
    return secureStorage.get<Record<string, StreakActivity>>(ACTIVITY_KEY) || {};
  }

  updateStreak() {
    const today = this.getToday();
    const yesterday = this.getYesterday();
    const streakData = this.getStreakData();

    if (streakData.lastActiveDate === today) {
      // Already updated today
      return streakData;
    }

    if (streakData.lastActiveDate === yesterday) {
      // Continue streak
      streakData.currentStreak++;
      streakData.totalDaysActive++;
      
      if (!streakData.streakStartDate) {
        // Calculate start date
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - streakData.currentStreak + 1);
        streakData.streakStartDate = startDate.toISOString().split('T')[0];
      }
    } else if (streakData.lastActiveDate === '') {
      // First time
      streakData.currentStreak = 1;
      streakData.totalDaysActive = 1;
      streakData.streakStartDate = today;
    } else {
      // Streak broken
      streakData.currentStreak = 1;
      streakData.totalDaysActive++;
      streakData.streakStartDate = today;
    }

    // Update longest streak
    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }

    // Check milestones
    for (const milestone of MILESTONES) {
      if (streakData.currentStreak === milestone && !streakData.milestones.includes(milestone)) {
        streakData.milestones.push(milestone);
        // Award recovery token for certain milestones
        if ([7, 30, 100].includes(milestone)) {
          streakData.recoveryTokens++;
        }
      }
    }

    streakData.lastActiveDate = today;
    this.saveStreakData(streakData);

    return streakData;
  }

  checkStreak() {
    const today = this.getToday();
    const yesterday = this.getYesterday();
    const streakData = this.getStreakData();

    if (streakData.lastActiveDate !== yesterday && streakData.lastActiveDate !== today && streakData.currentStreak > 0) {
      // Streak broken - reset unless recovery token is used
      if (streakData.recoveryTokens > 0) {
        // Auto-recovery will be handled by user action
        return { streakBroken: true, canRecover: true };
      } else {
        streakData.currentStreak = 0;
        streakData.streakStartDate = '';
        this.saveStreakData(streakData);
        return { streakBroken: true, canRecover: false };
      }
    }

    return { streakBroken: false, canRecover: false };
  }

  useRecoveryToken(): boolean {
    const streakData = this.getStreakData();
    const yesterday = this.getYesterday();

    if (streakData.recoveryTokens > 0 && streakData.lastActiveDate !== yesterday) {
      // Restore streak
      streakData.recoveryTokens--;
      streakData.lastActiveDate = yesterday;
      this.saveStreakData(streakData);
      
      // Now update for today
      this.updateStreak();
      return true;
    }

    return false;
  }

  getStreakStats() {
    const streakData = this.getStreakData();
    const activities = this.getActivities();
    
    // Calculate total stats
    let totalPosts = 0;
    let totalInteractions = 0;
    let totalMinutes = 0;

    Object.values(activities).forEach(activity => {
      totalPosts += activity.posts;
      totalInteractions += activity.interactions;
      totalMinutes += activity.minutesActive;
    });

    // Next milestone
    const nextMilestone = MILESTONES.find(m => m > streakData.currentStreak) || 1000;

    return {
      ...streakData,
      totalPosts,
      totalInteractions,
      totalHoursActive: Math.floor(totalMinutes / 60),
      nextMilestone,
      daysToNextMilestone: nextMilestone - streakData.currentStreak,
      streakPercentage: Math.min((streakData.currentStreak / nextMilestone) * 100, 100),
    };
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Singleton instance
export const streakManager = StreakManager.getInstance();