import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  BookOpen, 
  Brain,
  Target,
  TrendingUp,
  Zap,
  Calendar,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
  target?: string;
  action?: () => void;
}

interface OnboardingTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao seu Assistente de Estudos Inteligente!',
    description: 'Vamos te guiar pelos principais recursos que irão revolucionar seus estudos.',
    icon: Brain,
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <Brain className="h-16 w-16 text-study-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Este aplicativo usa algoritmos avançados de <strong>repetição espaçada</strong> e 
            análise de performance para otimizar seu aprendizado.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-study-success/10 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-study-success mx-auto mb-2" />
            <div className="text-sm font-medium">Revisões Inteligentes</div>
          </div>
          <div className="text-center p-3 bg-study-accent/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-study-accent mx-auto mb-2" />
            <div className="text-sm font-medium">Análises Automáticas</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'dashboard',
    title: 'Dashboard Inteligente',
    description: 'Seu centro de comando com insights em tempo real.',
    icon: Target,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          O dashboard analisa automaticamente seu desempenho e oferece:
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded">
            <Zap className="h-5 w-5 text-study-primary" />
            <div>
              <div className="font-medium text-sm">Ações Rápidas</div>
              <div className="text-xs text-muted-foreground">Próximos passos personalizados</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded">
            <Brain className="h-5 w-5 text-study-accent" />
            <div>
              <div className="font-medium text-sm">Insights Automáticos</div>
              <div className="text-xs text-muted-foreground">Detecta padrões e fraquezas</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded">
            <Calendar className="h-5 w-5 text-study-success" />
            <div>
              <div className="font-medium text-sm">Sistema de Revisões</div>
              <div className="text-xs text-muted-foreground">Baseado em ciência cognitiva</div>
            </div>
          </div>
        </div>
      </div>
    ),
    target: 'dashboard'
  },
  {
    id: 'study-planner',
    title: 'Planner Inteligente',
    description: 'Crie planos de estudo personalizados e adaptativos.',
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          O planner adapta automaticamente sua estratégia baseado em:
        </p>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-study-primary rounded-full" />
            <span>Sua performance histórica por matéria</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-study-accent rounded-full" />
            <span>Proximidade da data do exame</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-study-success rounded-full" />
            <span>Dificuldade individual de cada tópico</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-study-warning rounded-full" />
            <span>Seus horários mais produtivos</span>
          </div>
        </div>
        <div className="p-3 bg-study-primary/10 rounded border-study-primary/20 border">
          <div className="text-sm font-medium">💡 Dica Pro</div>
          <div className="text-xs text-muted-foreground mt-1">
            Quanto mais você usar, mais inteligente o sistema fica!
          </div>
        </div>
      </div>
    ),
    target: 'planner'
  },
  {
    id: 'spaced-repetition',
    title: 'Sistema de Revisão Espaçada',
    description: 'O segredo para memorização de longo prazo.',
    icon: Brain,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Baseado no algoritmo <strong>SuperMemo SM-2</strong>, usado por milhões de estudantes:
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-gradient-to-r from-study-primary/10 to-study-accent/10 rounded">
            <div className="font-medium text-sm mb-1">Como Funciona:</div>
            <ol className="text-xs text-muted-foreground space-y-1">
              <li>1. Você estuda um tópico</li>
              <li>2. Sistema agenda revisão automática</li>
              <li>3. Intervalo aumenta baseado na sua performance</li>
              <li>4. Retenção melhora dramaticamente</li>
            </ol>
          </div>
          <div className="text-center p-3 bg-study-success/10 rounded border border-study-success/20">
            <div className="text-study-success font-medium text-sm">Resultado:</div>
            <div className="text-study-success text-xs">Até 90% de retenção com 70% menos tempo</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'analytics',
    title: 'Analytics Avançados',
    description: 'Entenda seus padrões e otimize seu desempenho.',
    icon: TrendingUp,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          O sistema monitora continuamente e identifica:
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded">
            <div className="w-2 h-2 bg-study-danger rounded-full mt-2" />
            <div>
              <div className="font-medium text-sm">Pontos Fracos</div>
              <div className="text-xs text-muted-foreground">Matérias que precisam de mais atenção</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded">
            <div className="w-2 h-2 bg-study-success rounded-full mt-2" />
            <div>
              <div className="font-medium text-sm">Horários Produtivos</div>
              <div className="text-xs text-muted-foreground">Quando você aprende melhor</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded">
            <div className="w-2 h-2 bg-study-warning rounded-full mt-2" />
            <div>
              <div className="font-medium text-sm">Risco de Burnout</div>
              <div className="text-xs text-muted-foreground">Alertas para manter equilíbrio</div>
            </div>
          </div>
        </div>
      </div>
    ),
    target: 'analytics'
  },
  {
    id: 'getting-started',
    title: 'Vamos Começar!',
    description: 'Primeiros passos para aproveitar ao máximo o sistema.',
    icon: Zap,
    content: (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <Zap className="h-12 w-12 text-study-primary mx-auto mb-2" />
          <p className="text-muted-foreground">
            Recomendamos seguir estes passos na ordem:
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-study-primary/10 rounded border border-study-primary/20">
            <div className="w-6 h-6 bg-study-primary text-study-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <div className="font-medium text-sm">Configure seu primeiro plano de estudos</div>
              <div className="text-xs text-muted-foreground">Defina matérias, data da prova e horários</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-study-accent/10 rounded border border-study-accent/20">
            <div className="w-6 h-6 bg-study-accent text-study-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <div className="font-medium text-sm">Complete 3-5 sessões de estudo</div>
              <div className="text-xs text-muted-foreground">Para o sistema aprender seus padrões</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-study-success/10 rounded border border-study-success/20">
            <div className="w-6 h-6 bg-study-success text-study-success-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <div className="font-medium text-sm">Ative o sistema de revisões</div>
              <div className="text-xs text-muted-foreground">E veja a mágica acontecer!</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  
  const current = ONBOARDING_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    setIsOpen(false);
    onSkip?.();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <current.icon className="h-5 w-5 text-study-primary" />
              {current.title}
            </DialogTitle>
            <Badge variant="outline">
              {currentStep + 1} de {ONBOARDING_STEPS.length}
            </Badge>
          </div>
          <DialogDescription>
            {current.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {current.content}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso do Tour</span>
            <span>{Math.round(((currentStep + 1) / ONBOARDING_STEPS.length) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-study-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Pular Tour
            </Button>
            {!isFirst && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}
          </div>
          
          <Button onClick={handleNext}>
            {isLast ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Começar a Usar!
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};