import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Calendar, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Zap
} from 'lucide-react';
import { StudySession } from '@/types/study';
import { 
  ReviewCard, 
  calculateReviewStats, 
  getCardsReadyForReview,
  createReviewCard 
} from '@/utils/spacedRepetition';
import { getReviewSettings } from '@/db/crud/reviewSettings';
import { differenceInDays, format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SmartReviewWidgetProps {
  sessions: StudySession[];
  onStartReview?: () => void;
  onConfigureReviews?: () => void;
}

export const SmartReviewWidget: React.FC<SmartReviewWidgetProps> = ({
  sessions,
  onStartReview,
  onConfigureReviews
}) => {
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [reviewSettings, setReviewSettings] = useState(getReviewSettings());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReviewCards();
  }, [sessions]);

  const generateReviewCards = () => {
    setLoading(true);
    
    // Gera cartões de revisão baseados nas sessões
    const cards: ReviewCard[] = [];
    
    sessions.forEach((session, index) => {
      const daysSinceStudy = differenceInDays(new Date(), session.startTime);
      
      // Cria cartão se a sessão foi há mais de 1 dia
      if (daysSinceStudy >= 1) {
        const card = createReviewCard(
          `session_${session.id || index}`,
          session.subject
        );
        
        // Ajusta próxima revisão baseada no tempo que passou
        const shouldReview = daysSinceStudy >= card.interval;
        card.isBlocked = !shouldReview;
        
        if (shouldReview) {
          card.nextReviewDate = new Date(); // Pronto para revisar agora
        } else {
          card.nextReviewDate = addDays(session.startTime, card.interval);
        }
        
        cards.push(card);
      }
    });
    
    setReviewCards(cards);
    setLoading(false);
  };

  const stats = calculateReviewStats(reviewCards);
  const readyCards = getCardsReadyForReview(reviewCards, reviewSettings.dailyReviewLimit);
  
  const getNextReviewTime = () => {
    const nextCard = reviewCards
      .filter(card => card.isBlocked)
      .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime())[0];
      
    return nextCard ? nextCard.nextReviewDate : null;
  };

  const nextReviewTime = getNextReviewTime();
  
  const getReviewUrgency = () => {
    if (readyCards.length === 0) return 'none';
    if (readyCards.length >= 10) return 'high';
    if (readyCards.length >= 5) return 'medium';
    return 'low';
  };

  const urgency = getReviewUrgency();
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-study-danger';
      case 'medium':
        return 'text-study-warning';
      case 'low':
        return 'text-study-success';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            Sistema de Revisão Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-8 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviewCards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-study-primary" />
            Sistema de Revisão Inteligente
          </CardTitle>
          <CardDescription>
            Algoritmo baseado em repetição espaçada (SM-2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              Complete algumas sessões de estudo para ativar o sistema de revisões inteligentes
            </p>
            <Button variant="outline" onClick={onConfigureReviews}>
              Configurar Sistema
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-study-primary" />
          Sistema de Revisão Inteligente
        </CardTitle>
        <CardDescription>
          Baseado em repetição espaçada personalizada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status das Revisões */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className={`text-2xl font-bold ${getUrgencyColor(urgency)}`}>
              {readyCards.length}
            </div>
            <div className="text-xs text-muted-foreground">
              prontas agora
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-study-accent">
              {stats.totalCards}
            </div>
            <div className="text-xs text-muted-foreground">
              total de cartões
            </div>
          </div>
        </div>

        {/* Progress da Retenção */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Taxa de Retenção</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(stats.retentionRate * 100)}%
            </span>
          </div>
          <Progress value={stats.retentionRate * 100} className="h-2" />
        </div>

        {/* Próxima Revisão */}
        {nextReviewTime && readyCards.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-study-success/10 rounded-lg">
            <Clock className="h-4 w-4 text-study-success" />
            <div className="flex-1">
              <div className="text-sm font-medium">Próxima Revisão</div>
              <div className="text-xs text-muted-foreground">
                {format(nextReviewTime, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-study-success" />
            <span>{stats.cardsMature} maduras</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-study-warning" />
            <span>{stats.cardsLearning} aprendendo</span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button 
            onClick={onStartReview}
            disabled={readyCards.length === 0}
            className="flex-1"
            variant={readyCards.length > 0 ? "default" : "outline"}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {readyCards.length > 0 ? 'Iniciar Revisão' : 'Sem Revisões'}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={onConfigureReviews}
          >
            <Zap className="h-4 w-4" />
          </Button>
        </div>

        {/* Alert de Urgência */}
        {urgency === 'high' && (
          <div className="flex items-center gap-2 p-2 bg-study-danger/10 border border-study-danger/20 rounded text-study-danger text-xs">
            <AlertCircle className="h-4 w-4" />
            <span>Muitas revisões acumuladas! Recomendamos priorizar.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};