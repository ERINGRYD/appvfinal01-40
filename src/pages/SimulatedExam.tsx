import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Timer, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useStudyContext } from '@/contexts/StudyContext';
import { getQuestionsByTopic, getQuestionsByRoom } from '@/db/crud/questions';
import { ExamSetup } from '@/components/exam/ExamSetup';
import { ExamQuestion } from '@/components/exam/ExamQuestion';
import { ExamResults } from '@/components/exam/ExamResults';
import type { Question } from '@/types/battle';
import type { Room } from '@/types/battle';

export interface ExamAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
}

export interface ExamConfig {
  type: 'topic' | 'room' | 'mixed';
  topicIds?: string[];
  room?: Room;
  questionCount: number;
  timeLimit?: number; // minutes
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export default function SimulatedExam() {
  const { subjects } = useStudyContext();
  const [examState, setExamState] = useState<'setup' | 'active' | 'results'>('setup');
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Timer effect
  useEffect(() => {
    if (examState !== 'active' || !examConfig?.timeLimit) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examState, examConfig?.timeLimit]);

  const startExam = (config: ExamConfig) => {
    let allQuestions: Question[] = [];

    // Load questions based on config
    if (config.type === 'topic' && config.topicIds) {
      allQuestions = config.topicIds.flatMap(topicId => getQuestionsByTopic(topicId));
    } else if (config.type === 'room' && config.room) {
      allQuestions = getQuestionsByRoom(config.room);
    }

    // Shuffle and limit questions
    if (config.shuffleQuestions) {
      allQuestions = allQuestions.sort(() => Math.random() - 0.5);
    }
    allQuestions = allQuestions.slice(0, config.questionCount);

    setExamConfig(config);
    setQuestions(allQuestions);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
    
    if (config.timeLimit) {
      setTimeRemaining(config.timeLimit * 60); // Convert to seconds
    }
    
    setExamState('active');
  };

  const submitAnswer = (selectedAnswer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = Date.now() - questionStartTime;
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const newAnswer: ExamAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      timeTaken
    };

    setAnswers(prev => [...prev, newAnswer]);

    // Move to next question or finish exam
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    setExamState('results');
  };

  const resetExam = () => {
    setExamState('setup');
    setExamConfig(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (examState === 'setup') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-study-text mb-2">Simulados</h1>
          <p className="text-muted-foreground">
            Configure seu simulado e teste seus conhecimentos
          </p>
        </div>
        
        <ExamSetup 
          subjects={subjects}
          onStartExam={startExam}
        />
      </div>
    );
  }

  if (examState === 'active' && questions.length > 0) {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const currentQuestion = questions[currentQuestionIndex];

    return (
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header with progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-study-primary border-study-primary/30">
                Questão {currentQuestionIndex + 1} de {questions.length}
              </Badge>
              {examConfig?.timeLimit && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span className={timeRemaining < 300 ? 'text-destructive font-semibold' : ''}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <Progress value={progress} className="h-2" />
        </div>

        <ExamQuestion 
          question={currentQuestion}
          onSubmitAnswer={submitAnswer}
          shuffleOptions={examConfig?.shuffleOptions || false}
        />
      </div>
    );
  }

  if (examState === 'results') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <ExamResults 
          questions={questions}
          answers={answers}
          examConfig={examConfig!}
          totalTime={Date.now() - startTime}
          onRestart={resetExam}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando simulado...</p>
        </CardContent>
      </Card>
    </div>
  );
}