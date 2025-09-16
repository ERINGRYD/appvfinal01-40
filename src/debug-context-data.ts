// Debug utility to inspect StudyContext data in real-time
// This can be called from browser console to verify data is loading correctly

export const debugStudyContext = (): void => {
  console.log('🔍 === STUDY CONTEXT DEBUG ===');
  
  // Check if we can access the React context
  try {
    // This would normally be accessed within a React component
    // For now, we'll check localStorage and DB directly
    
    console.log('📊 Checking localStorage backup data...');
    const backupSessions = localStorage.getItem('backup_study_sessions');
    if (backupSessions) {
      const parsed = JSON.parse(backupSessions);
      console.log(`💼 Found ${parsed.length} backup sessions:`, parsed);
    } else {
      console.log('💼 No backup sessions found');
    }
    
    console.log('🏗️ Context integration tips:');
    console.log('1. Check if subjects array is populated from studyPlan');
    console.log('2. Verify studyPlan.subjects is not empty');
    console.log('3. Confirm database is initialized before loading');
    console.log('4. Look for sync between subjects state and studyPlan.subjects');
    
    // Instructions for manual testing
    console.log('🧪 Manual Testing Steps:');
    console.log('1. Go to Planner tab and create a study plan');
    console.log('2. Add subjects and topics to the plan');
    console.log('3. Go to Session tab and check if subjects appear');
    console.log('4. Try starting a study session');
    console.log('5. Check console for subject/topic data logs');
    
  } catch (error) {
    console.error('❌ Error in debug function:', error);
  }
  
  console.log('✅ Debug check completed');
};

// Auto-run in development
if (import.meta.env.DEV) {
  (window as any).debugStudyContext = debugStudyContext;
  console.log('🔧 Debug function available: window.debugStudyContext()');
}

export default debugStudyContext;