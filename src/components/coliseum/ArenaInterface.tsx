import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  CheckCircle2, 
  Circle, 
  Flag, 
  ArrowLeft, 
  ArrowRight,
  Swords
} from 'lucide-react';
import { ColiseumSession, ColiseumQuestion } from '@/types/coliseum';

interface ArenaInterfaceProps {
  session: ColiseumSession;
  onAnswerQuestion: (questionId: string, answer: string) => void;
  onToggleReview: (questionId: string) => void;
  onNavigateQuestion: (index: number) => void;
  onFinishBattle: () => void;
  timeRemaining?: number;
}

const ArenaInterface: React.FC<ArenaInterfaceProps> = ({
  session,
  onAnswerQuestion,
  onToggleReview,
  onNavigateQuestion,
  onFinishBattle,
  timeRemaining
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const currentQuestion = session.questions[session.currentQuestionIndex];
  const currentAnswer = session.answers.get(currentQuestion.id);
  
  useEffect(() => {
    setSelectedAnswer(currentAnswer?.selectedAnswer || '');
  }, [session.currentQuestionIndex, currentAnswer]);

  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;
  const answeredCount = Array.from(session.answers.values()).filter(a => a.selectedAnswer).length;
  const reviewCount = Array.from(session.answers.values()).filter(a => a.markedForReview).length;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    if (selectedAnswer) {
      onAnswerQuestion(currentQuestion.id, selectedAnswer);
    }
  };

  const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1;

  return (
    <div className="space-y-6">
      {/* Header com Timer e Progresso */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg py-1">
                {session.currentQuestionIndex + 1} / {session.questions.length}
              </Badge>
              {timeRemaining !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{answeredCount} respondidas</span>
              </div>
              {reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-orange-600" />
                  <span>{reviewCount} marcadas</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Questão Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge>{currentQuestion.difficulty === 'easy' ? 'Fácil' : currentQuestion.difficulty === 'medium' ? 'Médio' : 'Difícil'}</Badge>
                <Badge variant="outline">{currentQuestion.subjectName}</Badge>
                <Badge variant="outline">{currentQuestion.topicName}</Badge>
              </div>
              <CardTitle className="text-xl">{currentQuestion.content}</CardTitle>
            </div>
            
            <Button
              variant={currentAnswer?.markedForReview ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleReview(currentQuestion.id)}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {currentQuestion.options?.map((option) => (
              <div
                key={option.id}
                className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                  selectedAnswer === option.label
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value={option.label} id={option.id} />
                <Label 
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer text-base"
                >
                  <span className="font-semibold mr-2">{option.label})</span>
                  {option.content}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedAnswer && (
            <Button onClick={handleAnswer} className="w-full" size="lg">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {currentAnswer?.selectedAnswer ? 'Atualizar Resposta' : 'Confirmar Resposta'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => onNavigateQuestion(session.currentQuestionIndex - 1)}
          disabled={session.currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={onFinishBattle}
            className="bg-gradient-to-r from-orange-500 to-red-500"
            size="lg"
          >
            <Swords className="h-5 w-5 mr-2" />
            Finalizar Combate
          </Button>
        ) : (
          <Button
            onClick={() => onNavigateQuestion(session.currentQuestionIndex + 1)}
          >
            Próxima
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Grid de Questões */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Navegação Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {session.questions.map((q, index) => {
              const answer = session.answers.get(q.id);
              const isAnswered = answer?.selectedAnswer;
              const isReviewed = answer?.markedForReview;
              const isCurrent = index === session.currentQuestionIndex;
              
              return (
                <Button
                  key={q.id}
                  variant={isCurrent ? "default" : "outline"}
                  size="sm"
                  onClick={() => onNavigateQuestion(index)}
                  className={`relative ${
                    isAnswered 
                      ? 'border-green-500 bg-green-500/10' 
                      : isReviewed 
                        ? 'border-orange-500 bg-orange-500/10' 
                        : ''
                  }`}
                >
                  {index + 1}
                  {isReviewed && (
                    <Flag className="h-3 w-3 absolute -top-1 -right-1 text-orange-600" />
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArenaInterface;
