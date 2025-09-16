import { useLiveQuery } from 'dexie-react-hooks';
import { heroTaskDB } from '@/db/dexie/database';
import { Task } from '@/types/dexie/journey';

export function useTasks(stageId?: string, journeyId?: string) {
  // Get tasks with optional filtering
  const tasks = useLiveQuery(() => {
    let query = heroTaskDB.tasks.orderBy('priority').reverse();
    
    if (stageId) {
      query = heroTaskDB.tasks.where('stageId').equals(stageId);
    } else if (journeyId) {
      query = heroTaskDB.tasks.where('journeyId').equals(journeyId);
    }
    
    return query.toArray();
  }, [stageId, journeyId]);
  
  // Get completed tasks
  const completedTasks = useLiveQuery(() => 
    heroTaskDB.tasks.where('completed').equals(1).toArray()
  );
  
  // Get pending tasks
  const pendingTasks = useLiveQuery(() => 
    heroTaskDB.tasks.where('completed').equals(0).toArray()
  );
  
  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const now = new Date();
    const taskId = `task--${taskData.stageId}--${Date.now()}`;
    
    await heroTaskDB.tasks.add({
      ...taskData,
      id: taskId,
      createdAt: now,
      updatedAt: now
    });
    
    console.log(`✅ Created task with ID: ${taskId}`);
    return taskId;
  };
  
  const updateTask = async (id: string, updates: Partial<Task>) => {
    await heroTaskDB.tasks.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  };
  
  const completeTask = async (id: string, actualMinutes?: number) => {
    const now = new Date();
    
    await heroTaskDB.tasks.update(id, {
      completed: true,
      completedAt: now,
      actualMinutes: actualMinutes || 0,
      updatedAt: now
    });
    
    console.log(`✅ Completed task: ${id}`);
  };
  
  const uncompleteTask = async (id: string) => {
    await heroTaskDB.tasks.update(id, {
      completed: false,
      completedAt: undefined,
      updatedAt: new Date()
    });
  };
  
  const deleteTask = async (id: string) => {
    await heroTaskDB.tasks.delete(id);
    console.log(`🗑️ Deleted task: ${id}`);
  };
  
  // Get tasks by date range
  const getTasksByDateRange = useLiveQuery(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return heroTaskDB.tasks
      .where('dueDate')
      .between(today, tomorrow)
      .toArray();
  });
  
  return {
    tasks: tasks || [],
    completedTasks: completedTasks || [],
    pendingTasks: pendingTasks || [],
    todayTasks: getTasksByDateRange || [],
    createTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    isLoading: tasks === undefined
  };
}