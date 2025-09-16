// Persistence facade layer - routes between SQLite and Dexie engines
import { StudyPlan, StudySession } from '@/types/study';
import { 
  saveStudyPlan as dbSaveStudyPlan,
  loadStudyPlan as dbLoadStudyPlan,
  deleteStudyPlan as dbDeleteStudyPlan,
  saveNamedStudyPlan,
  getSavedPlans as dbGetSavedPlans,
  getActivePlan as dbGetActivePlan,
  saveStudySession,
  loadStudySessions,
  saveDailyLogs as dbSaveDailyLogs,
  loadDailyLogs as dbLoadDailyLogs,
  exportDatabase,
  // New CRUD functions
  AppSetting,
  StudyGoal,
  PerformanceMetric,
  saveAppSetting,
  loadAppSetting,
  loadAppSettings,
  deleteAppSetting,
  saveTypedSetting,
  loadTypedSetting,
  saveStudyGoal,
  loadStudyGoal,
  loadStudyGoals,
  updateStudyGoalProgress,
  deleteStudyGoal,
  loadGoalsBySubject,
  loadUpcomingGoals,
  savePerformanceMetric,
  loadPerformanceMetric,
  loadPerformanceMetrics,
  deletePerformanceMetric,
  loadDailyMetrics,
  loadWeeklyMetrics,
  loadMonthlyMetrics,
  calculateDailyMetrics
} from '@/db/crud';
import { withDatabase, safeDatabaseOperation } from '@/utils/databaseUtils';
import { getDBOrThrow, getScheduleSave } from '@/db/singleton';

// Active study plan operations with safe database access
export const saveActiveStudyPlan = (plan: StudyPlan): void => {
  safeDatabaseOperation(() => {
    // Use stable ID to prevent duplicates
    const planId = plan.id || 'active_plan';
    const planWithId = { ...plan, id: planId };
    
    console.log(`💾 Saving active study plan with ID: ${planId}`);
    
    // Save the plan data
    dbSaveStudyPlan(planWithId);
    
    // Save as app setting for robust recovery
    saveTypedSetting('active_plan_id', planId, 'general', 'ID do plano ativo atual');
    
    // Ensure there's a saved_plans entry marked as active
    const database = getDBOrThrow();
    try {
      // Mark all other plans as inactive
      database.run('UPDATE saved_plans SET is_active = FALSE');
      
      // Insert or update the current active plan
      database.run(`
        INSERT OR REPLACE INTO saved_plans (id, name, plan_id, is_active)
        VALUES (?, ?, ?, TRUE)
      `, [planId, 'Plano Atual', planId]);
      
      // Trigger save to IndexedDB
      const scheduleSave = getScheduleSave();
      scheduleSave();
      
      console.log(`✅ Active plan ${planId} saved successfully`);
    } catch (error) {
      console.error('Error updating saved_plans for active plan:', error);
    }
  });
};

export const loadActiveStudyPlan = (): StudyPlan | null => {
  return withDatabase(() => {
    console.log('🔍 Loading active study plan...');
    
    // Strategy 1: Try to load from app_settings.active_plan_id
    try {
      const activePlanId = loadTypedSetting('active_plan_id', 'general');
      if (activePlanId) {
        console.log(`📋 Found active_plan_id setting: ${activePlanId}`);
        const plan = dbLoadStudyPlan(activePlanId);
        if (plan) {
          console.log(`✅ Successfully loaded active plan from app_settings: ${activePlanId}`);
          return plan;
        }
        console.log(`⚠️ Plan ${activePlanId} not found, trying fallback...`);
      }
    } catch (error) {
      console.log('⚠️ No active_plan_id in app_settings, trying fallback...');
    }
    
    // Strategy 2: Try to load from saved_plans with is_active = TRUE
    try {
      const activePlan = dbGetActivePlan();
      if (activePlan?.plan) {
        console.log(`✅ Successfully loaded active plan from saved_plans: ${activePlan.plan.id}`);
        return activePlan.plan;
      }
    } catch (error) {
      console.log('⚠️ No active plan in saved_plans, trying fallback...');
    }
    
    // Strategy 3: Load most recent plan from study_plans as last resort
    try {
      const database = getDBOrThrow();
      const stmt = database.prepare('SELECT id FROM study_plans ORDER BY updated_at DESC LIMIT 1');
      const result = stmt.getAsObject();
      stmt.free();
      
      if (result.id) {
        const planId = result.id as string;
        const plan = dbLoadStudyPlan(planId);
        if (plan) {
          console.log(`🔄 Loading most recent plan as fallback: ${planId}`);
          // Auto-repair: set this as the active plan
          saveTypedSetting('active_plan_id', planId, 'general', 'ID do plano ativo atual');
          return plan;
        }
      }
    } catch (error) {
      console.error('Error in fallback plan loading:', error);
    }
    
    console.log('❌ No active study plan found');
    return null;
  }, null);
};

// Daily logs operations with safe database access
export const saveDailyLogs = (logs: any[]): void => {
  safeDatabaseOperation(() => {
    dbSaveDailyLogs(logs);
  });
};

export const loadDailyLogs = (): any[] => {
  return withDatabase(() => {
    return dbLoadDailyLogs();
  }, []);
};

// Advanced plan management with active plan consistency
export const saveStudyPlan = (plan: StudyPlan, name: string): string => {
  try {
    const planId = saveNamedStudyPlan(plan, name);
    
    // Ensure consistency: update active_plan_id when saving a named plan
    console.log(`🔄 Updating active plan ID to ${planId} after saving named plan`);
    saveTypedSetting('active_plan_id', planId, 'general', 'ID do plano ativo atual');
    
    return planId;
  } catch (error) {
    console.error('Error saving study plan:', error);
    return '';
  }
};

export const getSavedPlans = () => {
  try {
    return dbGetSavedPlans();
  } catch (error) {
    console.error('Error loading saved plans:', error);
    return [];
  }
};

export const loadStudyPlan = (planId: string): StudyPlan | null => {
  try {
    return dbLoadStudyPlan(planId);
  } catch (error) {
    console.error('Error loading study plan:', error);
    return null;
  }
};

export const deleteStudyPlan = (planId: string): boolean => {
  try {
    return dbDeleteStudyPlan(planId);
  } catch (error) {
    console.error('Error deleting study plan:', error);
    return false;
  }
};

export const getActivePlan = () => {
  try {
    return dbGetActivePlan();
  } catch (error) {
    console.error('Error getting active plan:', error);
    return null;
  }
};

// Study sessions
export const saveStudySessionData = (session: StudySession): void => {
  try {
    saveStudySession(session);
  } catch (error) {
    console.error('Error saving study session:', error);
  }
};

export const loadStudySessionsData = (): StudySession[] => {
  try {
    return loadStudySessions();
  } catch (error) {
    console.error('Error loading study sessions:', error);
    return [];
  }
};

// Export/Import functionality
export const exportStudyPlan = (planId: string): string | null => {
  try {
    const plan = loadStudyPlan(planId);
    if (plan) {
      const exportData = {
        plan,
        exportedAt: new Date()
      };
      return JSON.stringify(exportData, null, 2);
    }
    return null;
  } catch (error) {
    console.error('Error exporting study plan:', error);
    return null;
  }
};

export const importStudyPlan = (jsonData: string): string | null => {
  try {
    const importData = JSON.parse(jsonData);
    const planId = `imported_${Date.now()}`;
    const planName = `Imported Plan (${new Date().toLocaleDateString()})`;
    
    const plan: StudyPlan = { ...importData.plan, id: planId };
    return saveStudyPlan(plan, planName);
  } catch (error) {
    console.error('Error importing study plan:', error);
    return null;
  }
};

// Database backup and recovery
export const createBackup = (): Blob => {
  try {
    return exportDatabase();
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

// Re-export new CRUD functions for convenience
export {
  // App Settings
  saveAppSetting,
  loadAppSetting,
  loadAppSettings,
  deleteAppSetting,
  saveTypedSetting,
  loadTypedSetting,
  
  // Study Goals
  saveStudyGoal,
  loadStudyGoal,
  loadStudyGoals,
  updateStudyGoalProgress,
  deleteStudyGoal,
  loadGoalsBySubject,
  loadUpcomingGoals,
  
  // Performance Metrics
  savePerformanceMetric,
  loadPerformanceMetric,
  loadPerformanceMetrics,
  deletePerformanceMetric,
  loadDailyMetrics,
  loadWeeklyMetrics,
  loadMonthlyMetrics,
  calculateDailyMetrics
};

// Re-export types
export type { AppSetting, StudyGoal, PerformanceMetric };

// ==========================================
// NEW DEXIE-BASED FUNCTIONS (Journey System)
// ==========================================

// These functions use the new Dexie database for the journey/task/habit system
// while maintaining backward compatibility with existing SQLite functions

import { heroTaskDB } from '@/db/dexie/database';
import { Journey, Task, Habit } from '@/types/dexie/journey';
import { HeroProfile } from '@/types/dexie/heroProfile';

/**
 * Journey Management (Dexie-based)
 */
export const saveJourney = async (journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => {
  const now = new Date();
  const id = await heroTaskDB.journeys.add({
    ...journey,
    createdAt: now,
    updatedAt: now
  });
  
  console.log(`✅ Saved journey with ID: ${id}`);
  return id;
};

export const loadJourney = async (id: number): Promise<Journey | null> => {
  try {
    const journey = await heroTaskDB.journeys.get(id);
    return journey || null;
  } catch (error) {
    console.error('Error loading journey:', error);
    return null;
  }
};

export const loadAllJourneys = async (): Promise<Journey[]> => {
  try {
    return await heroTaskDB.journeys.orderBy('createdAt').reverse().toArray();
  } catch (error) {
    console.error('Error loading journeys:', error);
    return [];
  }
};

export const deleteJourney = async (id: number): Promise<boolean> => {
  try {
    await heroTaskDB.transaction('rw', [heroTaskDB.journeys, heroTaskDB.tasks, heroTaskDB.habits], async () => {
      // Delete related tasks and habits
      await heroTaskDB.tasks.where('journeyId').equals(id.toString()).delete();
      await heroTaskDB.habits.where('journeyId').equals(id.toString()).delete();
      
      // Delete the journey
      await heroTaskDB.journeys.delete(id);
    });
    
    console.log(`🗑️ Deleted journey with ID: ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting journey:', error);
    return false;
  }
};

/**
 * Task Management (Dexie-based)
 */
export const saveTask = async (task: Omit<Task, 'createdAt' | 'updatedAt'>): Promise<void> => {
  const now = new Date();
  await heroTaskDB.tasks.put({
    ...task,
    createdAt: task.id ? (await heroTaskDB.tasks.get(task.id))?.createdAt || now : now,
    updatedAt: now
  });
  
  console.log(`✅ Saved task: ${task.id}`);
};

export const loadTasksByStage = async (stageId: string): Promise<Task[]> => {
  try {
    return await heroTaskDB.tasks.where('stageId').equals(stageId).toArray();
  } catch (error) {
    console.error('Error loading tasks by stage:', error);
    return [];
  }
};

export const loadTasksByJourney = async (journeyId: string): Promise<Task[]> => {
  try {
    return await heroTaskDB.tasks.where('journeyId').equals(journeyId).toArray();
  } catch (error) {
    console.error('Error loading tasks by journey:', error);
    return [];
  }
};

export const completeTask = async (taskId: string, actualMinutes?: number): Promise<void> => {
  const now = new Date();
  await heroTaskDB.tasks.update(taskId, {
    completed: true,
    completedAt: now,
    actualMinutes: actualMinutes || 0,
    updatedAt: now
  });
  
  console.log(`✅ Completed task: ${taskId}`);
};

/**
 * Habit Management (Dexie-based)
 */
export const saveHabit = async (habit: Omit<Habit, 'createdAt' | 'updatedAt'>): Promise<void> => {
  const now = new Date();
  await heroTaskDB.habits.put({
    ...habit,
    createdAt: habit.id ? (await heroTaskDB.habits.get(habit.id))?.createdAt || now : now,
    updatedAt: now
  });
  
  console.log(`✅ Saved habit: ${habit.id}`);
};

export const loadHabitsByStage = async (stageId: string): Promise<Habit[]> => {
  try {
    return await heroTaskDB.habits.where('stageId').equals(stageId).toArray();
  } catch (error) {
    console.error('Error loading habits by stage:', error);
    return [];
  }
};

export const loadActiveHabits = async (): Promise<Habit[]> => {
  try {
    return await heroTaskDB.habits.where('isActive').equals(1).toArray();
  } catch (error) {
    console.error('Error loading active habits:', error);
    return [];
  }
};

/**
 * Hero Profile Management (Dexie-based)
 */
export const getHeroProfile = async (): Promise<HeroProfile | null> => {
  try {
    return await heroTaskDB.heroProfile.get(1) || null;
  } catch (error) {
    console.error('Error loading hero profile:', error);
    return null;
  }
};

export const updateHeroProfile = async (updates: Partial<HeroProfile>): Promise<void> => {
  await heroTaskDB.heroProfile.update(1, {
    ...updates,
    updatedAt: new Date()
  });
  
  console.log('✅ Updated hero profile');
};
