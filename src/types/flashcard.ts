export interface FlashcardQuestion {
  id: string;
  topicId: string;
  question: string;  // Front of the card
  answer: string;    // Back of the card
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  images?: string[];
  examiningBoard?: string;
  position?: string;
  examYear?: string;
  institution?: string;
  
  // Spaced repetition data
  easeFactor: number;
  interval: number;
  repetition: number;
  nextReviewDate: Date;
  lastReviewDate?: Date;
  averageQuality: number;
  totalReviews: number;
  streakCount: number;
  failureCount: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  topicName?: string;
  subjectName?: string;
}

export interface FlashcardFormData {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  images?: string[];
  examiningBoard?: string;
  position?: string;
  examYear?: string;
  institution?: string;
}

export interface FlashcardSession {
  id: string;
  topicIds: string[];
  maxCards: number;
  currentCardIndex: number;
  cards: FlashcardQuestion[];
  startTime: Date;
  endTime?: Date;
  totalCorrect: number;
  totalReviewed: number;
  averageResponseTime: number;
}

export interface FlashcardStats {
  totalFlashcards: number;
  readyForReview: number;
  overdueCards: number;
  averageRetention: number;
  cardsLearning: number;
  cardsMastered: number;
  todayReviewed: number;
  streakDays: number;
}

export type FlashcardResponse = 'again' | 'hard' | 'good' | 'easy';