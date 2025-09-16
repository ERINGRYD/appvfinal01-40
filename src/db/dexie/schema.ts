// Dexie schema definition with proper indexing
export const DEXIE_SCHEMA = {
  // Hero profile (singleton)
  heroProfile: '++id, heroName, totalXp, level, updatedAt',
  
  // Journeys (main study plans)
  journeys: '++id, legacyId, title, status, examDate, createdAt, updatedAt',
  
  // Tasks (extracted from stages for better querying)
  tasks: '++id, stageId, journeyId, title, completed, priority, startDate, dueDate, createdAt, updatedAt, completedAt',
  
  // Habits (recurring activities)
  habits: 'id, stageId, journeyId, type, isActive, updatedAt',
  
  // Habit completions (tracking)
  habitCompletions: '++id, habitId, completedAt',
  
  // Hero attributes system
  heroAttributes: 'id, area, level, xp, updatedAt',
  
  // Attribute XP history
  attributeHistory: '++id, attributeId, deltaXp, at, sessionId, taskId',
  
  // Attribute goals
  attributeGoals: '++id, attributeId, targetLevel, isActive, dueDate, createdAt'
};

// Index optimization notes:
// - Primary keys are auto-increment (++id) or string (id)
// - Foreign keys (stageId, journeyId, attributeId) are indexed for joins
// - Status fields (completed, isActive, status) are indexed for filtering
// - Date fields (createdAt, updatedAt, completedAt, dueDate) are indexed for sorting/filtering
// - Priority is indexed for task ordering
// - Area is indexed for attribute grouping