
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { StudySubject, StudySession, StudyPlan, ExamType } from '@/types/study';
import { loadActiveStudyPlan, saveActiveStudyPlan } from '@/utils/sqlitePersistence';
import { migrateFromLocalStorage } from '@/db/migration';
import { useDB } from '@/contexts/DBProvider';
import { loadStudySessions, saveStudySession } from '@/db/db';

// Debug imports for development
if (import.meta.env.DEV) {
  import('@/debug-context-data');
  import('@/test-data-integrity');
}

interface StudyContextType {
  studySessions: StudySession[];
  setStudySessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  subjects: StudySubject[];
  setSubjects: React.Dispatch<React.SetStateAction<StudySubject[]>>;
  studyPlan: StudyPlan | null;
  setStudyPlan: React.Dispatch<React.SetStateAction<StudyPlan | null>>;
  examDate?: Date;
  setExamDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  selectedExam: string;
  setSelectedExam: React.Dispatch<React.SetStateAction<string>>;
  examTypes: ExamType[];
  isDBLoading: boolean;
  dbError: string | null;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const useStudyContext = () => {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudyContext must be used within a StudyProvider');
  }
  return context;
};

interface StudyProviderProps {
  children: ReactNode;
}

export const StudyProvider: React.FC<StudyProviderProps> = ({ children }) => {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [examDate, setExamDate] = useState<Date | undefined>();
  const [selectedExam, setSelectedExam] = useState('');

  // Use the global database context with error handling
  const dbContext = useDB();
  const { db, isLoading: isDBLoading, error: dbError } = dbContext || { 
    db: null, 
    isLoading: true, 
    error: null 
  };
  
  const isInitialized = !!db && !isDBLoading;

  // Initialize app data after database is ready
  useEffect(() => {
    const initializeApp = async () => {
      if (!isInitialized) return;

      try {
        await migrateFromLocalStorage();
        console.log('🏗️ Initializing StudyContext...');
        
        const savedPlan = loadActiveStudyPlan();
        if (savedPlan) {
          const planWithDefaults = savedPlan.cycleStart
            ? savedPlan
            : { ...savedPlan, cycleStart: new Date() };
          
          console.log(`📋 Loaded study plan with ${savedPlan.subjects?.length || 0} subjects`);
          setStudyPlan(planWithDefaults);
          
          // CRITICAL FIX: Populate subjects from studyPlan
          if (planWithDefaults.subjects && planWithDefaults.subjects.length > 0) {
            console.log('🔄 Populating subjects from study plan:', planWithDefaults.subjects.map(s => s.name));
            setSubjects(planWithDefaults.subjects);
          }
          
          if (planWithDefaults.examDate) {
            setExamDate(new Date(planWithDefaults.examDate));
          }
        } else {
          console.log('⚠️ No active study plan found');
        }

        // Load existing study sessions from database
        const savedSessions = loadStudySessions();
        console.log(`📊 Loaded ${savedSessions.length} study sessions`);
        setStudySessions(savedSessions);
      } catch (error) {
        console.error('❌ Error initializing app:', error);
      }
    };

    initializeApp();
  }, [isInitialized]);

  // CRITICAL FIX: Sync subjects when studyPlan changes
  useEffect(() => {
    if (studyPlan && studyPlan.subjects && isInitialized) {
      console.log('🔄 StudyPlan changed, syncing subjects:', studyPlan.subjects.map(s => s.name));
      setSubjects(studyPlan.subjects);
    }
  }, [studyPlan?.subjects, isInitialized]);

  // CRITICAL FIX: Update studyPlan.subjects when subjects change
  useEffect(() => {
    if (studyPlan && subjects.length > 0 && isInitialized) {
      console.log('🔄 Subjects changed, updating studyPlan');
      const updatedPlan = { ...studyPlan, subjects };
      setStudyPlan(updatedPlan);
    }
  }, [subjects, isInitialized]);

  // Auto-save study plan when it changes (only if database is ready)
  useEffect(() => {
    if (studyPlan && isInitialized) {
      console.log('💾 Auto-saving study plan with', studyPlan.subjects?.length || 0, 'subjects');
      saveActiveStudyPlan(studyPlan);
    }
  }, [studyPlan, isInitialized]);

  // IMPROVED: More robust session saving with better error handling
  useEffect(() => {
    if (studySessions.length > 0 && isInitialized) {
      // Save the most recent session (the one just added)
      const latestSession = studySessions[studySessions.length - 1];
      if (latestSession && latestSession.id) {
        try {
          console.log('💾 Saving study session:', {
            id: latestSession.id,
            subject: latestSession.subject,
            topic: latestSession.topic,
            duration: latestSession.duration
          });
          saveStudySession(latestSession);
          console.log('✅ Study session saved successfully');
        } catch (error) {
          console.error('❌ Error saving study session:', error);
          // Backup to localStorage as emergency fallback
          try {
            const backupSessions = JSON.parse(localStorage.getItem('backup_study_sessions') || '[]');
            backupSessions.push(latestSession);
            localStorage.setItem('backup_study_sessions', JSON.stringify(backupSessions));
            console.log('💼 Session saved to localStorage backup');
          } catch (backupError) {
            console.error('❌ Failed to save to backup:', backupError);
          }
        }
      }
    }
   }, [studySessions, isInitialized]);

  // ADDED: Recovery mechanism for corrupted study plan data
  useEffect(() => {
    if (isInitialized && (!studyPlan || !subjects || subjects.length === 0)) {
      console.log('🔄 Attempting to recover study plan and subjects...');
      
      // Try to recover from localStorage backup
      try {
        const backupPlan = localStorage.getItem('backup_study_plan');
        const backupSubjects = localStorage.getItem('backup_subjects');
        
        if (backupPlan) {
          const recoveredPlan = JSON.parse(backupPlan);
          console.log('📋 Recovered study plan from backup:', recoveredPlan);
          setStudyPlan(recoveredPlan);
          
          if (recoveredPlan.subjects && recoveredPlan.subjects.length > 0) {
            setSubjects(recoveredPlan.subjects);
            console.log('✅ Subjects recovered from plan:', recoveredPlan.subjects.length);
          }
        } else if (backupSubjects) {
          const recoveredSubjects = JSON.parse(backupSubjects);
          console.log('📋 Recovered subjects from backup:', recoveredSubjects.length);
          setSubjects(recoveredSubjects);
        }
      } catch (error) {
        console.error('❌ Error during recovery:', error);
      }
    }
  }, [isInitialized, studyPlan, subjects]);

  // ADDED: Backup mechanism for study plan and subjects
  useEffect(() => {
    if (studyPlan && isInitialized) {
      localStorage.setItem('backup_study_plan', JSON.stringify(studyPlan));
    }
  }, [studyPlan, isInitialized]);

  useEffect(() => {
    if (subjects && subjects.length > 0 && isInitialized) {
      localStorage.setItem('backup_subjects', JSON.stringify(subjects));
    }
  }, [subjects, isInitialized]);

  const examTypes: ExamType[] = [
    { 
      id: 'enem', 
      name: 'ENEM', 
      description: 'Exame Nacional do Ensino Médio',
      defaultSubjects: ['Matemática', 'Português', 'História', 'Geografia', 'Física', 'Química', 'Biologia', 'Literatura', 'Inglês/Espanhol', 'Redação'],
      recommendedHours: 40,
      difficulty: 'medium'
    },
    { 
      id: 'concursos', 
      name: 'Concursos Públicos', 
      description: 'Concursos federais, estaduais e municipais',
      defaultSubjects: ['Português', 'Matemática', 'Raciocínio Lógico', 'Informática', 'Direito Constitucional', 'Direito Administrativo', 'Conhecimentos Específicos'],
      recommendedHours: 50,
      difficulty: 'hard'
    },
    { 
      id: 'oab', 
      name: 'OAB', 
      description: 'Ordem dos Advogados do Brasil',
      defaultSubjects: ['Direito Constitucional', 'Direito Administrativo', 'Direito Civil', 'Direito Penal', 'Direito do Trabalho', 'Direito Tributário', 'Ética Profissional'],
      recommendedHours: 45,
      difficulty: 'hard'
    },
    { 
      id: 'vestibular', 
      name: 'Vestibular', 
      description: 'Vestibulares tradicionais',
      defaultSubjects: ['Matemática', 'Português', 'História', 'Geografia', 'Física', 'Química', 'Biologia', 'Literatura', 'Inglês'],
      recommendedHours: 35,
      difficulty: 'medium'
    },
    { 
      id: 'militar', 
      name: 'Concursos Militares', 
      description: 'ESA, EsPCEx, IME, ITA, AFA',
      defaultSubjects: ['Matemática', 'Português', 'Física', 'Química', 'História', 'Geografia', 'Inglês'],
      recommendedHours: 50,
      difficulty: 'hard'
    },
    { 
      id: 'medicina', 
      name: 'Medicina', 
      description: 'FUVEST, UNICAMP, outros vestibulares de medicina',
      defaultSubjects: ['Matemática', 'Português', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Inglês', 'Literatura'],
      recommendedHours: 55,
      difficulty: 'hard'
    },
    { 
      id: 'custom', 
      name: 'Personalizado', 
      description: 'Crie seu próprio conjunto de matérias'
    }
  ];

  const value: StudyContextType = {
    studySessions,
    setStudySessions,
    subjects,
    setSubjects,
    studyPlan,
    setStudyPlan,
    examDate,
    setExamDate,
    selectedExam,
    setSelectedExam,
    examTypes,
    isDBLoading,
    dbError
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
};
