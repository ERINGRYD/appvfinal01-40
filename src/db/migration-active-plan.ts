// Migration to ensure active plan persistence and repair orphaned data
import { Database } from 'sql.js';
import { saveTypedSetting, loadTypedSetting } from '@/db/crud/appSettings';

export const migrateActivePlanPersistence = (database: Database): void => {
  console.log('🔧 Starting active plan persistence migration...');
  
  try {
    // Check if we already have active_plan_id setting
    const existingActivePlanId = loadTypedSetting('active_plan_id', 'general');
    
    if (existingActivePlanId) {
      console.log(`✅ Active plan ID already exists: ${existingActivePlanId}`);
      return;
    }
    
    // Strategy 1: Try to find existing active plan in saved_plans
    const activeStmt = database.prepare('SELECT plan_id FROM saved_plans WHERE is_active = TRUE LIMIT 1');
    const activeResult = activeStmt.getAsObject();
    activeStmt.free();
    
    if (activeResult.plan_id) {
      const planId = activeResult.plan_id as string;
      console.log(`🔄 Found active plan in saved_plans: ${planId}`);
      saveTypedSetting('active_plan_id', planId, 'general', 'ID do plano ativo atual');
      return;
    }
    
    // Strategy 2: Use most recent study_plan as active
    const recentStmt = database.prepare('SELECT id FROM study_plans ORDER BY updated_at DESC LIMIT 1');
    const recentResult = recentStmt.getAsObject();  
    recentStmt.free();
    
    if (recentResult.id) {
      const planId = recentResult.id as string;
      console.log(`🔄 Using most recent plan as active: ${planId}`);
      
      // Set as active_plan_id
      saveTypedSetting('active_plan_id', planId, 'general', 'ID do plano ativo atual');
      
      // Create saved_plans entry if it doesn't exist
      const checkStmt = database.prepare('SELECT id FROM saved_plans WHERE plan_id = ?');
      const checkResult = checkStmt.getAsObject([planId]);
      checkStmt.free();
      
      if (!checkResult.id) {
        // Mark all existing plans as inactive
        database.run('UPDATE saved_plans SET is_active = FALSE');
        
        // Create new active saved plan entry
        database.run(`
          INSERT INTO saved_plans (id, name, plan_id, is_active, created_at, updated_at)
          VALUES (?, ?, ?, TRUE, datetime('now'), datetime('now'))
        `, [planId, 'Plano Atual', planId]);
        
        console.log(`✅ Created saved_plans entry for active plan: ${planId}`);
      }
    }
    
    // Optional: Clean up orphaned study_plans (keep only the active one and recent ones)
    if (recentResult.id) {
      const activePlanId = recentResult.id as string;
      
      // Keep active plan and 5 most recent plans, remove older ones
      const cleanupStmt = database.prepare(`
        DELETE FROM study_plans 
        WHERE id NOT IN (
          SELECT id FROM study_plans 
          ORDER BY updated_at DESC 
          LIMIT 6
        ) AND id != ?
      `);
      cleanupStmt.run([activePlanId]);
      cleanupStmt.free();
      
      console.log('🧹 Cleaned up old orphaned study plans');
    }
    
    console.log('✅ Active plan persistence migration completed');
    
  } catch (error) {
    console.error('❌ Error in active plan migration:', error);
  }
};
