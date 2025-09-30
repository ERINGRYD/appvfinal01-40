import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Clock, Award, TrendingUp, Swords, Home } from 'lucide-react';
import { ColiseumReport } from '@/types/coliseum';
import { useNavigate } from 'react-router-dom';

interface VictoryReportProps {
  report: ColiseumReport;
  onBackToArena: () => void;
}

const VictoryReport: React.FC<VictoryReportProps> = ({ report, onBackToArena }) => {
  const navigate = useNavigate();
  const [displayedXP, setDisplayedXP] = useState(0);

  useEffect(() => {
    // Animação de contador de XP
    const duration = 2000;
    const steps = 60;
    const increment = report.xpEarned / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= report.xpEarned) {
        setDisplayedXP(report.xpEarned);
        clearInterval(timer);
      } else {
        setDisplayedXP(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [report.xpEarned]);

  const modeNames = {
    skirmish: 'Escaramuça',
    total_war: 'Guerra Total',
    rescue_operation: 'Operação Resgate'
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 70) return 'text-blue-600';
    if (accuracy >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho de Vitória */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500" />
        
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="relative">
              <Trophy className="h-24 w-24 text-yellow-500 animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-yellow-500/50 animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Vitória Gloriosa!
            </h1>
            <p className="text-xl text-muted-foreground">
              {report.classification}
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {modeNames[report.mode]}
            </Badge>
          </div>

          <div className="pt-4">
            <div className="text-sm text-muted-foreground mb-2">XP Conquistado</div>
            <div className="text-6xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              +{displayedXP}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getGradeColor(report.accuracyRate)}`}>
              {report.accuracyRate.toFixed(1)}%
            </div>
            <Progress value={report.accuracyRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {report.correctAnswers} de {report.totalQuestions} questões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatTime(report.totalTime)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Tempo médio: {formatTime(Math.floor(report.totalTime / report.totalQuestions))} por questão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Total</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              +{report.xpEarned}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Experiência conquistada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Matéria */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Matéria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(report.performanceBySubject).map(([subject, stats]) => (
            <div key={subject} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{subject}</span>
                <span className={`font-bold ${getGradeColor(stats.accuracy)}`}>
                  {stats.accuracy.toFixed(1)}%
                </span>
              </div>
              <Progress value={stats.accuracy} />
              <p className="text-xs text-muted-foreground">
                {stats.correct} de {stats.total} questões corretas
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance por Dificuldade */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Dificuldade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(report.performanceByDifficulty).map(([difficulty, stats]) => (
              <div key={difficulty} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Médio' : 'Difícil'}
                  </Badge>
                  <span className={`font-bold ${getGradeColor(stats.accuracy)}`}>
                    {stats.accuracy.toFixed(1)}%
                  </span>
                </div>
                <Progress value={stats.accuracy} />
                <p className="text-xs text-muted-foreground">
                  {stats.correct}/{stats.total}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-4">
        <Button
          onClick={onBackToArena}
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90"
          size="lg"
        >
          <Swords className="h-5 w-5 mr-2" />
          Nova Batalha
        </Button>
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          size="lg"
        >
          <Home className="h-5 w-5 mr-2" />
          Dashboard
        </Button>
      </div>
    </div>
  );
};

export default VictoryReport;
