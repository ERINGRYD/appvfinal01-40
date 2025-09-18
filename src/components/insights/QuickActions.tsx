import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Target, 
  Clock, 
  Brain,
  Zap,
  Calendar,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { StudySession } from '@/types/study';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  priority: 'high' | 'medium' | 'low';
  onClick: () => void;
  badge?: string;
  color?: string;
}

interface QuickActionsProps {
  sessions: StudySession[];
  onStartReview?: () => void;
  onStartSession?: () => void;
  onViewAnalytics?: () => void;
  onConfigureSettings?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  sessions,
  onStartReview,
  onStartSession,
  onViewAnalytics,
  onConfigureSettings
}) => {
  const getQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [];
    
    // Ação: Iniciar revisão se há sessões para revisar
    const hasRecentSessions = sessions.filter(s => {
      const daysSince = (Date.now() - s.startTime.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= 1 && daysSince <= 7; // Entre 1 e 7 dias atrás
    }).length > 0;
    
    if (hasRecentSessions) {
      actions.push({
        id: 'start-review',
        title: 'Iniciar Revisão',
        description: 'Revisar conteúdos estudados recentemente',
        icon: RotateCcw,
        priority: 'high',
        onClick: () => onStartReview?.(),
        badge: 'Recomendado',
        color: 'text-study-primary'
      });
    }
    
    // Ação: Nova sessão de estudo
    actions.push({
      id: 'new-session',
      title: 'Nova Sessão',
      description: 'Iniciar uma nova sessão de estudos',
      icon: BookOpen,
      priority: 'high',
      onClick: () => onStartSession?.(),
      color: 'text-study-success'
    });
    
    // Ação: Ver analytics detalhados
    if (sessions.length >= 3) {
      actions.push({
        id: 'view-analytics',
        title: 'Ver Análises',
        description: 'Insights detalhados sobre seu progresso',
        icon: TrendingUp,
        priority: 'medium',
        onClick: () => onViewAnalytics?.(),
        color: 'text-study-accent'
      });
    }
    
    // Ação: Configurar sistema de revisão
    actions.push({
      id: 'configure-reviews',
      title: 'Configurar Revisões',
      description: 'Ajustar parâmetros do sistema inteligente',
      icon: Brain,
      priority: 'low',
      onClick: () => onConfigureSettings?.(),
      color: 'text-study-warning'
    });
    
    // Ação baseada em performance
    const recentSessions = sessions.slice(-5);
    const lowPerformanceSessions = recentSessions.filter(s => s.performance === 'low').length;
    
    if (lowPerformanceSessions >= 2) {
      actions.unshift({
        id: 'improve-technique',
        title: 'Melhorar Técnica',
        description: 'Performance baixa detectada - ajustar estratégia',
        icon: Target,
        priority: 'high',
        onClick: () => onConfigureSettings?.(),
        badge: 'Urgente',
        color: 'text-study-danger'
      });
    }
    
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };
  
  const actions = getQuickActions();
  
  const getPriorityColor = (priority: QuickAction['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-study-primary';
      case 'medium':
        return 'border-l-study-accent';
      case 'low':
        return 'border-l-study-success';
      default:
        return 'border-l-muted';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-study-primary" />
          Ações Rápidas
        </CardTitle>
        <CardDescription>
          Próximos passos recomendados baseados na sua atividade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.slice(0, 4).map((action) => {
            const Icon = action.icon;
            
            return (
              <div
                key={action.id}
                className={`flex items-center justify-between p-3 border-l-4 rounded-lg bg-card/50 hover:bg-card transition-colors cursor-pointer ${getPriorityColor(action.priority)}`}
                onClick={action.onClick}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg bg-muted/50 ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{action.title}</h4>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <span className="sr-only">Executar ação</span>
                  →
                </Button>
              </div>
            );
          })}
        </div>
        
        {sessions.length === 0 && (
          <div className="text-center py-6">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Inicie sua primeira sessão para ver ações personalizadas!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};