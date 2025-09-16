export interface Stage {
  id: string; // stage--{journeyId}--{index} or stage--{legacySubjectId}
  title: string;
  description?: string;
  priority: number;
  estimatedHours: number;
  completedHours: number;
  status: 'not_started' | 'in_progress' | 'completed';
  order: number;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string; // task--{stageId}--{index} or preserved from legacy
  stageId: string;
  journeyId: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  priority: number;
  estimatedMinutes: number;
  actualMinutes: number;
  startDate?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Journey {
  id?: number; // Dexie auto-increment
  legacyId?: string; // Original SQLite study_plan id
  title: string;
  description?: string;
  examDate?: Date;
  totalHours: number;
  completedHours: number;
  focusAreas: string[];
  status: 'active' | 'completed' | 'paused' | 'archived';
  stages: Stage[];
  createdAt: Date;
  updatedAt: Date;
}

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