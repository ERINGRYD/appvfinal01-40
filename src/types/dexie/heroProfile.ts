export interface HeroProfile {
  id?: number; // Should be 1 (singleton)
  heroName: string;
  totalXp: number;
  level: number;
  xpForNextLevel: number;
  title?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HeroAttribute {
  id: string; // 'knowledge' | 'focus' | 'consistency' | 'speed'
  name: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
  area: 'mental' | 'skill' | 'discipline';
  description: string;
  icon: string;
  meta: Record<string, any>;
  updatedAt: Date;
}

export interface AttributeHistory {
  id?: number;
  attributeId: string;
  deltaXp: number;
  reason: string;
  sessionId?: string;
  taskId?: string;
  at: Date;
}

export interface AttributeGoal {
  id?: number;
  attributeId: string;
  targetLevel: number;
  targetXp: number;
  currentXp: number;
  description: string;
  dueDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}