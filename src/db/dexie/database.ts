import Dexie, { Table } from 'dexie';
import { DEXIE_SCHEMA } from './schema';
import { Journey, Task, Habit, HabitCompletion } from '@/types/dexie/journey';
import { HeroProfile, HeroAttribute, AttributeHistory, AttributeGoal } from '@/types/dexie/heroProfile';
import { runPostInitMigrations as runPostInitMigrationsFn } from './migrations/postInit';

// Base attributes for initialization
export const BASE_ATTRIBUTES: Omit<HeroAttribute, 'updatedAt'>[] = [
  {
    id: 'knowledge',
    name: 'Conhecimento',
    level: 1,
    xp: 0,
    xpForNextLevel: 100,
    area: 'mental',
    description: 'Representa o quanto você absorveu de conhecimento através dos estudos',
    icon: '🧠',
    meta: {}
  },
  {
    id: 'focus',
    name: 'Foco',
    level: 1,
    xp: 0,
    xpForNextLevel: 100,
    area: 'mental',
    description: 'Sua capacidade de manter concentração durante os estudos',
    icon: '🎯',
    meta: {}
  },
  {
    id: 'consistency',
    name: 'Consistência',
    level: 1,
    xp: 0,
    xpForNextLevel: 100,
    area: 'discipline',
    description: 'Quão regular você tem sido nos seus estudos',
    icon: '📈',
    meta: {}
  },
  {
    id: 'speed',
    name: 'Velocidade',
    level: 1,
    xp: 0,
    xpForNextLevel: 100,
    area: 'skill',
    description: 'Quão rápido você consegue processar e compreender informações',
    icon: '⚡',
    meta: {}
  }
];

export class HeroTaskDatabase extends Dexie {
  heroProfile!: Table<HeroProfile>;
  journeys!: Table<Journey>;
  tasks!: Table<Task>;
  habits!: Table<Habit>;
  habitCompletions!: Table<HabitCompletion>;
  heroAttributes!: Table<HeroAttribute>;
  attributeHistory!: Table<AttributeHistory>;
  attributeGoals!: Table<AttributeGoal>;

  constructor() {
    super('HeroTaskDatabase');
    
    // Version 2: Initial schema with all stores
    this.version(2).stores(DEXIE_SCHEMA);
  }
}

// Global instance
export const heroTaskDB = new HeroTaskDatabase();

// Initialize default data
export async function initializeDefaultProfile(): Promise<void> {
  try {
    const existingProfile = await heroTaskDB.heroProfile.get(1);
    if (!existingProfile) {
      await heroTaskDB.heroProfile.add({
        heroName: 'Herói dos Estudos',
        totalXp: 0,
        level: 1,
        xpForNextLevel: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Default hero profile created');
    }
  } catch (error) {
    console.error('Error initializing default profile:', error);
  }
}

export async function initializeHeroAttributes(): Promise<void> {
  try {
    const existingCount = await heroTaskDB.heroAttributes.count();
    if (existingCount === 0) {
      const attributesWithDate = BASE_ATTRIBUTES.map(attr => ({
        ...attr,
        updatedAt: new Date()
      }));
      
      await heroTaskDB.heroAttributes.bulkAdd(attributesWithDate);
      console.log('✅ Default hero attributes created');
    }
  } catch (error) {
    console.error('Error initializing hero attributes:', error);
  }
}

// Run post-initialization migrations
export async function runPostInitMigrations(): Promise<void> {
  const MIGRATIONS_KEY = 'dexie_post_init_migrations_completed';
  
  try {
    const completed = localStorage.getItem(MIGRATIONS_KEY);
    if (completed === 'true') {
      console.log('📋 Post-init migrations already completed');
      return;
    }

    console.log('🔧 Running post-initialization migrations...');
    await runPostInitMigrationsFn();
    
    localStorage.setItem(MIGRATIONS_KEY, 'true');
    console.log('✅ Post-init migrations completed');
  } catch (error) {
    console.error('Error running post-init migrations:', error);
  }
}

// Initialize database
export async function initializeDexieDB(): Promise<void> {
  try {
    await heroTaskDB.open();
    console.log('✅ Dexie database opened successfully');
    
    await initializeDefaultProfile();
    await initializeHeroAttributes();
    await runPostInitMigrationsFn();
    
    console.log('🎯 Dexie database fully initialized');
  } catch (error) {
    console.error('Error initializing Dexie database:', error);
    throw error;
  }
}