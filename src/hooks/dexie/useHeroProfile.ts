import { useLiveQuery } from 'dexie-react-hooks';
import { heroTaskDB } from '@/db/dexie/database';
import { HeroProfile } from '@/types/dexie/heroProfile';

export function useHeroProfile() {
  // Get the hero profile (singleton - ID should be 1)
  const heroProfile = useLiveQuery(() => heroTaskDB.heroProfile.get(1));
  
  const updateHeroProfile = async (updates: Partial<HeroProfile>) => {
    if (!heroProfile) return;
    
    await heroTaskDB.heroProfile.update(1, {
      ...updates,
      updatedAt: new Date()
    });
  };
  
  const addXp = async (amount: number, reason?: string) => {
    if (!heroProfile) return;
    
    const newTotalXp = heroProfile.totalXp + amount;
    let newLevel = heroProfile.level;
    let newXpForNextLevel = heroProfile.xpForNextLevel;
    
    // Level up calculation (simple: 100 XP per level with increasing requirements)
    while (newTotalXp >= (newLevel * 100)) {
      newLevel++;
      newXpForNextLevel = newLevel * 100;
    }
    
    await updateHeroProfile({
      totalXp: newTotalXp,
      level: newLevel,
      xpForNextLevel: newXpForNextLevel
    });
    
    // Log XP gain if reason provided
    if (reason) {
      console.log(`🎯 Hero gained ${amount} XP: ${reason}`);
    }
  };
  
  const resetProfile = async () => {
    await heroTaskDB.heroProfile.update(1, {
      totalXp: 0,
      level: 1,
      xpForNextLevel: 100,
      updatedAt: new Date()
    });
  };
  
  return {
    heroProfile,
    updateHeroProfile,
    addXp,
    resetProfile,
    isLoading: heroProfile === undefined
  };
}