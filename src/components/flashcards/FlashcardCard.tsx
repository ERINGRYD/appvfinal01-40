import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import { FlashcardQuestion } from '@/types/flashcard';
import { cn } from '@/lib/utils';

interface FlashcardCardProps {
  flashcard: FlashcardQuestion;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
}

export function FlashcardCard({ flashcard, isFlipped, onFlip, className }: FlashcardCardProps) {
  const difficultyColors = {
    easy: 'bg-green-500/10 text-green-700 dark:text-green-400',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    hard: 'bg-red-500/10 text-red-700 dark:text-red-400'
  };

  const difficultyLabels = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil'
  };

  return (
    <Card 
      className={cn(
        "relative min-h-[300px] cursor-pointer transition-all duration-500 hover:shadow-lg",
        "bg-gradient-to-br from-background to-muted/20",
        isFlipped && "shadow-xl",
        className
      )}
      onClick={onFlip}
    >
      <CardContent className="p-8 h-full flex flex-col justify-between min-h-[300px]">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-2">
            <Badge variant="secondary" className={difficultyColors[flashcard.difficulty]}>
              {difficultyLabels[flashcard.difficulty]}
            </Badge>
            {flashcard.examiningBoard && (
              <Badge variant="outline" className="text-xs">
                {flashcard.examiningBoard}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-50 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onFlip();
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="space-y-4">
            {!isFlipped ? (
              // Question side
              <>
                <div className="text-sm text-muted-foreground font-medium mb-2">
                  PERGUNTA
                </div>
                <p className="text-lg leading-relaxed">
                  {flashcard.question}
                </p>
              </>
            ) : (
              // Answer side
              <>
                <div className="text-sm text-muted-foreground font-medium mb-2">
                  RESPOSTA
                </div>
                <p className="text-lg leading-relaxed text-foreground">
                  {flashcard.answer}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-6">
          <div className="flex gap-2">
            {flashcard.tags?.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {flashcard.tags && flashcard.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{flashcard.tags.length - 2}
              </Badge>
            )}
          </div>
          
          <div className="text-xs space-x-2">
            {flashcard.totalReviews > 0 && (
              <span>
                {flashcard.totalReviews} revisões
              </span>
            )}
            {flashcard.streakCount > 0 && (
              <span className="text-green-600">
                {flashcard.streakCount}🔥
              </span>
            )}
          </div>
        </div>

        {/* Images preview */}
        {flashcard.images && flashcard.images.length > 0 && (
          <div className="mt-4 flex gap-2 justify-center">
            {flashcard.images.slice(0, 3).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Flashcard image ${index + 1}`}
                className="w-16 h-16 object-cover rounded-md border"
              />
            ))}
            {flashcard.images.length > 3 && (
              <div className="w-16 h-16 bg-muted rounded-md border flex items-center justify-center text-xs">
                +{flashcard.images.length - 3}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}