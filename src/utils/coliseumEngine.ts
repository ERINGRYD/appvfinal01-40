import { 
  ColiseumMode, 
  ColiseumConfig, 
  ColiseumSession, 
  ColiseumQuestion,
  ColiseumReport,
  COLISEUM_XP_REWARDS,
  COLISEUM_TIME_LIMITS,
  getColiseumClassification
} from '@/types/coliseum';
import { getEnemiesByRoom, getEnemyQuestions } from '@/db/crud/enemies';
import type { Difficulty } from '@/types/battle';

/**
 * Load questions for coliseum based on mode and configuration
 */
export const loadColiseumQuestions = async (
  config: ColiseumConfig
): Promise<ColiseumQuestion[]> => {
  const { mode, questionsCount, selectedSubjects } = config;

  try {
    let allQuestions: any[] = [];

    if (mode === 'rescue_operation') {
      // Load questions from red room enemies
      const enemyStats = getEnemiesByRoom();
      const redEnemies = enemyStats.vermelha;
      
      for (const enemy of redEnemies) {
        const questions = getEnemyQuestions(enemy.topicId);
        allQuestions.push(...questions);
      }
    } else {
      // Load questions from all available enemies
      const enemyStats = getEnemiesByRoom();
      const allEnemies = [
        ...enemyStats.triagem,
        ...enemyStats.vermelha,
        ...enemyStats.amarela,
        ...enemyStats.verde
      ];
      
      for (const enemy of allEnemies) {
        // Filter by subjects if specified
        if (selectedSubjects && selectedSubjects.length > 0) {
          if (!selectedSubjects.includes(enemy.subjectName)) {
            continue;
          }
        }
        
        const questions = getEnemyQuestions(enemy.topicId);
        allQuestions.push(...questions);
      }
    }

    // Shuffle questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    
    // Take requested amount
    const selected = mode === 'rescue_operation' 
      ? shuffled 
      : shuffled.slice(0, questionsCount);

    // Convert to ColiseumQuestion format
    return selected.map(q => ({
      id: q.id,
      topicId: q.topicId,
      topicName: q.topicName,
      subjectName: q.subjectName,
      content: q.content,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      room: q.room
    }));
  } catch (error) {
    console.error('Error loading coliseum questions:', error);
    return [];
  }
};

/**
 * Create a new coliseum session
 */
export const createColiseumSession = (
  config: ColiseumConfig,
  questions: ColiseumQuestion[]
): ColiseumSession => {
  const timeConfig = COLISEUM_TIME_LIMITS[config.mode];
  const timeLimit = config.timeLimit || timeConfig.default;
  
  return {
    id: `coliseum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    mode: config.mode,
    config,
    questions,
    answers: new Map(),
    startTime: new Date(),
    currentQuestionIndex: 0,
    timeRemaining: timeLimit > 0 ? timeLimit * 60 : undefined,
    isCompleted: false
  };
};

/**
 * Calculate XP rewards based on performance
 */
export const calculateColiseumXP = (
  mode: ColiseumMode,
  correctAnswers: number,
  totalQuestions: number,
  timeTaken: number
): number => {
  const rewards = COLISEUM_XP_REWARDS[mode];
  const accuracyRate = (correctAnswers / totalQuestions) * 100;
  
  let totalXP = 0;

  if (mode === 'rescue_operation') {
    const rescueRewards = rewards as { base: number; perEnemy: number; perfectBonus: number };
    totalXP = rescueRewards.base + (correctAnswers * rescueRewards.perEnemy);
    
    if (accuracyRate === 100) {
      totalXP += rescueRewards.perfectBonus;
    }
  } else {
    const combatRewards = rewards as { base: number; bonus: number; perfectBonus: number };
    totalXP = combatRewards.base;
    
    // Bonus for accuracy
    if (accuracyRate >= 90) {
      totalXP += combatRewards.bonus;
    } else if (accuracyRate >= 70) {
      totalXP += Math.floor(combatRewards.bonus * 0.5);
    }
    
    // Perfect bonus
    if (accuracyRate === 100) {
      totalXP += combatRewards.perfectBonus;
    }
    
    // Time bonus (faster = more XP)
    const avgTimePerQuestion = timeTaken / totalQuestions;
    if (avgTimePerQuestion < 60) { // Less than 1 minute per question
      totalXP += 25;
    }
  }

  return Math.floor(totalXP);
};

/**
 * Generate detailed battle report
 */
export const generateColiseumReport = (session: ColiseumSession): ColiseumReport => {
  const totalQuestions = session.questions.length;
  let correctAnswers = 0;
  
  const performanceBySubject: Record<string, { correct: number; total: number; accuracy: number }> = {};
  const performanceByDifficulty: Record<Difficulty, { correct: number; total: number; accuracy: number }> = {
    easy: { correct: 0, total: 0, accuracy: 0 },
    medium: { correct: 0, total: 0, accuracy: 0 },
    hard: { correct: 0, total: 0, accuracy: 0 }
  };

  // Calculate statistics
  session.questions.forEach(question => {
    const answer = session.answers.get(question.id);
    const isCorrect = answer?.isCorrect || false;
    
    if (isCorrect) {
      correctAnswers++;
    }

    // By subject
    if (!performanceBySubject[question.subjectName]) {
      performanceBySubject[question.subjectName] = { correct: 0, total: 0, accuracy: 0 };
    }
    performanceBySubject[question.subjectName].total++;
    if (isCorrect) {
      performanceBySubject[question.subjectName].correct++;
    }

    // By difficulty
    performanceByDifficulty[question.difficulty].total++;
    if (isCorrect) {
      performanceByDifficulty[question.difficulty].correct++;
    }
  });

  // Calculate accuracy percentages
  Object.keys(performanceBySubject).forEach(subject => {
    const stats = performanceBySubject[subject];
    stats.accuracy = (stats.correct / stats.total) * 100;
  });

  Object.keys(performanceByDifficulty).forEach(difficulty => {
    const stats = performanceByDifficulty[difficulty as Difficulty];
    if (stats.total > 0) {
      stats.accuracy = (stats.correct / stats.total) * 100;
    }
  });

  const accuracyRate = (correctAnswers / totalQuestions) * 100;
  const totalTime = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
  const xpEarned = calculateColiseumXP(session.mode, correctAnswers, totalQuestions, totalTime);
  const classification = getColiseumClassification(accuracyRate);

  return {
    sessionId: session.id,
    mode: session.mode,
    totalQuestions,
    correctAnswers,
    accuracyRate,
    totalTime,
    xpEarned,
    performanceBySubject,
    performanceByDifficulty,
    classification
  };
};

/**
 * Validate if configuration is valid
 */
export const validateColiseumConfig = (
  config: ColiseumConfig,
  availableQuestionsCount: number
): { isValid: boolean; error?: string } => {
  if (config.mode === 'rescue_operation') {
    if (availableQuestionsCount === 0) {
      return { isValid: false, error: 'Nenhum inimigo disponível na Sala Vermelha' };
    }
    return { isValid: true };
  }

  if (config.questionsCount < 10) {
    return { isValid: false, error: 'Mínimo de 10 questões necessário' };
  }

  if (config.questionsCount > availableQuestionsCount) {
    return { 
      isValid: false, 
      error: `Apenas ${availableQuestionsCount} questões disponíveis` 
    };
  }

  if (config.mode === 'total_war' && availableQuestionsCount < 25) {
    return { 
      isValid: false, 
      error: 'Guerra Total requer mínimo de 25 inimigos disponíveis' 
    };
  }

  return { isValid: true };
};
