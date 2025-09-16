import { heroTaskDB } from './database';
import { Journey, Task, Habit, HabitCompletion } from '@/types/dexie/journey';
import { HeroProfile, HeroAttribute, AttributeHistory, AttributeGoal } from '@/types/dexie/heroProfile';

export interface DexieBackupData {
  version: string;
  exportedAt: string;
  heroProfile: HeroProfile[];
  journeys: Journey[];
  tasks: Task[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  heroAttributes: HeroAttribute[];
  attributeHistory: AttributeHistory[];
  attributeGoals: AttributeGoal[];
}

/**
 * Export all Dexie data to JSON
 */
export async function exportDexieData(): Promise<string> {
  try {
    console.log('📦 Exporting Dexie database to JSON...');

    const backupData: DexieBackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      heroProfile: await heroTaskDB.heroProfile.toArray(),
      journeys: await heroTaskDB.journeys.toArray(),
      tasks: await heroTaskDB.tasks.toArray(),
      habits: await heroTaskDB.habits.toArray(),
      habitCompletions: await heroTaskDB.habitCompletions.toArray(),
      heroAttributes: await heroTaskDB.heroAttributes.toArray(),
      attributeHistory: await heroTaskDB.attributeHistory.toArray(),
      attributeGoals: await heroTaskDB.attributeGoals.toArray()
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    console.log('✅ Dexie data exported successfully');
    
    return jsonString;

  } catch (error) {
    console.error('Error exporting Dexie data:', error);
    throw error;
  }
}

/**
 * Import data from JSON to Dexie
 */
export async function importDexieData(jsonData: string, replaceExisting: boolean = false): Promise<void> {
  try {
    console.log('📥 Importing Dexie data from JSON...');

    const backupData: DexieBackupData = JSON.parse(jsonData);
    
    // Validate backup data structure
    if (!backupData.version || !backupData.exportedAt) {
      throw new Error('Invalid backup data format');
    }

    await heroTaskDB.transaction('rw', [
      heroTaskDB.heroProfile,
      heroTaskDB.journeys,
      heroTaskDB.tasks,
      heroTaskDB.habits,
      heroTaskDB.habitCompletions,
      heroTaskDB.heroAttributes,
      heroTaskDB.attributeHistory,
      heroTaskDB.attributeGoals
    ], async () => {
      
      if (replaceExisting) {
        // Clear all existing data
        await Promise.all([
          heroTaskDB.heroProfile.clear(),
          heroTaskDB.journeys.clear(),
          heroTaskDB.tasks.clear(),
          heroTaskDB.habits.clear(),
          heroTaskDB.habitCompletions.clear(),
          heroTaskDB.heroAttributes.clear(),
          heroTaskDB.attributeHistory.clear(),
          heroTaskDB.attributeGoals.clear()
        ]);
        console.log('🗑️ Cleared existing data');
      }

      // Import data store by store
      if (backupData.heroProfile?.length > 0) {
        await heroTaskDB.heroProfile.bulkAdd(backupData.heroProfile);
        console.log(`✅ Imported ${backupData.heroProfile.length} hero profile(s)`);
      }

      if (backupData.journeys?.length > 0) {
        await heroTaskDB.journeys.bulkAdd(backupData.journeys);
        console.log(`✅ Imported ${backupData.journeys.length} journey(s)`);
      }

      if (backupData.tasks?.length > 0) {
        await heroTaskDB.tasks.bulkAdd(backupData.tasks);
        console.log(`✅ Imported ${backupData.tasks.length} task(s)`);
      }

      if (backupData.habits?.length > 0) {
        await heroTaskDB.habits.bulkAdd(backupData.habits);
        console.log(`✅ Imported ${backupData.habits.length} habit(s)`);
      }

      if (backupData.habitCompletions?.length > 0) {
        await heroTaskDB.habitCompletions.bulkAdd(backupData.habitCompletions);
        console.log(`✅ Imported ${backupData.habitCompletions.length} habit completion(s)`);
      }

      if (backupData.heroAttributes?.length > 0) {
        await heroTaskDB.heroAttributes.bulkAdd(backupData.heroAttributes);
        console.log(`✅ Imported ${backupData.heroAttributes.length} hero attribute(s)`);
      }

      if (backupData.attributeHistory?.length > 0) {
        await heroTaskDB.attributeHistory.bulkAdd(backupData.attributeHistory);
        console.log(`✅ Imported ${backupData.attributeHistory.length} attribute history record(s)`);
      }

      if (backupData.attributeGoals?.length > 0) {
        await heroTaskDB.attributeGoals.bulkAdd(backupData.attributeGoals);
        console.log(`✅ Imported ${backupData.attributeGoals.length} attribute goal(s)`);
      }
    });

    console.log('✅ Dexie data import completed successfully');

  } catch (error) {
    console.error('Error importing Dexie data:', error);
    throw error;
  }
}

/**
 * Create a downloadable backup file
 */
export async function createDexieBackupFile(): Promise<Blob> {
  try {
    const jsonData = await exportDexieData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    return blob;
  } catch (error) {
    console.error('Error creating backup file:', error);
    throw error;
  }
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<Record<string, number>> {
  try {
    const stats = {
      heroProfile: await heroTaskDB.heroProfile.count(),
      journeys: await heroTaskDB.journeys.count(),
      tasks: await heroTaskDB.tasks.count(),
      habits: await heroTaskDB.habits.count(),
      habitCompletions: await heroTaskDB.habitCompletions.count(),
      heroAttributes: await heroTaskDB.heroAttributes.count(),
      attributeHistory: await heroTaskDB.attributeHistory.count(),
      attributeGoals: await heroTaskDB.attributeGoals.count()
    };

    return stats;
  } catch (error) {
    console.error('Error getting backup stats:', error);
    return {};
  }
}