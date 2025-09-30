import { Room, Difficulty } from './battle';

export type ColiseumMode = 'skirmish' | 'total_war' | 'rescue_operation';

export interface ColiseumConfig {
  mode: ColiseumMode;
  questionsCount: number;
  selectedSubjects?: string[];
  timeLimit?: number; // in minutes
}

export interface ColiseumQuestion {
  id: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  content: string;
  options?: Array<{ id: string; label: string; content: string; isCorrect: boolean }>;
  correctAnswer: string;
  explanation?: string;
  difficulty: Difficulty;
  room: Room;
}

export interface ColiseumSession {
  id: string;
  mode: ColiseumMode;
  config: ColiseumConfig;
  questions: ColiseumQuestion[];
  answers: Map<string, {
    selectedAnswer: string;
    isCorrect: boolean;
    timeTaken: number;
    markedForReview: boolean;
  }>;
  startTime: Date;
  currentQuestionIndex: number;
  timeRemaining?: number; // in seconds
  isCompleted: boolean;
}

export interface ColiseumReport {
  sessionId: string;
  mode: ColiseumMode;
  totalQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  totalTime: number; // in seconds
  xpEarned: number;
  performanceBySubject: Record<string, {
    correct: number;
    total: number;
    accuracy: number;
  }>;
  performanceByDifficulty: Record<Difficulty, {
    correct: number;
    total: number;
    accuracy: number;
  }>;
  classification: string;
}

// XP rewards by mode
export const COLISEUM_XP_REWARDS = {
  skirmish: {
    base: 100,
    bonus: 50,
    perfectBonus: 50
  },
  total_war: {
    base: 200,
    bonus: 100,
    perfectBonus: 100
  },
  rescue_operation: {
    base: 50,
    perEnemy: 50,
    perfectBonus: 100
  }
};

// Time limits by mode (in minutes)
export const COLISEUM_TIME_LIMITS = {
  skirmish: { min: 15, max: 30, default: 20 },
  total_war: { min: 120, max: 240, default: 180 },
  rescue_operation: { min: 0, max: 0, default: 0 } // No limit
};

// Question counts by mode
export const COLISEUM_QUESTION_COUNTS = {
  skirmish: { min: 10, max: 20, default: 15 },
  total_war: { min: 50, max: 100, default: 75 },
  rescue_operation: { min: 1, max: 999, default: 10 } // Based on red room enemies
};

// Classifications based on accuracy
export const getColiseumClassification = (accuracyRate: number): string => {
  if (accuracyRate >= 95) return 'Imperador do Coliseu';
  if (accuracyRate >= 90) return 'Campeão Invicto';
  if (accuracyRate >= 85) return 'Gladiador Lendário';
  if (accuracyRate >= 80) return 'Gladiador Veterano';
  if (accuracyRate >= 70) return 'Guerreiro Valoroso';
  if (accuracyRate >= 60) return 'Combatente Experiente';
  if (accuracyRate >= 50) return 'Gladiador em Treinamento';
  return 'Recruta da Arena';
};
