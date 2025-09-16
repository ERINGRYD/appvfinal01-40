import { useLiveQuery } from 'dexie-react-hooks';
import { heroTaskDB } from '@/db/dexie/database';
import { Habit, HabitCompletion } from '@/types/dexie/habit';

export function useHabits(stageId?: string, journeyId?: string) {
  // Get habits with optional filtering
  const habits = useLiveQuery(() => {
    if (stageId) {
      return heroTaskDB.habits.where('stageId').equals(stageId).toArray();
    } else if (journeyId) {
      return heroTaskDB.habits.where('journeyId').equals(journeyId).toArray();
    }
    return heroTaskDB.habits.where('isActive').equals(1).toArray();
  }, [stageId, journeyId]);
  
  // Get active habits only
  const activeHabits = useLiveQuery(() =>
    heroTaskDB.habits.where('isActive').equals(1).toArray()
  );
  
  const createHabit = async (habitData: Omit<Habit, 'createdAt' | 'updatedAt'>): Promise<void> => {
    const now = new Date();
    
    await heroTaskDB.habits.add({
      ...habitData,
      createdAt: now,
      updatedAt: now
    });
    
    console.log(`✅ Created habit: ${habitData.id}`);
  };
  
  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    await heroTaskDB.habits.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  };
  
  const completeHabit = async (habitId: string, notes?: string) => {
    const now = new Date();
    
    // Add completion record
    await heroTaskDB.habitCompletions.add({
      habitId,
      completedAt: now,
      notes
    });
    
    // Update habit streak
    const habit = await heroTaskDB.habits.get(habitId);
    if (habit) {
      const newStreak = habit.currentStreak + 1;
      const longestStreak = Math.max(habit.longestStreak, newStreak);
      
      await updateHabit(habitId, {
        currentStreak: newStreak,
        longestStreak,
        lastCompletedAt: now
      });
    }
    
    console.log(`✅ Completed habit: ${habitId}`);
  };
  
  const resetHabitStreak = async (habitId: string) => {
    await updateHabit(habitId, {
      currentStreak: 0
    });
  };
  
  const deleteHabit = async (id: string) => {
    await heroTaskDB.transaction('rw', [heroTaskDB.habits, heroTaskDB.habitCompletions], async () => {
      await heroTaskDB.habitCompletions.where('habitId').equals(id).delete();
      await heroTaskDB.habits.delete(id);
    });
    
    console.log(`🗑️ Deleted habit: ${id}`);
  };
  
  // Get habit completions for a specific habit
  const getHabitCompletions = (habitId: string) => useLiveQuery(() =>
    heroTaskDB.habitCompletions
      .where('habitId')
      .equals(habitId)
      .reverse()
      .toArray()
  );
  
  // Check if habit was completed today
  const wasCompletedToday = async (habitId: string): Promise<boolean> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const completion = await heroTaskDB.habitCompletions
      .where('habitId')
      .equals(habitId)
      .and(completion => completion.completedAt >= today && completion.completedAt < tomorrow)
      .first();
    
    return !!completion;
  };
  
  return {
    habits: habits || [],
    activeHabits: activeHabits || [],
    createHabit,
    updateHabit,
    completeHabit,
    resetHabitStreak,
    deleteHabit,
    getHabitCompletions,
    wasCompletedToday,
    isLoading: habits === undefined
  };
}