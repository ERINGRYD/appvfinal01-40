import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FlashcardResponse } from '@/types/flashcard';
import { RotateCcw, SkipForward, CheckCircle, XCircle } from 'lucide-react';

interface FlashcardControlsProps {
  isFlipped: boolean;
  onFlip: () => void;
  onResponse: (response: FlashcardResponse) => void;
  currentIndex: number;
  totalCards: number;
  correctCount: number;
  disabled?: boolean;
}

export function FlashcardControls({ 
  isFlipped, 
  onFlip, 
  onResponse, 
  currentIndex, 
  totalCards, 
  correctCount,
  disabled = false 
}: FlashcardControlsProps) {
  const progress = ((currentIndex) / totalCards) * 100;

  const responseButtons = [
    {
      key: 'again' as FlashcardResponse,
      label: 'Novamente',
      description: 'Muito difícil',
      color: 'bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200',
      icon: XCircle
    },
    {
      key: 'hard' as FlashcardResponse,
      label: 'Difícil',
      description: 'Difícil de lembrar',
      color: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200',
      icon: RotateCcw
    },
    {
      key: 'good' as FlashcardResponse,
      label: 'Bom',
      description: 'Consegui lembrar',
      color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200',
      icon: CheckCircle
    },
    {
      key: 'easy' as FlashcardResponse,
      label: 'Fácil',
      description: 'Muito fácil',
      color: 'bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200',
      icon: CheckCircle
    }
  ];

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Progresso: {currentIndex} / {totalCards}
            </span>
            <span className="text-sm text-muted-foreground">
              {correctCount} corretas
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          {!isFlipped ? (
            // Show answer button
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Pense na resposta e clique para revelar
              </p>
              <Button 
                onClick={onFlip}
                disabled={disabled}
                size="lg"
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Mostrar Resposta
              </Button>
            </div>
          ) : (
            // Response buttons
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Como foi sua resposta?
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {responseButtons.map((button) => {
                  const Icon = button.icon;
                  return (
                    <Button
                      key={button.key}
                      variant="outline"
                      disabled={disabled}
                      onClick={() => onResponse(button.key)}
                      className={`h-auto p-4 flex flex-col gap-2 transition-all ${button.color}`}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{button.label}</div>
                        <div className="text-xs opacity-70">{button.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
              
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFlip}
                  disabled={disabled}
                  className="gap-2 text-muted-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Ver pergunta novamente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}