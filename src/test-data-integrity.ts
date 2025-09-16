// Data integrity verification and repair utility
import { StudyPlan } from '@/types/study';
import { 
  loadActiveStudyPlan, 
  saveActiveStudyPlan,
  loadStudySessionsData 
} from '@/utils/sqlitePersistence';

export const testDataIntegrity = (): void => {
  console.log('🔍 === DATA INTEGRITY TEST ===');
  
  try {
    // Test 1: Load active study plan
    console.log('📋 Test 1: Loading active study plan...');
    const studyPlan = loadActiveStudyPlan();
    
    if (!studyPlan) {
      console.log('⚠️ No active study plan found - creating test plan');
      createTestStudyPlan();
      return;
    }
    
    console.log(`✅ Study plan loaded: ${studyPlan.id}`);
    console.log(`📚 Subjects count: ${studyPlan.subjects?.length || 0}`);
    
    if (studyPlan.subjects && studyPlan.subjects.length > 0) {
      studyPlan.subjects.forEach((subject, index) => {
        console.log(`  ${index + 1}. ${subject.name} (${subject.topics?.length || 0} topics)`);
        if (subject.topics && subject.topics.length > 0) {
          subject.topics.forEach((topic, topicIndex) => {
            console.log(`     ${topicIndex + 1}. ${topic.name} (${topic.subtopics?.length || 0} subtopics)`);
          });
        }
      });
    } else {
      console.log('⚠️ Study plan has no subjects!');
    }
    
    // Test 2: Load study sessions
    console.log('📊 Test 2: Loading study sessions...');
    const sessions = loadStudySessionsData();
    console.log(`✅ Sessions loaded: ${sessions.length}`);
    
    if (sessions.length > 0) {
      console.log('Recent sessions:');
      sessions.slice(-5).forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.subject} - ${session.topic || 'No topic'} (${session.duration}min)`);
      });
    }
    
    // Test 3: Verify data consistency
    console.log('🔍 Test 3: Data consistency check...');
    if (studyPlan.subjects && studyPlan.subjects.length > 0) {
      console.log('✅ StudyPlan has subjects - context should populate correctly');
    } else {
      console.log('❌ StudyPlan missing subjects - this will cause empty selectors');
    }
    
  } catch (error) {
    console.error('❌ Error in data integrity test:', error);
  }
  
  console.log('✅ Data integrity test completed');
};

const createTestStudyPlan = (): void => {
  console.log('🔧 Creating test study plan...');
  
  const testPlan: StudyPlan = {
    id: 'test_plan_' + Date.now(),
    type: 'cycle',
    subjects: [
      {
        id: 'math_001',
        name: 'Matemática',
        topics: [
          {
            id: 'topic_algebra',
            name: 'Álgebra',
            subjectId: 'math_001',
            weight: 1.0,
            completed: false,
            totalTime: 0,
            subtopics: [
              {
                id: 'subtopic_equations',
                name: 'Equações do 1º Grau',
                topicId: 'topic_algebra',
                weight: 1.0,
                completed: false,
                totalTime: 0
              }
            ]
          }
        ],
        weight: 1.0,
        priority: 1,
        totalTime: 0,
        customSubject: false
      },
      {
        id: 'port_001',
        name: 'Português',
        topics: [
          {
            id: 'topic_grammar',
            name: 'Gramática',
            subjectId: 'port_001',
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
    focusAreas: ['Matemática', 'Português'],
    cycle: [],
    weekly: []
  };
  
  try {
    saveActiveStudyPlan(testPlan);
    console.log('✅ Test study plan created successfully');
    console.log('🔄 Reload the page to see the new plan');
  } catch (error) {
    console.error('❌ Failed to create test study plan:', error);
  }
};

// Auto-run in development
if (import.meta.env.DEV) {
  (window as any).testDataIntegrity = testDataIntegrity;
  (window as any).createTestStudyPlan = createTestStudyPlan;
  console.log('🔧 Test functions available: window.testDataIntegrity(), window.createTestStudyPlan()');
}