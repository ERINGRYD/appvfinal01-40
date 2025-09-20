import { getDBOrThrow, getScheduleSave } from '../singleton';
import { FlashcardQuestion } from '@/types/flashcard';
import type { Difficulty } from '@/types/battle';

/**
 * Create a new flashcard
 */
export const createFlashcard = (
  topicId: string,
  question: string,
  answer: string,
  difficulty: Difficulty = 'medium',
  tags: string[] = [],
  images: string[] = [],
  examiningBoard?: string,
  position?: string,
  examYear?: string,
  institution?: string
): string => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();
  const flashcardId = `flashcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Insert flashcard as a question with questionType = 'flashcard'
    database.run(`
      INSERT INTO questions (
        id, topic_id, title, content, correct_answer, 
        difficulty, tags, images, examining_board, 
        position, exam_year, institution, room, question_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      flashcardId,
      topicId,
      question,
      '', // Empty content for flashcards since question is in title
      answer,
      difficulty,
      JSON.stringify(tags),
      JSON.stringify(images),
      examiningBoard || null,
      position || null,
      examYear || null,
      institution || null,
      'triagem', // All new flashcards start in triage
      'flashcard'
    ]);

    scheduleSave();
    return flashcardId;
  } catch (error) {
    console.error('Error creating flashcard:', error);
    throw error;
  }
};

/**
 * Get flashcards by topic ID
 */
export const getFlashcardsByTopic = (topicId: string): FlashcardQuestion[] => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare(`
      SELECT q.*, t.name as topic_name, s.name as subject_name
      FROM questions q
      JOIN study_topics t ON q.topic_id = t.id
      JOIN study_subjects s ON t.subject_id = s.id
      WHERE q.topic_id = ? AND (q.question_type = 'flashcard' OR q.question_type IS NULL AND q.options IS NULL)
      ORDER BY q.created_at DESC
    `);
    
    const results: FlashcardQuestion[] = [];
    stmt.bind([topicId]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        topicId: row.topic_id as string,
        question: row.title as string,
        answer: row.correct_answer as string,
        difficulty: row.difficulty as Difficulty,
        tags: JSON.parse(row.tags as string || '[]'),
        images: JSON.parse(row.images as string || '[]'),
        examiningBoard: row.examining_board as string || undefined,
        position: row.position as string || undefined,
        examYear: row.exam_year as string || undefined,
        institution: row.institution as string || undefined,
        
        // Default spaced repetition values
        easeFactor: 2.5,
        interval: 1,
        repetition: 0,
        nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        averageQuality: 0,
        totalReviews: 0,
        streakCount: 0,
        failureCount: 0,
        
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        topicName: row.topic_name as string,
        subjectName: row.subject_name as string
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error getting flashcards by topic:', error);
    return [];
  }
};

/**
 * Get all flashcards from multiple topics
 */
export const getFlashcardsByTopics = (topicIds: string[]): FlashcardQuestion[] => {
  if (topicIds.length === 0) return [];
  
  const database = getDBOrThrow();

  try {
    const placeholders = topicIds.map(() => '?').join(',');
    const stmt = database.prepare(`
      SELECT q.*, t.name as topic_name, s.name as subject_name
      FROM questions q
      JOIN study_topics t ON q.topic_id = t.id
      JOIN study_subjects s ON t.subject_id = s.id
      WHERE q.topic_id IN (${placeholders}) AND (q.question_type = 'flashcard' OR q.question_type IS NULL AND q.options IS NULL)
      ORDER BY q.created_at DESC
    `);
    
    const results: FlashcardQuestion[] = [];
    stmt.bind(topicIds);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        topicId: row.topic_id as string,
        question: row.title as string,
        answer: row.correct_answer as string,
        difficulty: row.difficulty as Difficulty,
        tags: JSON.parse(row.tags as string || '[]'),
        images: JSON.parse(row.images as string || '[]'),
        examiningBoard: row.examining_board as string || undefined,
        position: row.position as string || undefined,
        examYear: row.exam_year as string || undefined,
        institution: row.institution as string || undefined,
        
        // Default spaced repetition values
        easeFactor: 2.5,
        interval: 1,
        repetition: 0,
        nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        averageQuality: 0,
        totalReviews: 0,
        streakCount: 0,
        failureCount: 0,
        
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        topicName: row.topic_name as string,
        subjectName: row.subject_name as string
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error getting flashcards by topics:', error);
    return [];
  }
};

/**
 * Get flashcards ready for review
 */
export const getFlashcardsReadyForReview = (topicIds?: string[], maxCards: number = 20): FlashcardQuestion[] => {
  const database = getDBOrThrow();

  try {
    let query = `
      SELECT q.*, t.name as topic_name, s.name as subject_name
      FROM questions q
      JOIN study_topics t ON q.topic_id = t.id
      JOIN study_subjects s ON t.subject_id = s.id
      WHERE (q.question_type = 'flashcard' OR q.question_type IS NULL AND q.options IS NULL)
    `;
    
    const params: any[] = [];
    
    if (topicIds && topicIds.length > 0) {
      const placeholders = topicIds.map(() => '?').join(',');
      query += ` AND q.topic_id IN (${placeholders})`;
      params.push(...topicIds);
    }
    
    query += ` ORDER BY q.created_at ASC LIMIT ?`;
    params.push(maxCards);
    
    const stmt = database.prepare(query);
    
    const results: FlashcardQuestion[] = [];
    stmt.bind(params);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        topicId: row.topic_id as string,
        question: row.title as string,
        answer: row.correct_answer as string,
        difficulty: row.difficulty as Difficulty,
        tags: JSON.parse(row.tags as string || '[]'),
        images: JSON.parse(row.images as string || '[]'),
        examiningBoard: row.examining_board as string || undefined,
        position: row.position as string || undefined,
        examYear: row.exam_year as string || undefined,
        institution: row.institution as string || undefined,
        
        // Default spaced repetition values
        easeFactor: 2.5,
        interval: 1,
        repetition: 0,
        nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        averageQuality: 0,
        totalReviews: 0,
        streakCount: 0,
        failureCount: 0,
        
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        topicName: row.topic_name as string,
        subjectName: row.subject_name as string
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error getting flashcards ready for review:', error);
    return [];
  }
};

/**
 * Delete a flashcard
 */
export const deleteFlashcard = (flashcardId: string): boolean => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    database.run('DELETE FROM questions WHERE id = ? AND question_type = ?', [flashcardId, 'flashcard']);
    scheduleSave();
    return true;
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return false;
  }
};

/**
 * Get flashcard statistics
 */
export const getFlashcardStats = (topicIds?: string[]) => {
  const database = getDBOrThrow();

  try {
    let query = `
      SELECT 
        COUNT(*) as total_flashcards,
        COUNT(CASE WHEN q.times_answered > 0 THEN 1 END) as reviewed_flashcards,
        AVG(CASE WHEN q.times_answered > 0 THEN q.accuracy_rate ELSE NULL END) as avg_accuracy
      FROM questions q
      WHERE (q.question_type = 'flashcard' OR q.question_type IS NULL AND q.options IS NULL)
    `;
    
    const params: any[] = [];
    
    if (topicIds && topicIds.length > 0) {
      const placeholders = topicIds.map(() => '?').join(',');
      query += ` AND q.topic_id IN (${placeholders})`;
      params.push(...topicIds);
    }
    
    const stmt = database.prepare(query);
    stmt.bind(params);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      
      return {
        totalFlashcards: row.total_flashcards as number,
        readyForReview: row.total_flashcards as number, // All are ready by default
        overdueCards: 0, // Would need proper spaced repetition tracking
        averageRetention: (row.avg_accuracy as number) || 0,
        cardsLearning: row.total_flashcards as number,
        cardsMastered: 0,
        todayReviewed: 0,
        streakDays: 0
      };
    }
    stmt.free();
    
    return {
      totalFlashcards: 0,
      readyForReview: 0,
      overdueCards: 0,
      averageRetention: 0,
      cardsLearning: 0,
      cardsMastered: 0,
      todayReviewed: 0,
      streakDays: 0
    };
  } catch (error) {
    console.error('Error getting flashcard stats:', error);
    return {
      totalFlashcards: 0,
      readyForReview: 0,
      overdueCards: 0,
      averageRetention: 0,
      cardsLearning: 0,
      cardsMastered: 0,
      todayReviewed: 0,
      streakDays: 0
    };
  }
};