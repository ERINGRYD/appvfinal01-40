import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Target,
  TrendingUp,
  Award,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Question } from '@/types/battle';
import type { ExamAnswer, ExamConfig } from '@/pages/SimulatedExam';

interface ExamResultsProps {
  questions: Question[];
  answers: ExamAnswer[];
  examConfig: ExamConfig;
  totalTime: number;
  onRestart: () => void;
}

export function ExamResults({ questions, answers, examConfig, totalTime, onRestart }: ExamResultsProps) {
  const [showExplanations, setShowExplanations] = useState(false);
  
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const totalQuestions = questions.length;
  const accuracy = (correctAnswers / totalQuestions) * 100;
  const averageTime = totalTime / totalQuestions / 1000; // seconds per question

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 80) return { level: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-500/10' };
    if (accuracy >= 60) return { level: 'Bom', color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' };
    if (accuracy >= 40) return { level: 'Regular', color: 'text-orange-600', bgColor: 'bg-orange-500/10' };
    return { level: 'Precisa Melhorar', color: 'text-red-600', bgColor: 'bg-red-500/10' };
  };

  const performance = getPerformanceLevel(accuracy);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyStats = () => {
    const stats = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
    
    questions.forEach((question, index) => {
      const answer = answers[index];
      if (stats[question.difficulty]) {
        stats[question.difficulty].total++;
        if (answer?.isCorrect) {
          stats[question.difficulty].correct++;
        }
      }
    });

    return stats;
  };

  const difficultyStats = getDifficultyStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className={`p-4 rounded-full ${performance.bgColor}`}>
            <Trophy className={`h-8 w-8 ${performance.color}`} />
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-study-text mb-2">Simulado Concluído!</h1>
          <Badge className={`${performance.bgColor} ${performance.color} border-0 text-base px-4 py-1`}>
            {performance.level}
          </Badge>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-study-primary mb-2">
              {correctAnswers}/{totalQuestions}
            </div>
            <div className="text-sm text-muted-foreground">Acertos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-study-accent mb-2">
              {accuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Aproveitamento</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {formatTime(totalTime)}
            </div>
            <div className="text-sm text-muted-foreground">Tempo Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {averageTime.toFixed(0)}s
            </div>
            <div className="text-sm text-muted-foreground">Tempo Médio</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Aproveitamento Geral</h3>
              <span className="text-2xl font-bold">{accuracy.toFixed(1)}%</span>
            </div>
            <Progress value={accuracy} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="difficulty">Por Dificuldade</TabsTrigger>
          <TabsTrigger value="questions">Questões</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análise de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-700">{correctAnswers}</div>
                    <div className="text-sm text-muted-foreground">Questões Corretas</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <div className="font-semibold text-red-700">{totalQuestions - correctAnswers}</div>
                    <div className="text-sm text-muted-foreground">Questões Incorretas</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Configurações do Simulado:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tipo: {examConfig.type === 'topic' ? 'Por Tópicos' : 'Por Sala de Batalha'}</li>
                  <li>• Questões: {totalQuestions}</li>
                  <li>• Tempo limite: {examConfig.timeLimit ? `${examConfig.timeLimit} min` : 'Ilimitado'}</li>
                  <li>• Questões embaralhadas: {examConfig.shuffleQuestions ? 'Sim' : 'Não'}</li>
                  <li>• Alternativas embaralhadas: {examConfig.shuffleOptions ? 'Sim' : 'Não'}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="difficulty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance por Dificuldade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(difficultyStats).map(([difficulty, stats]) => {
                const difficultyLabel = difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Médio' : 'Difícil';
                const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                
                return (
                  <div key={difficulty} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{difficultyLabel}</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.correct}/{stats.total} ({accuracy.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Revisão das Questões
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExplanations(!showExplanations)}
                >
                  {showExplanations ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showExplanations ? 'Ocultar' : 'Mostrar'} Comentários
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {questions.map((question, index) => {
                    const answer = answers[index];
                    const isCorrect = answer?.isCorrect || false;
                    
                    return (
                      <div
                        key={question.id}
                        className={`p-4 rounded-lg border ${
                          isCorrect 
                            ? 'bg-green-500/5 border-green-500/20' 
                            : 'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className="font-medium">Questão {index + 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatTime(answer?.timeTaken || 0)}
                            </span>
                          </div>
                        </div>
                        
                        <h4 className="font-medium mb-2">{question.title}</h4>
                        
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>Sua resposta:</strong> {answer?.selectedAnswer || 'Não respondida'}
                          </div>
                          <div>
                            <strong>Resposta correta:</strong> {question.correctAnswer}
                          </div>
                        </div>
                        
                        {showExplanations && question.explanation && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <h5 className="font-medium text-sm mb-1">Explicação:</h5>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button onClick={onRestart} size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Novo Simulado
        </Button>
      </div>
    </div>
  );
}