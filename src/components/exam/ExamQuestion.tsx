import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import type { Question } from '@/types/battle';

interface ExamQuestionProps {
  question: Question;
  onSubmitAnswer: (selectedAnswer: string) => void;
  shuffleOptions?: boolean;
}

export function ExamQuestion({ question, onSubmitAnswer, shuffleOptions = false }: ExamQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [options, setOptions] = useState(question.options || []);

  useEffect(() => {
    // Reset selection when question changes
    setSelectedAnswer('');
    
    // Shuffle options if enabled
    if (shuffleOptions && question.options) {
      const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
      setOptions(shuffledOptions);
    } else {
      setOptions(question.options || []);
    }
  }, [question.id, shuffleOptions]);

  const handleSubmit = () => {
    if (selectedAnswer) {
      onSubmitAnswer(selectedAnswer);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge className={getDifficultyColor(question.difficulty)}>
              {getDifficultyLabel(question.difficulty)}
            </Badge>
            
            {question.topicName && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                {question.topicName}
              </div>
            )}
          </div>

          {(question.examiningBoard || question.examYear) && (
            <div className="flex flex-wrap gap-2">
              {question.examiningBoard && (
                <Badge variant="outline" className="text-xs">
                  {question.examiningBoard}
                </Badge>
              )}
              {question.examYear && (
                <Badge variant="outline" className="text-xs">
                  {question.examYear}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <CardTitle className="text-lg leading-relaxed">
          {question.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Question Content */}
        <div className="prose prose-sm max-w-none">
          <div 
            className="whitespace-pre-wrap text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: question.content }}
          />
        </div>

        {/* Images */}
        {question.images && question.images.length > 0 && (
          <div className="grid gap-4">
            {question.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Imagem da questão ${index + 1}`}
                className="max-w-full h-auto rounded-lg border"
              />
            ))}
          </div>
        )}

        {/* Options */}
        {options.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-study-text">Alternativas:</h4>
            <RadioGroup
              value={selectedAnswer}
              onValueChange={setSelectedAnswer}
              className="space-y-3"
            >
              {options.map((option, index) => (
                <div 
                  key={option.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedAnswer(option.content)}
                >
                  <RadioGroupItem 
                    value={option.content} 
                    id={option.id}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer leading-relaxed"
                  >
                    <span className="font-medium mr-2">
                      {String.fromCharCode(65 + index)})
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: option.content }} />
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Additional Info */}
        {(question.position || question.institution) && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-4">
            {question.position && (
              <span>Cargo: {question.position}</span>
            )}
            {question.institution && (
              <span>Instituição: {question.institution}</span>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            size="lg"
            className="min-w-32"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}