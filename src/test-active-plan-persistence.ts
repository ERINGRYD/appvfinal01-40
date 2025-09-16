// Test script to verify active plan persistence is working correctly
import { StudyPlan } from '@/types/study';
import { 
  saveActiveStudyPlan, 
  loadActiveStudyPlan, 
  saveStudyPlan,
  getSavedPlans 
} from '@/utils/sqlitePersistence';
import { loadTypedSetting } from '@/db/crud/appSettings';

export const testActivePlanPersistence = (): void => {
  console.log('🧪 Testing Active Plan Persistence...');
  
  // Test data
  const testPlan: StudyPlan = {
    id: undefined, // Will be auto-generated
    type: 'cycle',
    subjects: [
      {
        id: 'math-001',
        name: 'Matemática',
        topics: [
          {
            id: 'topic-001',
            name: 'Álgebra',
            subjectId: 'math-001',
            weight: 1.0,
            completed: false,
            totalTime: 0
          }
        ],
        weight: 1.0,
        priority: 1,
        totalTime: 0,
        customSubject: false
      }
    ],
    totalHours: 40,
    focusAreas: ['Matemática'],
    cycle: [],
    weekly: []
  };

  try {
    // Test 1: Save active plan without explicit ID (should get stable ID)
    console.log('📝 Test 1: Saving active plan without ID...');
    saveActiveStudyPlan(testPlan);
    
    // Test 2: Load active plan (should work)
    console.log('📖 Test 2: Loading active plan...');
    const loadedPlan = loadActiveStudyPlan();
    console.log('Loaded plan:', loadedPlan ? `ID: ${loadedPlan.id}` : 'null');
    
    // Test 3: Check app_settings for active_plan_id
    console.log('⚙️ Test 3: Checking app_settings...');
    const activePlanIdSetting = loadTypedSetting('active_plan_id', 'general');
    console.log('Active plan ID setting:', activePlanIdSetting);
    
    // Test 4: Check saved_plans for active entry
    console.log('📋 Test 4: Checking saved_plans...');
    const savedPlans = getSavedPlans();
    const activeSavedPlan = savedPlans.find(p => p.isActive);
    console.log('Active saved plan:', activeSavedPlan ? `${activeSavedPlan.name} (${activeSavedPlan.id})` : 'none');
    
    // Test 5: Save named plan and verify consistency
    if (loadedPlan) {
      console.log('💾 Test 5: Saving named plan...');
      const namedPlanId = saveStudyPlan(loadedPlan, 'Plano de Teste');
      console.log('Named plan saved with ID:', namedPlanId);
      
      // Check if active_plan_id was updated
      const updatedActivePlanId = loadTypedSetting('active_plan_id', 'general');
      console.log('Updated active plan ID:', updatedActivePlanId);
      console.log('IDs match:', namedPlanId === updatedActivePlanId ? '✅' : '❌');
    }
    
    // Test 6: Simulate page reload - load again
    console.log('🔄 Test 6: Simulating reload - loading active plan again...');
    const reloadedPlan = loadActiveStudyPlan();
    console.log('Reloaded plan:', reloadedPlan ? `ID: ${reloadedPlan.id}` : 'null');
    
    if (loadedPlan && reloadedPlan) {
      console.log('Plans match:', loadedPlan.id === reloadedPlan.id ? '✅' : '❌');
    }
    
    console.log('✅ Active plan persistence test completed!');
    
  } catch (error) {
    console.error('❌ Error in active plan persistence test:', error);
  }
};

// Auto-run test in development
if (import.meta.env.DEV) {
  // Wait a bit for DB to be ready, then run test
  setTimeout(() => {
    testActivePlanPersistence();
  }, 2000);
}