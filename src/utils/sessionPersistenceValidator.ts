// Session persistence validation and recovery utilities
import { StudySession } from '@/types/study';
import { saveStudySession, loadStudySessions } from '@/db/db';

export interface PersistenceReport {
  totalSessions: number;
  backupSessions: number;
  corruptedSessions: number;
  lastSyncTime: string | null;
}

// ADDED: Comprehensive validation of session persistence
export const validateSessionPersistence = (): PersistenceReport => {
  try {
    console.log('🔍 Starting session persistence validation...');
    
    // Check main database
    const dbSessions = loadStudySessions();
    console.log(`📊 Found ${dbSessions.length} sessions in database`);
    
    // Check backup storage
    const backupData = localStorage.getItem('backup_study_sessions');
    const backupSessions = backupData ? JSON.parse(backupData) : [];
    console.log(`💼 Found ${backupSessions.length} sessions in backup`);
    
    // Check for corrupted sessions
    let corruptedCount = 0;
    dbSessions.forEach((session, index) => {
      if (!session.id || !session.startTime) {
        console.warn(`⚠️ Corrupted session at index ${index}:`, session);
        corruptedCount++;
      }
    });
    
    // Check last sync time
    const lastSync = localStorage.getItem('last_session_sync');
    
    const report: PersistenceReport = {
      totalSessions: dbSessions.length,
      backupSessions: backupSessions.length,
      corruptedSessions: corruptedCount,
      lastSyncTime: lastSync
    };
    
    console.log('📋 Persistence validation report:', report);
    return report;
    
  } catch (error) {
    console.error('❌ Error during persistence validation:', error);
    return {
      totalSessions: 0,
      backupSessions: 0,
      corruptedSessions: 0,
      lastSyncTime: null
    };
  }
};

// ADDED: Force sync all backup sessions to main database
export const forceSyncBackupSessions = async (): Promise<boolean> => {
  try {
    console.log('🔄 Starting forced backup sync...');
    
    const backupData = localStorage.getItem('backup_study_sessions');
    if (!backupData) {
      console.log('✅ No backup sessions to sync');
      return true;
    }
    
    const backupSessions: StudySession[] = JSON.parse(backupData);
    let successCount = 0;
    
    for (const session of backupSessions) {
      try {
        // Ensure session has required fields
        if (session.id && session.startTime) {
          saveStudySession(session);
          successCount++;
          console.log(`✅ Synced session: ${session.id}`);
        } else {
          console.warn(`⚠️ Skipping invalid session:`, session);
        }
      } catch (error) {
        console.error(`❌ Failed to sync session ${session.id}:`, error);
      }
    }
    
    // Clear backup after successful sync
    if (successCount > 0) {
      localStorage.removeItem('backup_study_sessions');
      localStorage.setItem('last_session_sync', new Date().toISOString());
      console.log(`✅ Successfully synced ${successCount}/${backupSessions.length} sessions`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error during forced sync:', error);
    return false;
  }
};

// ADDED: Clean up corrupted or duplicate sessions
export const cleanupSessions = (): number => {
  try {
    console.log('🧹 Starting session cleanup...');
    
    const allSessions = loadStudySessions();
    const seenIds = new Set<string>();
    let removedCount = 0;
    
    allSessions.forEach((session, index) => {
      // Check for duplicates or invalid sessions
      if (!session.id || !session.startTime || seenIds.has(session.id)) {
        console.log(`🗑️ Marking session for cleanup: ${session.id || 'no-id'}`);
        removedCount++;
      } else {
        seenIds.add(session.id);
      }
    });
    
    if (removedCount > 0) {
      console.log(`✅ Cleanup would remove ${removedCount} sessions`);
      // Note: Actual cleanup would require database delete operations
      // This is just detection for now
    }
    
    return removedCount;
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return 0;
  }
};

// Make functions available in dev console
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).validateSessionPersistence = validateSessionPersistence;
  (window as any).forceSyncBackupSessions = forceSyncBackupSessions;
  (window as any).cleanupSessions = cleanupSessions;
  console.log('🔧 Session validation functions available: validateSessionPersistence(), forceSyncBackupSessions(), cleanupSessions()');
}