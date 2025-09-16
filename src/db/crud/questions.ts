import { getDBOrThrow, getScheduleSave } from '../singleton';
import { updateEnemyRoom } from './enemies';
import type { Question, QuestionOption, QuestionAttempt, Room, ConfidenceLevel, Difficulty } from '@/types/battle';

/**
 * Create a new question
 */
export const createQuestion = (
  topicId: string,
  title: string,
  content: string,
  correctAnswer: string,
  options?: Omit<QuestionOption, 'id'>[],
  explanation?: string,
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
  const questionId = `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // First, try to insert with images column
    try {
      database.run(`
        INSERT INTO questions (
          id, topic_id, title, content, options, correct_answer, 
          explanation, difficulty, tags, images, examining_board, 
          position, exam_year, institution, room
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        questionId,
        topicId,
        title,
        content,
        options ? JSON.stringify(options) : null,
        correctAnswer,
        explanation || null,
        difficulty,
        JSON.stringify(tags),
        JSON.stringify(images),
        examiningBoard || null,
        position || null,
        examYear || null,
        institution || null,
        'triagem' // All new questions start in triage
      ]);
    } catch (imgError) {
      // If columns don't exist, add them and try again
      console.log('Adding missing columns to questions table...');
      try { database.run(`ALTER TABLE questions ADD COLUMN images TEXT DEFAULT '[]'`); } catch {}
      try { database.run(`ALTER TABLE questions ADD COLUMN examining_board TEXT`); } catch {}
      try { database.run(`ALTER TABLE questions ADD COLUMN position TEXT`); } catch {}
      try { database.run(`ALTER TABLE questions ADD COLUMN exam_year TEXT`); } catch {}
      try { database.run(`ALTER TABLE questions ADD COLUMN institution TEXT`); } catch {}
      
      database.run(`
        INSERT INTO questions (
          id, topic_id, title, content, options, correct_answer, 
          explanation, difficulty, tags, images, examining_board, 
          position, exam_year, institution, room
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        questionId,
        topicId,
        title,
        content,
        options ? JSON.stringify(options) : null,
        correctAnswer,
        explanation || null,
        difficulty,
        JSON.stringify(tags),
        JSON.stringify(images),
        examiningBoard || null,
        position || null,
        examYear || null,
        institution || null,
        'triagem' // All new questions start in triage
      ]);
    }

    scheduleSave();
    return questionId;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

/**
 * Get all questions from a specific room
 */
export const getQuestionsByRoom = (room: Room): Question[] => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare(`
      SELECT q.*, t.name as topic_name, s.name as subject_name
      FROM questions q
      JOIN study_topics t ON q.topic_id = t.id
      JOIN study_subjects s ON t.subject_id = s.id
      WHERE q.room = ?
      ORDER BY q.created_at DESC
    `);
    
      const results: Question[] = [];
    stmt.bind([room]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        topicId: row.topic_id as string,
        title: row.title as string,
        content: row.content as string,
        options: row.options ? JSON.parse(row.options as string) : undefined,
        correctAnswer: row.correct_answer as string,
        explanation: row.explanation as string || undefined,
        difficulty: row.difficulty as Difficulty,
        tags: JSON.parse(row.tags as string || '[]'),
        images: JSON.parse(row.images as string || '[]'),
        examiningBoard: row.examining_board as string || undefined,
        position: row.position as string || undefined,
        examYear: row.exam_year as string || undefined,
        institution: row.institution as string || undefined,
        timesAnswered: row.times_answered as number,
        timesCorrect: row.times_correct as number,
        accuracyRate: row.accuracy_rate as number,
        room: row.room as Room,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        topicName: row.topic_name as string,
        subjectName: row.subject_name as string
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error getting questions by room:', error);
    return [];
  }
};

/**
 * Get questions by topic ID
 */
export const getQuestionsByTopic = (topicId: string): Question[] => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare(`
      SELECT q.*, t.name as topic_name, s.name as subject_name
      FROM questions q
      JOIN study_topics t ON q.topic_id = t.id
      JOIN study_subjects s ON t.subject_id = s.id
      WHERE q.topic_id = ?
      ORDER BY q.created_at DESC
    `);
    
      const results: Question[] = [];
    stmt.bind([topicId]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        topicId: row.topic_id as string,
        title: row.title as string,
        content: row.content as string,
        options: row.options ? JSON.parse(row.options as string) : undefined,
        correctAnswer: row.correct_answer as string,
        explanation: row.explanation as string || undefined,
        difficulty: row.difficulty as Difficulty,
        tags: JSON.parse(row.tags as string || '[]'),
        images: JSON.parse(row.images as string || '[]'),
        examiningBoard: row.examining_board as string || undefined,
        position: row.position as string || undefined,
        examYear: row.exam_year as string || undefined,
        institution: row.institution as string || undefined,
        timesAnswered: row.times_answered as number,
        timesCorrect: row.times_correct as number,
        accuracyRate: row.accuracy_rate as number,
        room: row.room as Room,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        topicName: row.topic_name as string,
        subjectName: row.subject_name as string
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error getting questions by topic:', error);
    return [];
  }
};

/**
 * Get a single question by ID
 */
export const getQuestionById = (questionId: string): Question | null => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare(`
      SELECT q.*, t.name as topic_name, s.name as subject_name
      FROM questions q
      JOIN study_topics t ON q.topic_id = t.id
      JOIN study_subjects s ON t.subject_id = s.id
      WHERE q.id = ?
    `);
    
    stmt.bind([questionId]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      
      return {
        id: row.id as string,
        topicId: row.topic_id as string,
        title: row.title as string,
        content: row.content as string,
        options: row.options ? JSON.parse(row.options as string) : undefined,
        correctAnswer: row.correct_answer as string,
        explanation: row.explanation as string || undefined,
        difficulty: row.difficulty as Difficulty,
        tags: JSON.parse(row.tags as string || '[]'),
        images: JSON.parse(row.images as string || '[]'),
        examiningBoard: row.examining_board as string || undefined,
        position: row.position as string || undefined,
        examYear: row.exam_year as string || undefined,
        institution: row.institution as string || undefined,
        timesAnswered: row.times_answered as number,
        timesCorrect: row.times_correct as number,
        accuracyRate: row.accuracy_rate as number,
        room: row.room as Room,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        topicName: row.topic_name as string,
        subjectName: row.subject_name as string
      };
    }
    stmt.free();
    
    return null;
  } catch (error) {
    console.error('Error getting question by ID:', error);
    return null;
  }
};

/**
 * Record a question attempt
 */
export const recordQuestionAttempt = (
  questionId: string,
  answer: string,
  isCorrect: boolean,
  confidenceLevel: ConfidenceLevel,
  battleSessionId?: string,
  timeTaken?: number,
  errorType?: string
): string => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();
  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate XP based on difficulty and confidence
  const question = getQuestionById(questionId);
  let xpEarned = 0;
  
  if (isCorrect && question) {
    const baseXp = 10;
    const confidenceBonus = confidenceLevel === 'certeza' ? 5 : confidenceLevel === 'duvida' ? 3 : 1;
    const difficultyMultiplier = question.difficulty === 'hard' ? 2 : question.difficulty === 'medium' ? 1.5 : 1;
    
    xpEarned = Math.floor(baseXp * difficultyMultiplier + confidenceBonus);
  }

  try {
    // First, try to insert with error_type column
    try {
      database.run(`
        INSERT INTO question_attempts (
          id, question_id, battle_session_id, answer, is_correct, 
          confidence_level, time_taken, xp_earned, error_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        attemptId,
        questionId,
        battleSessionId || null,
        answer,
        isCorrect,
        confidenceLevel,
        timeTaken || null,
        xpEarned,
        errorType || null
      ]);
    } catch (colError) {
      // If column doesn't exist, add it and try again
      console.log('Adding error_type column to question_attempts table...');
      try { database.run(`ALTER TABLE question_attempts ADD COLUMN error_type TEXT`); } catch {}
      
      database.run(`
        INSERT INTO question_attempts (
          id, question_id, battle_session_id, answer, is_correct, 
          confidence_level, time_taken, xp_earned, error_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        attemptId,
        questionId,
        battleSessionId || null,
        answer,
        isCorrect,
        confidenceLevel,
        timeTaken || null,
        xpEarned,
        errorType || null
      ]);
    }

    // Update enemy room after recording the attempt
    if (question) {
      console.log(`Updating enemy room for topic ${question.topicId} after question attempt`);
      const newRoom = updateEnemyRoom(question.topicId);
      console.log(`Enemy moved to room: ${newRoom}`);
    }

    scheduleSave();
    return attemptId;
  } catch (error) {
    console.error('Error recording question attempt:', error);
    throw error;
  }
};

/**
 * Delete a question
 */
export const deleteQuestion = (questionId: string): boolean => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    database.run('DELETE FROM questions WHERE id = ?', [questionId]);
    scheduleSave();
    return true;
  } catch (error) {
    console.error('Error deleting question:', error);
    return false;
  }
};

/**
 * Get questions count by room
 */
export const getQuestionsCountByRoom = (): Record<Room, number> => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare(`
      SELECT room, COUNT(*) as count
      FROM questions
      GROUP BY room
    `);
    
    const result: Record<Room, number> = {
      triagem: 0,
      vermelha: 0,
      amarela: 0,
      verde: 0
    };
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      result[row.room as Room] = row.count as number;
    }
    stmt.free();

    return result;
  } catch (error) {
    console.error('Error getting questions count by room:', error);
    return { triagem: 0, vermelha: 0, amarela: 0, verde: 0 };
  }
};

/**
 * Import questions in batch with proper validation and enemy creation
 */
export const importQuestionsInBatch = async (questions: any[], defaultTopicId?: string): Promise<{
  success: number;
  failed: number;
  errors: string[];
  results: Array<{ success: boolean; questionId?: string; error?: string; title: string; }>
}> => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();
  
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    results: [] as Array<{ success: boolean; questionId?: string; error?: string; title: string; }>
  };

  // Verify default topic exists if provided
  if (defaultTopicId) {
    const topicExists = database.prepare('SELECT id FROM study_topics WHERE id = ?');
    topicExists.bind([defaultTopicId]);
    if (!topicExists.step()) {
      topicExists.free();
      throw new Error(`Tópico padrão ${defaultTopicId} não encontrado`);
    }
    topicExists.free();
  }

  for (const questionData of questions) {
    try {
      const topicId = questionData.topicId || defaultTopicId;
      
      if (!topicId) {
        results.failed++;
        results.errors.push(`Questão "${questionData.title}" não tem topicId e nenhum tópico padrão foi fornecido`);
        results.results.push({
          success: false,
          error: 'TopicId não fornecido',
          title: questionData.title
        });
        continue;
      }

      // Verify topic exists
      const topicStmt = database.prepare('SELECT id FROM study_topics WHERE id = ?');
      topicStmt.bind([topicId]);
      const topicExists = topicStmt.step();
      topicStmt.free();

      if (!topicExists) {
        results.failed++;
        results.errors.push(`Tópico ${topicId} não encontrado para a questão "${questionData.title}"`);
        results.results.push({
          success: false,
          error: `Tópico ${topicId} não encontrado`,
          title: questionData.title
        });
        continue;
      }

      // Create question
      const questionId = createQuestion(
        topicId,
        questionData.title,
        questionData.content,
        questionData.correctAnswer,
        questionData.options,
        questionData.explanation,
        questionData.difficulty || 'medium',
        questionData.tags || [],
        questionData.images || [],
        questionData.examiningBoard,
        questionData.position,
        questionData.examYear,
        questionData.institution
      );

      results.success++;
      results.results.push({
        success: true,
        questionId,
        title: questionData.title
      });

      console.log(`✅ Questão importada: ${questionData.title} -> Tópico: ${topicId}`);

    } catch (error) {
      results.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      results.errors.push(`Erro ao importar questão "${questionData.title}": ${errorMsg}`);
      results.results.push({
        success: false,
        error: errorMsg,
        title: questionData.title
      });
      console.error(`❌ Erro ao importar questão "${questionData.title}":`, error);
    }
  }

  scheduleSave();
  
  console.log(`📊 Importação concluída: ${results.success} sucessos, ${results.failed} falhas`);
  
  return results;
};
