import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlashcardCard } from './FlashcardCard';
import { FlashcardControls } from './FlashcardControls';
import { FlashcardQuestion, FlashcardResponse, FlashcardSession } from '@/types/flashcard';
import { calculateNextReview, ReviewResult, UserProfile } from '@/utils/spacedRepetition';
import { Trophy, Clock, Target, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FlashcardModeProps {
  flashcards: FlashcardQuestion[];
  onSessionComplete: (session: FlashcardSession) => void;
  onClose: () => void;
  maxCards?: number;
}

export function FlashcardMode({ 
  flashcards, 
  onSessionComplete, 
  onClose, 
  maxCards = 20 
}: FlashcardModeProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [session, setSession] = useState<FlashcardSession>(() => ({
    id: `session_${Date.now()}`,
    topicIds: [...new Set(flashcards.map(f => f.topicId))],
    maxCards: Math.min(maxCards, flashcards.length),
    currentCardIndex: 0,
    cards: flashcards.slice(0, Math.min(maxCards, flashcards.length)),
    startTime: new Date(),
    totalCorrect: 0,
    totalReviewed: 0,
    averageResponseTime: 0
  }));
  
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date());
  const [responses, setResponses] = useState<{ [cardId: string]: FlashcardResponse }>({});

  // Default user profile - in a real app, this would come from user data
  const userProfile: UserProfile = {
    averageRetentionRate: 0.85,
    preferredDifficulty: 2.5,
    averageResponseTime: 30,
    learningVelocity: 0.7,
    forgettingCurve: 0.6,
    totalReviewsSessions: 10
  };

  const currentCard = session.cards[currentCardIndex];
  const isLastCard = currentCardIndex >= session.cards.length - 1;

  useEffect(() => {
    setCardStartTime(new Date());
  }, [currentCardIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResponse = (response: FlashcardResponse) => {
    if (!currentCard) return;

    const responseTime = (new Date().getTime() - cardStartTime.getTime()) / 1000;
    const wasCorrect = response === 'good' || response === 'easy';
    
    // Map response to quality (0-5 scale)
    const responseToQuality: { [key in FlashcardResponse]: number } = {
      'again': 0,
      'hard': 2,
      'good': 4,
      'easy': 5
    };

    const quality = responseToQuality[response];
    
    const reviewResult: ReviewResult = {
      quality,
      responseTime,
      confidenceLevel: 'certeza', // Could be determined from response
      wasCorrect
    };

    // Calculate next review using spaced repetition
    const reviewCard = {
      id: currentCard.id,
      topicId: currentCard.topicId,
      easeFactor: currentCard.easeFactor,
      interval: currentCard.interval,
      repetition: currentCard.repetition,
      nextReviewDate: currentCard.nextReviewDate,
      lastReviewDate: currentCard.lastReviewDate,
      quality: quality,
      averageQuality: currentCard.averageQuality,
      totalReviews: currentCard.totalReviews,
      streakCount: currentCard.streakCount,
      failureCount: currentCard.failureCount,
      isBlocked: true,
      personalizedMultiplier: 1.0
    };

    const updatedCard = calculateNextReview(reviewCard, reviewResult, userProfile);
    
    // Update session stats
    setSession(prev => ({
      ...prev,
      totalReviewed: prev.totalReviewed + 1,
      totalCorrect: prev.totalCorrect + (wasCorrect ? 1 : 0),
      averageResponseTime: (prev.averageResponseTime * prev.totalReviewed + responseTime) / (prev.totalReviewed + 1)
    }));

    // Store response
    setResponses(prev => ({
      ...prev,
      [currentCard.id]: response
    }));

    // Move to next card or complete session
    if (isLastCard) {
      completeSession();
    } else {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
      
      toast({
        title: wasCorrect ? "Correto!" : "Continue praticando",
        description: wasCorrect 
          ? `Próxima revisão em ${updatedCard.interval} dias`
          : "Esta questão aparecerá novamente em breve"
      });
    }
  };

  const completeSession = () => {
    const completedSession: FlashcardSession = {
      ...session,
      endTime: new Date(),
      totalReviewed: session.totalReviewed + 1,
      totalCorrect: session.totalCorrect + (responses[currentCard.id] === 'good' || responses[currentCard.id] === 'easy' ? 1 : 0)
    };

    onSessionComplete(completedSession);
  };

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sem flashcards disponíveis</h3>
            <p className="text-muted-foreground mb-4">
              Não há flashcards para revisar no momento.
            </p>
            <Button onClick={onClose}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accuracy = session.totalReviewed > 0 ? (session.totalCorrect / session.totalReviewed) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-study-primary" />
            Revisão de Flashcards
          </h2>
          <p className="text-muted-foreground">
            {currentCard.topicName} • {currentCard.subjectName}
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-study-primary">{Math.round(accuracy)}%</div>
            <div className="text-xs text-muted-foreground">Precisão</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-study-success">{session.totalCorrect}</div>
            <div className="text-xs text-muted-foreground">Corretas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(session.averageResponseTime)}s</div>
            <div className="text-xs text-muted-foreground">Tempo médio</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flashcard */}
        <div className="lg:col-span-2">
          <FlashcardCard
            flashcard={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            className="h-full"
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <FlashcardControls
            isFlipped={isFlipped}
            onFlip={handleFlip}
            onResponse={handleResponse}
            currentIndex={currentCardIndex + 1}
            totalCards={session.cards.length}
            correctCount={session.totalCorrect}
          />

          {/* Session info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {Math.floor((new Date().getTime() - session.startTime.getTime()) / 60000)}min
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>
                  {session.totalCorrect} de {session.totalReviewed} corretas
                </span>
              </div>
              
              {currentCard.examYear && (
                <Badge variant="outline" className="w-fit">
                  {currentCard.examYear}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
          >
            Encerrar Sessão
          </Button>
        </div>
      </div>
    </div>
  );
}