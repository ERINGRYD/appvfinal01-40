import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FlashcardQuestion } from '@/types/flashcard';
import { Subject } from '@/types/questions';
import { FlashcardMode } from './FlashcardMode';
import { 
  BookOpen, 
  Plus, 
  Play, 
  Target, 
  Clock, 
  TrendingUp,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface FlashcardsSectionProps {
  subject: Subject;
  flashcards: FlashcardQuestion[];
  onAddFlashcard: (topicId: string) => void;
  onViewFlashcard: (flashcard: FlashcardQuestion) => void;
  onEditFlashcard: (flashcard: FlashcardQuestion) => void;
  onDeleteFlashcard: (id: string) => void;
}

export function FlashcardsSection({ 
  subject, 
  flashcards,
  onAddFlashcard, 
  onViewFlashcard,
  onEditFlashcard,
  onDeleteFlashcard
}: FlashcardsSectionProps) {
  const [studyMode, setStudyMode] = useState<'overview' | 'study'>('overview');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Group flashcards by topic
  const flashcardsByTopic = subject.topics.reduce((acc, topic) => {
    const topicFlashcards = flashcards.filter(f => f.topicId === topic.id);
    if (topicFlashcards.length > 0) {
      acc[topic.id] = {
        topic,
        flashcards: topicFlashcards
      };
    }
    return acc;
  }, {} as Record<string, { topic: any; flashcards: FlashcardQuestion[] }>);

  const totalFlashcards = flashcards.length;
  const readyForReview = flashcards.length; // All flashcards are ready by default
  const avgAccuracy = flashcards.reduce((sum, f) => sum + (f.averageQuality || 0), 0) / Math.max(flashcards.length, 1) * 20;

  const handleStartStudySession = (topicIds: string[]) => {
    const topicFlashcards = flashcards.filter(f => topicIds.includes(f.topicId));
    if (topicFlashcards.length > 0) {
      setSelectedTopics(topicIds);
      setStudyMode('study');
    }
  };

  const handleSessionComplete = (session: any) => {
    // Handle session completion - could save to database
    console.log('Session completed:', session);
    setStudyMode('overview');
    setSelectedTopics([]);
  };

  if (studyMode === 'study' && selectedTopics.length > 0) {
    const studyFlashcards = flashcards.filter(f => selectedTopics.includes(f.topicId));
    return (
      <FlashcardMode
        flashcards={studyFlashcards}
        onSessionComplete={handleSessionComplete}
        onClose={() => setStudyMode('overview')}
      />
    );
  }

  if (Object.keys(flashcardsByTopic).length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum flashcard encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Crie flashcards para os temas de {subject.name} e comece a estudar.
          </p>
          {subject.topics.length > 0 && (
            <Button 
              onClick={() => onAddFlashcard(subject.topics[0].id)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Primeiro Flashcard
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: subject.color }}
              />
              {subject.name}
              <Badge variant="secondary" className="ml-2">
                {totalFlashcards} flashcards
              </Badge>
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              {Object.keys(flashcardsByTopic).length} temas com flashcards
            </p>
          </div>
          
          <Button 
            onClick={() => handleStartStudySession(Object.keys(flashcardsByTopic))}
            className="gap-2"
            disabled={totalFlashcards === 0}
          >
            <Play className="h-4 w-4" />
            Estudar Todos
          </Button>
        </div>

        {/* Subject Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-study-primary/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-study-primary" />
              <span className="text-sm font-medium">Para Revisar</span>
            </div>
            <div className="text-xl font-bold text-study-primary mt-1">
              {readyForReview}
            </div>
          </div>
          
          <div className="bg-study-success/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-study-success" />
              <span className="text-sm font-medium">Precisão</span>
            </div>
            <div className="text-xl font-bold text-study-success mt-1">
              {Math.round(avgAccuracy)}%
            </div>
          </div>
          
          <div className="bg-study-accent/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-study-accent" />
              <span className="text-sm font-medium">Última Revisão</span>
            </div>
            <div className="text-sm font-bold text-study-accent mt-1">
              Hoje
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {Object.entries(flashcardsByTopic).map(([topicId, { topic, flashcards: topicFlashcards }]) => (
          <Card key={topicId} className="border-l-4 border-l-study-primary/30">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    {topic.name}
                    <Badge variant="outline" className="text-xs">
                      {topicFlashcards.length} cards
                    </Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {topicFlashcards.filter(f => f.totalReviews === 0).length} novos • {' '}
                    {topicFlashcards.filter(f => f.totalReviews > 0).length} revisados
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddFlashcard(topicId)}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStartStudySession([topicId])}
                    className="gap-1"
                  >
                    <Play className="h-3 w-3" />
                    Estudar
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso do tema</span>
                  <span>{Math.round((topicFlashcards.filter(f => f.totalReviews > 0).length / topicFlashcards.length) * 100)}%</span>
                </div>
                <Progress 
                  value={(topicFlashcards.filter(f => f.totalReviews > 0).length / topicFlashcards.length) * 100}
                  className="h-2"
                />
              </div>

              {/* Flashcards list */}
              <div className="space-y-2">
                {topicFlashcards.slice(0, 3).map((flashcard) => (
                  <div 
                    key={flashcard.id} 
                    className="flex justify-between items-center p-2 bg-background/50 rounded border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {flashcard.question}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            flashcard.difficulty === 'easy' ? 'text-green-600' :
                            flashcard.difficulty === 'hard' ? 'text-red-600' : 'text-yellow-600'
                          }`}
                        >
                          {flashcard.difficulty === 'easy' ? 'Fácil' : 
                           flashcard.difficulty === 'hard' ? 'Difícil' : 'Médio'}
                        </Badge>
                        {flashcard.totalReviews > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {flashcard.totalReviews} revisões
                          </span>
                        )}
                        {flashcard.streakCount > 0 && (
                          <span className="text-xs text-green-600">
                            {flashcard.streakCount}🔥
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewFlashcard(flashcard)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditFlashcard(flashcard)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteFlashcard(flashcard.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {topicFlashcards.length > 3 && (
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">
                      +{topicFlashcards.length - 3} flashcards adicionais
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}