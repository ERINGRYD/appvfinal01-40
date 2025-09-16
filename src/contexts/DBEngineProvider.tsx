import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeDexieDB } from '@/db/dexie/database';
import { migrateFromSQLiteOnce, shouldRunMigration } from '@/db/migrations/sqliteToDexie';
import { loadTypedSetting, saveTypedSetting } from '@/utils/sqlitePersistence';

type DBEngine = 'sqlite' | 'dexie';

interface DBEngineContextType {
  engine: DBEngine;
  isInitializing: boolean;
  isInitialized: boolean;
  setEngine: (engine: DBEngine) => void;
  forceReinitialize: () => Promise<void>;
}

const DBEngineContext = createContext<DBEngineContextType | undefined>(undefined);

export function useDBEngine(): DBEngineContextType {
  const context = useContext(DBEngineContext);
  if (!context) {
    throw new Error('useDBEngine must be used within a DBEngineProvider');
  }
  return context;
}

interface DBEngineProviderProps {
  children: React.ReactNode;
}

export function DBEngineProvider({ children }: DBEngineProviderProps) {
  const [engine, setEngineState] = useState<DBEngine>('sqlite'); // Default to SQLite for stability
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeDBEngine = async (selectedEngine: DBEngine) => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    console.log(`🔧 Initializing ${selectedEngine} database engine...`);

    try {
      if (selectedEngine === 'dexie') {
        // Initialize Dexie database
        await initializeDexieDB();
        
        // Run SQLite to Dexie migration if needed
        if (shouldRunMigration()) {
          console.log('📦 Running one-time SQLite to Dexie migration...');
          await migrateFromSQLiteOnce();
        }
      }
      
      setIsInitialized(true);
      console.log(`✅ ${selectedEngine} database engine initialized successfully`);

    } catch (error) {
      console.error(`Error initializing ${selectedEngine} database engine:`, error);
      
      // Fallback to SQLite on error
      if (selectedEngine === 'dexie') {
        console.log('⚠️ Falling back to SQLite due to Dexie initialization error');
        setEngineState('sqlite');
        saveTypedSetting('db_engine', 'sqlite', 'general', 'Database engine preference');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const setEngine = (newEngine: DBEngine) => {
    setEngineState(newEngine);
    saveTypedSetting('db_engine', newEngine, 'general', 'Database engine preference');
    
    // Re-initialize if switching to Dexie
    if (newEngine === 'dexie') {
      initializeDBEngine(newEngine);
    }
  };

  const forceReinitialize = async () => {
    setIsInitialized(false);
    await initializeDBEngine(engine);
  };

  // Load engine preference on mount
  useEffect(() => {
    try {
      const savedEngine = loadTypedSetting('db_engine', 'general') as DBEngine;
      if (savedEngine && (savedEngine === 'sqlite' || savedEngine === 'dexie')) {
        setEngineState(savedEngine);
        
        // Initialize Dexie if it's the preferred engine
        if (savedEngine === 'dexie') {
          initializeDBEngine(savedEngine);
        } else {
          setIsInitialized(true); // SQLite is always ready via DBProvider
        }
      } else {
        // Default to SQLite
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error loading DB engine preference:', error);
      setIsInitialized(true); // Default to SQLite
    }
  }, []);

  const contextValue: DBEngineContextType = {
    engine,
    isInitializing,
    isInitialized,
    setEngine,
    forceReinitialize
  };

  return (
    <DBEngineContext.Provider value={contextValue}>
      {children}
    </DBEngineContext.Provider>
  );
}