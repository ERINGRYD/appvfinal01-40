import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Play, Timer, Target, Shuffle } from 'lucide-react';
import { getQuestionsByTopic, getQuestionsByRoom } from '@/db/crud/questions';
import type { StudySubject } from '@/types/study';
import type { ExamConfig } from '@/pages/SimulatedExam';
import type { Room } from '@/types/battle';

interface ExamSetupProps {
  subjects: StudySubject[];
  onStartExam: (config: ExamConfig) => void;
}

export function ExamSetup({ subjects, onStartExam }: ExamSetupProps) {
  const [examType, setExamType] = useState<'topic' | 'room'>('topic');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room>('triagem');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  const rooms: Room[] = ['triagem', 'vermelha', 'amarela', 'verde'];
  
  const roomLabels = {
    triagem: 'Triagem',
    vermelha: 'Sala Vermelha',
    amarela: 'Sala Amarela',
    verde: 'Sala Verde'
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const getAvailableQuestions = () => {
    if (examType === 'topic') {
      return selectedTopics.reduce((total, topicId) => {
        return total + getQuestionsByTopic(topicId).length;
      }, 0);
    } else {
      return getQuestionsByRoom(selectedRoom).length;
    }
  };

  const canStartExam = () => {
    if (examType === 'topic') {
      return selectedTopics.length > 0 && questionCount > 0 && questionCount <= getAvailableQuestions();
    } else {
      return questionCount > 0 && questionCount <= getAvailableQuestions();
    }
  };

  const handleStartExam = () => {
    const config: ExamConfig = {
      type: examType,
      topicIds: examType === 'topic' ? selectedTopics : undefined,
      room: examType === 'room' ? selectedRoom : undefined,
      questionCount,
      timeLimit,
      shuffleQuestions,
      shuffleOptions
    };

    onStartExam(config);
  };

  const availableQuestions = getAvailableQuestions();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-study-primary" />
            Configuração do Simulado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exam Type */}
          <div className="space-y-3">
            <Label>Tipo de Simulado</Label>
            <Select value={examType} onValueChange={(value: 'topic' | 'room') => setExamType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="topic">Por Tópicos</SelectItem>
                <SelectItem value="room">Por Sala de Batalha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Topic/Room Selection */}
          {examType === 'topic' ? (
            <div className="space-y-3">
              <Label>Selecionar Tópicos</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 p-2 border rounded-lg">
                {subjects.map(subject => (
                  <div key={subject.id} className="space-y-2">
                    <h4 className="font-medium text-sm text-study-text">{subject.name}</h4>
                    <div className="ml-4 space-y-1">
                      {subject.topics?.map(topic => {
                        const questionsCount = getQuestionsByTopic(topic.id).length;
                        return (
                          <div key={topic.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={topic.id}
                                checked={selectedTopics.includes(topic.id)}
                                onCheckedChange={() => handleTopicToggle(topic.id)}
                                disabled={questionsCount === 0}
                              />
                              <label 
                                htmlFor={topic.id} 
                                className={`text-sm ${questionsCount === 0 ? 'text-muted-foreground' : 'cursor-pointer'}`}
                              >
                                {topic.name}
                              </label>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {questionsCount}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Sala de Batalha</Label>
              <Select value={selectedRoom} onValueChange={(value: Room) => setSelectedRoom(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => (
                    <SelectItem key={room} value={room}>
                      {roomLabels[room]} ({getQuestionsByRoom(room).length} questões)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Question Count */}
          <div className="space-y-3">
            <Label htmlFor="questionCount">Número de Questões</Label>
            <Input
              id="questionCount"
              type="number"
              min="1"
              max={availableQuestions}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 0)}
              placeholder="Ex: 10"
            />
            <p className="text-xs text-muted-foreground">
              Máximo disponível: {availableQuestions} questões
            </p>
          </div>

          {/* Time Limit */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasTimeLimit"
                checked={timeLimit !== undefined}
                onCheckedChange={(checked) => setTimeLimit(checked ? 30 : undefined)}
              />
              <Label htmlFor="hasTimeLimit" className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Limite de Tempo
              </Label>
            </div>
            {timeLimit !== undefined && (
              <Input
                type="number"
                min="5"
                max="180"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)}
                placeholder="Minutos"
              />
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shuffleQuestions"
                checked={shuffleQuestions}
                onCheckedChange={(checked) => setShuffleQuestions(checked === true)}
              />
              <Label htmlFor="shuffleQuestions" className="flex items-center gap-2">
                <Shuffle className="h-4 w-4" />
                Embaralhar Questões
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shuffleOptions"
                checked={shuffleOptions}
                onCheckedChange={(checked) => setShuffleOptions(checked === true)}
              />
              <Label htmlFor="shuffleOptions">Embaralhar Alternativas</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Simulado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-study-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-study-primary">{questionCount}</div>
              <div className="text-sm text-muted-foreground">Questões</div>
            </div>
            <div className="text-center p-4 bg-study-accent/5 rounded-lg">
              <div className="text-2xl font-bold text-study-accent">
                {timeLimit ? `${timeLimit}min` : '∞'}
              </div>
              <div className="text-sm text-muted-foreground">Tempo</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Configurações:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Tipo: {examType === 'topic' ? 'Por Tópicos' : 'Por Sala de Batalha'}</li>
              {examType === 'topic' && (
                <li>• Tópicos selecionados: {selectedTopics.length}</li>
              )}
              {examType === 'room' && (
                <li>• Sala: {roomLabels[selectedRoom]}</li>
              )}
              <li>• Questões embaralhadas: {shuffleQuestions ? 'Sim' : 'Não'}</li>
              <li>• Alternativas embaralhadas: {shuffleOptions ? 'Sim' : 'Não'}</li>
            </ul>
          </div>

          <Button
            onClick={handleStartExam}
            disabled={!canStartExam()}
            size="lg"
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Simulado
          </Button>
          
          {!canStartExam() && (
            <p className="text-sm text-muted-foreground text-center">
              {examType === 'topic' && selectedTopics.length === 0 
                ? 'Selecione pelo menos um tópico'
                : questionCount > availableQuestions
                ? 'Número de questões excede o disponível'
                : 'Configure o simulado para continuar'
              }
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}