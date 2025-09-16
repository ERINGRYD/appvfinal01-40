// Test script for session persistence validation
import { StudySession } from '@/types/study';
import { saveStudySession, loadStudySessions } from '@/db/db';
import { validateSessionPersistence, forceSyncBackupSessions } from '@/utils/sessionPersistenceValidator';

// Test session persistence robustness
export const testSessionPersistence = async (): Promise<void> => {
  console.log('🧪 Starting comprehensive session persistence test...');
  
  try {
    // Step 1: Validate current state
    console.log('📊 Step 1: Validating current state...');
    const report = validateSessionPersistence();
    console.log('Current state:', report);
    
    // Step 2: Create test session
    console.log('📝 Step 2: Creating test session...');
    const testSession: StudySession = {
      id: `test-session-${Date.now()}`,
      subject: 'Test Subject',
      topic: 'Test Topic',
      subtopic: 'Test Subtopic',
      startTime: new Date(),
      endTime: new Date(),
      duration: 25,
      completed: true,
      notes: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        studyType: 'teste',
        assunto: 'Test Subject / Test Topic',
        times: {
          netSeconds: 1500,
          pauseSeconds: 0,
          totalSeconds: 1500
        }
      })
    };
    
    // Step 3: Save session and verify
    console.log('💾 Step 3: Saving and verifying session...');
    saveStudySession(testSession);
    
    // Verify it was saved
    const allSessions = loadStudySessions();
    const foundSession = allSessions.find(s => s.id === testSession.id);
    
    if (foundSession) {
      console.log('✅ Test session saved successfully:', foundSession);
    } else {
      console.error('❌ Test session not found after save!');
    }
    
    // Step 4: Test backup mechanism
    console.log('💼 Step 4: Testing backup mechanism...');
    const backupSession: StudySession = {
      id: `backup-test-${Date.now()}`,
      subject: 'Backup Test',
      topic: 'Backup Topic', 
      startTime: new Date(),
      endTime: new Date(),
      duration: 30,
      completed: true,
      notes: JSON.stringify({ type: 'backup-test' })
    };
    
    // Add to backup storage
    const existingBackup = JSON.parse(localStorage.getItem('backup_study_sessions') || '[]');
    existingBackup.push(backupSession);
    localStorage.setItem('backup_study_sessions', JSON.stringify(existingBackup));
    
    // Test recovery
    await forceSyncBackupSessions();
    
    // Verify backup was synced
    const updatedSessions = loadStudySessions();
    const foundBackupSession = updatedSessions.find(s => s.id === backupSession.id);
    
    if (foundBackupSession) {
      console.log('✅ Backup session recovered successfully:', foundBackupSession);
    } else {
      console.error('❌ Backup session not recovered!');
    }
    
    // Step 5: Final validation
    console.log('🔍 Step 5: Final validation...');
    const finalReport = validateSessionPersistence();
    console.log('Final state:', finalReport);
    
    console.log('✅ Session persistence test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during session persistence test:', error);
  }
};

// Make test function available in dev console
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testSessionPersistence = testSessionPersistence;
  console.log('🔧 Test function available: window.testSessionPersistence()');
}