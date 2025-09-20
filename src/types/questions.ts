export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  subjectId: string;
  questions: Question[];
  isEnemy: boolean; // true quando possui questões
  difficulty?: 'easy' | 'medium' | 'hard';
  priority?: number;
}

export interface FlashcardTopic {
  id: string;
  name: string;
  subjectId: string;
  questions: any[]; // Can store both Question[] or FlashcardQuestion[]
  isEnemy: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  priority?: number;
}

export interface FlashcardSubject {
  id: string;
  name: string;
  description?: string;
  color: string;
  topics: FlashcardTopic[];
}

export interface Question {
  id: string;
  topicId: string;
  title: string;
  content: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  images?: string[];
  examiningBoard?: string;
  position?: string;
  examYear?: string;
  institution?: string;
  questionType?: 'multiple_choice' | 'flashcard'; // New field for question type
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionOption {
  id: string;
  label: string;
  content: string;
  isCorrect: boolean;
}

export interface QuestionFormData {
  title: string;
  content: string;
  options: Omit<QuestionOption, 'id'>[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  images?: string[];
  examiningBoard?: string;
  position?: string;
  examYear?: string;
  institution?: string;
  questionType?: 'multiple_choice' | 'flashcard'; // New field for question type
}