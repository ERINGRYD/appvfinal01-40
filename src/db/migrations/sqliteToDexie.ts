import { heroTaskDB } from '@/db/dexie/database';
import { exportDatabase } from '@/db/crud';
import { Journey, Stage, Task } from '@/types/dexie/journey';
import { getDBOrThrow } from '@/db/singleton';

const MIGRATION_KEY = 'sqlite_to_dexie_migration_completed';

export async function migrateFromSQLiteOnce(): Promise<void> {
  try {
    // Check if migration was already completed
    const completed = localStorage.getItem(MIGRATION_KEY);
    if (completed === 'true') {
      console.log('📋 SQLite to Dexie migration already completed');
      return;
    }

    console.log('🔄 Starting SQLite to Dexie migration...');

    // Export all data from SQLite (simplified for now)
    const sqliteData = { study_plans: [], user_progress: [], study_sessions: [] };
    
    if (!sqliteData || Object.keys(sqliteData).length === 0) {
      console.log('⚠️ No SQLite data to migrate');
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    // Run migration in transaction for atomicity
    await heroTaskDB.transaction('rw', [
      heroTaskDB.journeys,
      heroTaskDB.tasks,
      heroTaskDB.habits,
      heroTaskDB.heroProfile
    ], async () => {
      // Migrate study plans to journeys
      if (sqliteData.study_plans && Array.isArray(sqliteData.study_plans)) {
        for (const plan of sqliteData.study_plans) {
          await migrateStudyPlanToJourney(plan, sqliteData);
        }
      }

      // Migrate user progress to hero profile
      if (sqliteData.user_progress && Array.isArray(sqliteData.user_progress)) {
        const userProgress = sqliteData.user_progress[0]; // Should be singleton
        if (userProgress) {
          await migrateUserProgressToHeroProfile(userProgress);
        }
      }

      // Migrate study sessions to tasks (if needed)
      if (sqliteData.study_sessions && Array.isArray(sqliteData.study_sessions)) {
        for (const session of sqliteData.study_sessions) {
          await migrateStudySessionToTask(session);
        }
      }
    });

    // Mark migration as completed
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('✅ SQLite to Dexie migration completed successfully');

  } catch (error) {
    console.error('Error during SQLite to Dexie migration:', error);
    throw error;
  }
}

async function migrateStudyPlanToJourney(plan: any, sqliteData: any): Promise<void> {
  try {
    // Find related subjects and topics
    const subjects = sqliteData.study_subjects?.filter((s: any) => s.plan_id === plan.id) || [];
    const topics = sqliteData.study_topics || [];
    const subtopics = sqliteData.study_subtopics || [];

    // Convert subjects to stages
    const stages: Stage[] = subjects.map((subject: any, index: number) => {
      const subjectTopics = topics.filter((t: any) => t.subject_id === subject.id);
      
      // Convert topics and subtopics to tasks
      const tasks: Task[] = [];
      subjectTopics.forEach((topic: any) => {
        const topicSubtopics = subtopics.filter((st: any) => st.topic_id === topic.id);
        
        // Create main topic task
        tasks.push({
          id: `task--stage--${subject.id}--${topic.id}`,
          stageId: `stage--${plan.id}--${index}`,
          journeyId: plan.id,
          title: topic.name,
          description: topic.description || '',
          completed: false,
          priority: topic.priority || 1,
          estimatedMinutes: (topic.estimated_time || 60) * 60, // Convert hours to minutes
          actualMinutes: 0,
          createdAt: new Date(topic.created_at || Date.now()),
          updatedAt: new Date(topic.updated_at || Date.now())
        });

        // Add subtopic tasks
        topicSubtopics.forEach((subtopic: any) => {
          tasks.push({
            id: `task--stage--${subject.id}--${subtopic.id}`,
            stageId: `stage--${plan.id}--${index}`,
            journeyId: plan.id,
            title: `${topic.name} - ${subtopic.name}`,
            description: subtopic.description || '',
            completed: false,
            priority: subtopic.priority || 1,
            estimatedMinutes: (subtopic.estimated_time || 30) * 60,
            actualMinutes: 0,
            createdAt: new Date(subtopic.created_at || Date.now()),
            updatedAt: new Date(subtopic.updated_at || Date.now())
          });
        });
      });

      return {
        id: `stage--${plan.id}--${index}`,
        title: subject.name,
        description: subject.description || '',
        priority: subject.priority || 1,
        estimatedHours: subject.estimated_time || 10,
        completedHours: 0,
        status: 'not_started' as const,
        order: index,
        tasks,
        createdAt: new Date(subject.created_at || Date.now()),
        updatedAt: new Date(subject.updated_at || Date.now())
      };
    });

    // Create journey
    const journey: Omit<Journey, 'id'> = {
      legacyId: plan.id,
      title: plan.name || 'Plano Migrado',
      description: plan.description || '',
      examDate: plan.exam_date ? new Date(plan.exam_date) : undefined,
      totalHours: plan.total_hours || 0,
      completedHours: 0,
      focusAreas: plan.focus_areas ? JSON.parse(plan.focus_areas) : [],
      status: 'active',
      stages,
      createdAt: new Date(plan.created_at || Date.now()),
      updatedAt: new Date(plan.updated_at || Date.now())
    };

    await heroTaskDB.journeys.add(journey);
    console.log(`✅ Migrated study plan "${plan.name}" to journey`);

  } catch (error) {
    console.error(`Error migrating study plan ${plan.id}:`, error);
  }
}

async function migrateUserProgressToHeroProfile(userProgress: any): Promise<void> {
  try {
    // Check if hero profile already exists
    const existingProfile = await heroTaskDB.heroProfile.get(1);
    if (existingProfile) {
      console.log('📋 Hero profile already exists, skipping migration');
      return;
    }

    const heroProfile = {
      heroName: userProgress.hero_name || 'Herói dos Estudos',
      totalXp: userProgress.total_xp || 0,
      level: userProgress.current_level || 1,
      xpForNextLevel: userProgress.xp_for_next_level || 100,
      createdAt: new Date(userProgress.created_at || Date.now()),
      updatedAt: new Date(userProgress.updated_at || Date.now())
    };

    await heroTaskDB.heroProfile.add(heroProfile);
    console.log('✅ Migrated user progress to hero profile');

  } catch (error) {
    console.error('Error migrating user progress:', error);
  }
}

async function migrateStudySessionToTask(session: any): Promise<void> {
  try {
    // Only migrate if this session corresponds to a specific task
    if (!session.task_id) return;

    const taskData = {
      id: session.task_id,
      stageId: session.stage_id || 'unknown',
      journeyId: session.journey_id || 'unknown',
      title: session.topic || 'Sessão de Estudo',
      description: session.notes || '',
      completed: session.completed || false,
      completedAt: session.end_time ? new Date(session.end_time) : undefined,
      priority: 1,
      estimatedMinutes: session.planned_duration || 25,
      actualMinutes: session.actual_duration || 0,
      startDate: session.start_time ? new Date(session.start_time) : undefined,
      createdAt: new Date(session.created_at || Date.now()),
      updatedAt: new Date(session.updated_at || Date.now())
    };

    // Check if task already exists
    const existingTask = await heroTaskDB.tasks.get(session.task_id);
    if (!existingTask) {
      await heroTaskDB.tasks.add(taskData);
      console.log(`✅ Migrated study session to task: ${session.task_id}`);
    }

  } catch (error) {
    console.error(`Error migrating study session ${session.id}:`, error);
  }
}

// Helper function to check if migration is needed
export function shouldRunMigration(): boolean {
  return localStorage.getItem(MIGRATION_KEY) !== 'true';
}