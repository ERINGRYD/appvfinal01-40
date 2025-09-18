import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb, 
  Clock, 
  Target,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { StudyInsight } from '@/utils/insightsEngine';
import { cn } from '@/lib/utils';

interface ActionableInsightsProps {
  insights: StudyInsight[];
  onActionClick?: (insight: StudyInsight) => void;
  maxInsights?: number;
}

const getInsightIcon = (type: StudyInsight['type']) => {
  switch (type) {
    case 'weakness':
      return AlertTriangle;
    case 'strength':
      return CheckCircle2;
    case 'pattern':
      return TrendingUp;
    case 'recommendation':
      return Lightbulb;
    case 'alert':
      return AlertTriangle;
    default:
      return Target;
  }
};

const getSeverityColor = (severity: StudyInsight['severity']) => {
  switch (severity) {
    case 'critical':
      return 'bg-study-danger/10 text-study-danger border-study-danger/20';
    case 'high':
      return 'bg-study-warning/10 text-study-warning border-study-warning/20';
    case 'medium':
      return 'bg-study-accent/10 text-study-accent border-study-accent/20';
    case 'low':
      return 'bg-study-success/10 text-study-success border-study-success/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getSeverityText = (severity: StudyInsight['severity']) => {
  switch (severity) {
    case 'critical':
      return 'Crítico';
    case 'high':
      return 'Alto';
    case 'medium':
      return 'Médio';
    case 'low':
      return 'Baixo';
    default:
      return severity;
  }
};

export const ActionableInsights: React.FC<ActionableInsightsProps> = ({
  insights,
  onActionClick,
  maxInsights = 5
}) => {
  // Ordena insights por severidade e prioriza os acionáveis
  const sortedInsights = insights
    .sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      
      if (severityDiff !== 0) return severityDiff;
      return (b.actionable ? 1 : 0) - (a.actionable ? 1 : 0);
    })
    .slice(0, maxInsights);

  if (sortedInsights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-study-success" />
            Insights Inteligentes
          </CardTitle>
          <CardDescription>
            Análise automática do seu desempenho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-study-success mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Continue estudando para gerar insights personalizados!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-study-primary" />
          Insights Inteligentes
        </CardTitle>
        <CardDescription>
          Análises automáticas e recomendações personalizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedInsights.map((insight) => {
            const Icon = getInsightIcon(insight.type);
            
            return (
              <Alert
                key={insight.id}
                className={cn(
                  "transition-all hover:shadow-md cursor-pointer",
                  insight.severity === 'critical' && "border-study-danger/30",
                  insight.severity === 'high' && "border-study-warning/30",
                  insight.severity === 'medium' && "border-study-accent/30",
                  insight.severity === 'low' && "border-study-success/30"
                )}
                onClick={() => insight.actionable && onActionClick?.(insight)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className={cn(
                      "h-5 w-5 mt-0.5",
                      insight.severity === 'critical' && "text-study-danger",
                      insight.severity === 'high' && "text-study-warning",
                      insight.severity === 'medium' && "text-study-accent",
                      insight.severity === 'low' && "text-study-success"
                    )} />
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTitle className="text-sm font-medium">
                          {insight.title}
                        </AlertTitle>
                        <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                          {getSeverityText(insight.severity)}
                        </Badge>
                      </div>
                      
                      <AlertDescription className="text-sm text-muted-foreground">
                        {insight.description}
                      </AlertDescription>
                      
                      {insight.suggestion && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                          💡 {insight.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {insight.actionable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Alert>
            );
          })}
        </div>
        
        {insights.length > maxInsights && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Ver todos os insights ({insights.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};