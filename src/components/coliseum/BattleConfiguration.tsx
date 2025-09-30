import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Swords, Clock, Target, AlertCircle } from 'lucide-react';
import { ColiseumMode, COLISEUM_QUESTION_COUNTS, COLISEUM_TIME_LIMITS } from '@/types/coliseum';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BattleConfigurationProps {
  mode: ColiseumMode;
  availableSubjects: string[];
  onStartBattle: (questionsCount: number, selectedSubjects: string[]) => void;
  onBack: () => void;
  totalQuestionsAvailable: number;
}

const BattleConfiguration: React.FC<BattleConfigurationProps> = ({
  mode,
  availableSubjects,
  onStartBattle,
  onBack,
  totalQuestionsAvailable
}) => {
  const config = COLISEUM_QUESTION_COUNTS[mode];
  const timeConfig = COLISEUM_TIME_LIMITS[mode];
  
  const [questionsCount, setQuestionsCount] = useState(config.default);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const effectiveMax = Math.min(config.max, totalQuestionsAvailable);
  
  useEffect(() => {
    if (questionsCount > effectiveMax) {
      setQuestionsCount(effectiveMax);
    }
  }, [effectiveMax, questionsCount]);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const estimatedTime = mode === 'rescue_operation' 
    ? 'Sem limite'
    : `${Math.ceil(questionsCount * 1.5)} minutos`;

  const modeInfo = {
    skirmish: {
      title: '⚔️ Escaramuça - Combate Rápido',
      description: 'Configure sua escaramuça rápida',
      gradient: 'from-blue-500 to-cyan-500'
    },
    total_war: {
      title: '🏆 Guerra Total - Combate Épico',
      description: 'Prepare-se para a batalha definitiva',
      gradient: 'from-orange-500 to-red-500'
    },
    rescue_operation: {
      title: '🎯 Operação Resgate - Missão Focada',
      description: 'Configure sua operação de resgate',
      gradient: 'from-red-600 to-rose-600'
    }
  };

  const info = modeInfo[mode];
  const canStart = mode === 'rescue_operation' || questionsCount >= config.min;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${info.gradient}`} />
        
        <CardHeader>
          <CardTitle className="text-2xl">{info.title}</CardTitle>
          <CardDescription className="text-base">{info.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {mode !== 'rescue_operation' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quantidade de Questões</label>
                  <Badge variant="secondary">{questionsCount} questões</Badge>
                </div>
                <Slider
                  value={[questionsCount]}
                  onValueChange={(value) => setQuestionsCount(value[0])}
                  min={config.min}
                  max={effectiveMax}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo: {config.min} • Máximo disponível: {effectiveMax}
                </p>
              </div>
            </div>
          )}

          {availableSubjects.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Filtrar por Matérias (Opcional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableSubjects.map(subject => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject}`}
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={() => toggleSubject(subject)}
                    />
                    <label
                      htmlFor={`subject-${subject}`}
                      className="text-sm cursor-pointer"
                    >
                      {subject}
                    </label>
                  </div>
                ))}
              </div>
              {selectedSubjects.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedSubjects.length} matéria(s) selecionada(s)
                </p>
              )}
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold">Preview do Combate</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Questões
                </span>
                <span className="font-medium">
                  {mode === 'rescue_operation' ? totalQuestionsAvailable : questionsCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tempo Estimado
                </span>
                <span className="font-medium">{estimatedTime}</span>
              </div>
              {selectedSubjects.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span>Matérias</span>
                  <span className="font-medium">{selectedSubjects.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {!canStart && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Necessário mínimo de {config.min} questões para iniciar
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={() => onStartBattle(questionsCount, selectedSubjects)}
            disabled={!canStart}
            className={`w-full bg-gradient-to-r ${info.gradient} hover:opacity-90 text-lg py-6`}
          >
            <Swords className="h-5 w-5 mr-2" />
            Iniciar Combate Épico!
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BattleConfiguration;
