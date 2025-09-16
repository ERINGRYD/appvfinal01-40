import { useLiveQuery } from 'dexie-react-hooks';
import { heroTaskDB } from '@/db/dexie/database';
import { HeroAttribute, AttributeHistory, AttributeGoal } from '@/types/dexie/heroProfile';

export function useAttributeSystem() {
  // Get all hero attributes
  const attributes = useLiveQuery(() => 
    heroTaskDB.heroAttributes.orderBy('id').toArray()
  );
  
  // Get attribute history
  const attributeHistory = useLiveQuery(() =>
    heroTaskDB.attributeHistory.orderBy('at').reverse().toArray()
  );
  
  // Get active attribute goals
  const activeGoals = useLiveQuery(() =>
    heroTaskDB.attributeGoals.where('isActive').equals(1).toArray()
  );
  
  const addAttributeXp = async (
    attributeId: string, 
    deltaXp: number, 
    reason: string,
    sessionId?: string,
    taskId?: string
  ) => {
    const attribute = await heroTaskDB.heroAttributes.get(attributeId);
    if (!attribute) return;
    
    const newXp = Math.max(0, attribute.xp + deltaXp);
    let newLevel = attribute.level;
    let newXpForNextLevel = attribute.xpForNextLevel;
    
    // Level up calculation (100 XP per level)
    while (newXp >= newXpForNextLevel) {
      newLevel++;
      newXpForNextLevel = newLevel * 100;
    }
    
    // Update attribute
    await heroTaskDB.heroAttributes.update(attributeId, {
      xp: newXp,
      level: newLevel,
      xpForNextLevel: newXpForNextLevel,
      updatedAt: new Date()
    });
    
    // Record history
    await heroTaskDB.attributeHistory.add({
      attributeId,
      deltaXp,
      reason,
      sessionId,
      taskId,
      at: new Date()
    });
    
    console.log(`📈 ${attribute.name} gained ${deltaXp} XP: ${reason}`);
    
    // Check if any goals were achieved
    await checkAttributeGoals(attributeId, newLevel, newXp);
  };
  
  const checkAttributeGoals = async (attributeId: string, currentLevel: number, currentXp: number) => {
    const goals = await heroTaskDB.attributeGoals
      .where('attributeId')
      .equals(attributeId)
      .and(goal => goal.isActive)
      .toArray();
    
    for (const goal of goals) {
      if (currentLevel >= goal.targetLevel && currentXp >= goal.targetXp) {
        await heroTaskDB.attributeGoals.update(goal.id!, {
          isActive: false,
          updatedAt: new Date()
        });
        
        console.log(`🎯 Goal achieved for ${attributeId}: ${goal.description}`);
      }
    }
  };
  
  const createAttributeGoal = async (goalData: Omit<AttributeGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    
    await heroTaskDB.attributeGoals.add({
      ...goalData,
      createdAt: now,
      updatedAt: now
    });
  };
  
  const updateAttributeGoal = async (id: number, updates: Partial<AttributeGoal>) => {
    await heroTaskDB.attributeGoals.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  };
  
  // Get attribute by ID
  const getAttribute = (attributeId: string) => 
    attributes?.find(attr => attr.id === attributeId);
  
  // Get recent history for an attribute
  const getAttributeHistory = (attributeId: string, limit: number = 10) =>
    useLiveQuery(() =>
      heroTaskDB.attributeHistory
        .where('attributeId')
        .equals(attributeId)
        .reverse()
        .limit(limit)
        .toArray()
    );
  
  // Calculate total XP across all attributes
  const getTotalXp = () => {
    return attributes?.reduce((total, attr) => total + attr.xp, 0) || 0;
  };
  
  // Get attribute distribution by area
  const getAttributesByArea = () => {
    if (!attributes) return { mental: [], skill: [], discipline: [] };
    
    return attributes.reduce((acc, attr) => {
      acc[attr.area].push(attr);
      return acc;
    }, { mental: [], skill: [], discipline: [] } as Record<string, HeroAttribute[]>);
  };
  
  return {
    attributes: attributes || [],
    attributeHistory: attributeHistory || [],
    activeGoals: activeGoals || [],
    addAttributeXp,
    createAttributeGoal,
    updateAttributeGoal,
    getAttribute,
    getAttributeHistory,
    getTotalXp,
    getAttributesByArea,
    isLoading: attributes === undefined
  };
}