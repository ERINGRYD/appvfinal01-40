export interface Habit {
  id: string; // habit--{stageId}--{type} or custom
  stageId: string;
  journeyId: string;
  type: 'daily_review' | 'pomodoro' | 'flashcards' | 'custom';
  title: string;
  description?: string;
  targetFrequency: number; // times per week
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitCompletion {
  id?: number;
  habitId: string;
  completedAt: Date;
  notes?: string;
}