import { useLiveQuery } from 'dexie-react-hooks';
import { heroTaskDB } from '@/db/dexie/database';
import { Journey, Stage } from '@/types/dexie/journey';

export function useJourneys() {
  // Get all journeys, ordered by creation date
  const journeys = useLiveQuery(() => 
    heroTaskDB.journeys.orderBy('createdAt').reverse().toArray()
  );
  
  // Get active journeys only
  const activeJourneys = useLiveQuery(() =>
    heroTaskDB.journeys.where('status').equals('active').toArray()
  );
  
  const createJourney = async (journeyData: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => {
    const now = new Date();
    
    const id = await heroTaskDB.journeys.add({
      ...journeyData,
      createdAt: now,
      updatedAt: now
    });
    
    console.log(`✅ Created journey with ID: ${id}`);
    return id;
  };
  
  const updateJourney = async (id: number, updates: Partial<Journey>) => {
    await heroTaskDB.journeys.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  };
  
  const deleteJourney = async (id: number) => {
    await heroTaskDB.transaction('rw', [heroTaskDB.journeys, heroTaskDB.tasks, heroTaskDB.habits], async () => {
      // Delete related tasks and habits
      await heroTaskDB.tasks.where('journeyId').equals(id.toString()).delete();
      await heroTaskDB.habits.where('journeyId').equals(id.toString()).delete();
      
      // Delete the journey
      await heroTaskDB.journeys.delete(id);
    });
    
    console.log(`🗑️ Deleted journey with ID: ${id}`);
  };
  
  const updateStage = async (journeyId: number, stageId: string, updates: Partial<Stage>) => {
    const journey = await heroTaskDB.journeys.get(journeyId);
    if (!journey) return;
    
    journey.stages = journey.stages.map(stage => 
      stage.id === stageId 
        ? { ...stage, ...updates, updatedAt: new Date() }
        : stage
    );
    
    await updateJourney(journeyId, { stages: journey.stages });
  };
  
  const completeStage = async (journeyId: number, stageId: string) => {
    await updateStage(journeyId, stageId, { 
      status: 'completed',
      completedHours: 0 // This would be calculated from actual tasks
    });
  };
  
  return {
    journeys: journeys || [],
    activeJourneys: activeJourneys || [],
    createJourney,
    updateJourney,
    deleteJourney,
    updateStage,
    completeStage,
    isLoading: journeys === undefined
  };
}