import React, { useState, useEffect } from 'react';
import { useDB } from '@/contexts/DBProvider';
import { toast } from '@/hooks/use-toast';
import ModeSelector from '@/components/coliseum/ModeSelector';
import BattleConfiguration from '@/components/coliseum/BattleConfiguration';
import ArenaInterface from '@/components/coliseum/ArenaInterface';
import VictoryReport from '@/components/coliseum/VictoryReport';
import { 
  ColiseumMode, 
  ColiseumSession, 
  ColiseumReport,
  ColiseumConfig
} from '@/types/coliseum';
import {
  loadColiseumQuestions,
  createColiseumSession,
  generateColiseumReport,
  validateColiseumConfig
} from '@/utils/coliseumEngine';
import { getEnemiesByRoom } from '@/db/crud/enemies';
import { updateUserProgress } from '@/db/crud/battle';

type ViewState = 'selection' | 'configuration' | 'battle' | 'report';

const ColiseumPage: React.FC = () => {
  const { isLoading } = useDB();
  const [viewState, setViewState] = useState<ViewState>('selection');
  const [selectedMode, setSelectedMode] = useState<ColiseumMode | null>(null);
  const [session, setSession] = useState<ColiseumSession | null>(null);
  const [report, setReport] = useState<ColiseumReport | null>(null);
  const [availableEnemies, setAvailableEnemies] = useState(0);
  const [redRoomEnemies, setRedRoomEnemies] = useState(0);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [totalQuestionsAvailable, setTotalQuestionsAvailable] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>();

  useEffect(() => {
    if (!isLoading) {
      loadEnemiesData();
    }
  }, [isLoading]);

  useEffect(() => {
    if (session && session.timeRemaining !== undefined && viewState === 'battle') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === undefined || prev <= 0) {
            clearInterval(timer);
            handleFinishBattle();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session, viewState]);

  const loadEnemiesData = async () => {
    try {
      const enemyStats = getEnemiesByRoom();
      const subjects = new Set<string>();
      let totalEnemies = 0;
      let totalQuestions = 0;

      // Process all rooms
      const allEnemies = [
        ...enemyStats.triagem,
        ...enemyStats.vermelha,
        ...enemyStats.amarela,
        ...enemyStats.verde
      ];

      allEnemies.forEach(enemy => {
        totalEnemies++;
        subjects.add(enemy.subjectName);
        totalQuestions += enemy.totalQuestions;
      });
      
      setAvailableEnemies(totalEnemies);
      setRedRoomEnemies(enemyStats.vermelha.length);
      setAvailableSubjects(Array.from(subjects));
      setTotalQuestionsAvailable(totalQuestions);
    } catch (error) {
      console.error('Error loading enemies data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados dos inimigos',
        variant: 'destructive'
      });
    }
  };

  const handleSelectMode = (mode: ColiseumMode) => {
    setSelectedMode(mode);
    setViewState('configuration');
  };

  const handleStartBattle = async (questionsCount: number, selectedSubjects: string[]) => {
    if (!selectedMode) return;

    try {
      const config: ColiseumConfig = {
        mode: selectedMode,
        questionsCount,
        selectedSubjects: selectedSubjects.length > 0 ? selectedSubjects : undefined
      };

      const validation = validateColiseumConfig(config, totalQuestionsAvailable);
      if (!validation.isValid) {
        toast({
          title: 'Configuração Inválida',
          description: validation.error,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Carregando batalha...',
        description: 'Preparando suas questões'
      });

      const questions = await loadColiseumQuestions(config);
      
      if (questions.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhuma questão disponível para esta configuração',
          variant: 'destructive'
        });
        return;
      }

      const newSession = createColiseumSession(config, questions);
      setSession(newSession);
      setTimeRemaining(newSession.timeRemaining);
      setViewState('battle');

      toast({
        title: 'Combate Iniciado!',
        description: `${questions.length} questões carregadas. Boa sorte, gladiador!`
      });
    } catch (error) {
      console.error('Error starting battle:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao iniciar combate',
        variant: 'destructive'
      });
    }
  };

  const handleAnswerQuestion = (questionId: string, answer: string) => {
    if (!session) return;

    const question = session.questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = answer === question.correctAnswer;
    const timeTaken = Math.floor((Date.now() - session.startTime.getTime()) / 1000);

    const updatedAnswers = new Map(session.answers);
    updatedAnswers.set(questionId, {
      selectedAnswer: answer,
      isCorrect,
      timeTaken,
      markedForReview: updatedAnswers.get(questionId)?.markedForReview || false
    });

    setSession({
      ...session,
      answers: updatedAnswers
    });

    toast({
      title: isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta',
      description: isCorrect ? 'Continue assim, gladiador!' : 'Não desista!',
      variant: isCorrect ? 'default' : 'destructive'
    });
  };

  const handleToggleReview = (questionId: string) => {
    if (!session) return;

    const updatedAnswers = new Map(session.answers);
    const current = updatedAnswers.get(questionId) || {
      selectedAnswer: '',
      isCorrect: false,
      timeTaken: 0,
      markedForReview: false
    };

    updatedAnswers.set(questionId, {
      ...current,
      markedForReview: !current.markedForReview
    });

    setSession({
      ...session,
      answers: updatedAnswers
    });
  };

  const handleNavigateQuestion = (index: number) => {
    if (!session) return;
    
    setSession({
      ...session,
      currentQuestionIndex: index
    });
  };

  const handleFinishBattle = () => {
    if (!session) return;

    const generatedReport = generateColiseumReport(session);
    
    // Update user progress
    updateUserProgress(
      generatedReport.xpEarned,
      generatedReport.correctAnswers,
      generatedReport.totalQuestions
    );

    setReport(generatedReport);
    setViewState('report');

    toast({
      title: 'Batalha Finalizada!',
      description: `Você conquistou ${generatedReport.xpEarned} XP!`,
    });
  };

  const handleBackToArena = () => {
    setViewState('selection');
    setSelectedMode(null);
    setSession(null);
    setReport(null);
    setTimeRemaining(undefined);
  };

  const handleBackToConfig = () => {
    setViewState('configuration');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 max-w-6xl">
        {viewState === 'selection' && (
          <ModeSelector
            onSelectMode={handleSelectMode}
            availableEnemiesCount={availableEnemies}
            redRoomEnemiesCount={redRoomEnemies}
          />
        )}

        {viewState === 'configuration' && selectedMode && (
          <BattleConfiguration
            mode={selectedMode}
            availableSubjects={availableSubjects}
            onStartBattle={handleStartBattle}
            onBack={handleBackToArena}
            totalQuestionsAvailable={totalQuestionsAvailable}
          />
        )}

        {viewState === 'battle' && session && (
          <ArenaInterface
            session={session}
            onAnswerQuestion={handleAnswerQuestion}
            onToggleReview={handleToggleReview}
            onNavigateQuestion={handleNavigateQuestion}
            onFinishBattle={handleFinishBattle}
            timeRemaining={timeRemaining}
          />
        )}

        {viewState === 'report' && report && (
          <VictoryReport
            report={report}
            onBackToArena={handleBackToArena}
          />
        )}
      </div>
    </div>
  );
};

export default ColiseumPage;
