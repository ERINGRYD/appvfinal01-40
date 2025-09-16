import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, BookOpen } from 'lucide-react';
import StudyPlanner from '@/components/StudyPlanner';
import Dashboard from '@/components/Dashboard';
import { useStudyContext } from '@/contexts/StudyContext';
const IndexContent = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    studySessions,
    studyPlan,
    examDate,
    selectedExam
  } = useStudyContext();
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  return <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="planner" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Planner
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-0">
            <Dashboard studySessions={studySessions} subjects={[]} studyPlan={studyPlan} examDate={examDate} selectedExam={selectedExam} />
          </TabsContent>
          
          <TabsContent value="planner" className="mt-0">
            <StudyPlanner />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
const Index = () => {
  return <IndexContent />;
};
export default Index;