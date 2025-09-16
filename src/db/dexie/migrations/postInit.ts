import { heroTaskDB } from '../database';
import { Journey, Stage, Task } from '@/types/dexie/journey';

/**
 * Ensures all stage IDs follow the pattern: stage--{journeyId}--{index}
 * and updates references in habits
 */
export async function migrateStageIds(): Promise<void> {
  console.log('🔄 Starting stage ID migration...');
  
  try {
    await heroTaskDB.transaction('rw', [heroTaskDB.journeys, heroTaskDB.habits], async () => {
      const journeys = await heroTaskDB.journeys.toArray();
      
      for (const journey of journeys) {
        let hasChanges = false;
        const stageIdMapping: Record<string, string> = {};
        
        // Update stage IDs within each journey
        journey.stages = journey.stages.map((stage, index) => {
          const expectedId = `stage--${journey.id}--${index}`;
          
          if (stage.id !== expectedId) {
            stageIdMapping[stage.id] = expectedId;
            hasChanges = true;
            
            return {
              ...stage,
              id: expectedId,
              updatedAt: new Date()
            };
          }
          
          return stage;
        });
        
        // Update journey if changes were made
        if (hasChanges) {
          await heroTaskDB.journeys.update(journey.id!, { stages: journey.stages, updatedAt: new Date() });
          
          // Update habit references
          for (const [oldId, newId] of Object.entries(stageIdMapping)) {
            await heroTaskDB.habits
              .where('stageId')
              .equals(oldId)
              .modify({ 
                stageId: newId,
                journeyId: journey.id!.toString(),
                updatedAt: new Date()
              });
          }
        }
      }
    });
    
    console.log('✅ Stage ID migration completed');
  } catch (error) {
    console.error('Error in stage ID migration:', error);
    throw error;
  }
}

/**
 * Synchronizes embedded tasks in journey stages to the tasks table
 * Preserves existing task IDs when possible
 */
export async function syncTasksFromJourneys(): Promise<void> {
  console.log('🔄 Starting tasks synchronization...');
  
  try {
    await heroTaskDB.transaction('rw', [heroTaskDB.journeys, heroTaskDB.tasks], async () => {
      const journeys = await heroTaskDB.journeys.toArray();
      
      for (const journey of journeys) {
        for (const stage of journey.stages) {
          for (let taskIndex = 0; taskIndex < stage.tasks.length; taskIndex++) {
            const task = stage.tasks[taskIndex];
            
            // Generate deterministic ID if not present
            const taskId = task.id || `task--${stage.id}--${taskIndex}`;
            
            // Check if task already exists
            const existingTask = await heroTaskDB.tasks.get(taskId);
            
            const taskData: Task = {
              ...task,
              id: taskId,
              stageId: stage.id,
              journeyId: journey.id!.toString(),
              updatedAt: new Date()
            };
            
            if (existingTask) {
              // Update existing task
              await heroTaskDB.tasks.update(taskId, taskData);
            } else {
              // Create new task
              await heroTaskDB.tasks.add(taskData);
            }
          }
        }
      }
    });
    
    console.log('✅ Tasks synchronization completed');
  } catch (error) {
    console.error('Error in tasks synchronization:', error);
    throw error;
  }
}

/**
 * Runs all post-initialization migrations
 */
export async function runPostInitMigrations(): Promise<void> {
  console.log('🚀 Running post-initialization migrations...');
  
  try {
    await migrateStageIds();
    await syncTasksFromJourneys();
    
    console.log('✅ All post-init migrations completed successfully');
  } catch (error) {
    console.error('Error running post-init migrations:', error);
    throw error;
  }
}