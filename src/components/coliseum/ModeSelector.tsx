import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sword, Trophy, Target, Clock, Zap, Award } from 'lucide-react';
import { ColiseumMode } from '@/types/coliseum';

interface ModeSelectorProps {
  onSelectMode: (mode: ColiseumMode) => void;
  availableEnemiesCount: number;
  redRoomEnemiesCount: number;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ 
  onSelectMode, 
  availableEnemiesCount,
  redRoomEnemiesCount 
}) => {
  const modes = [
    {
      id: 'skirmish' as ColiseumMode,
      title: '⚔️ Escaramuça',
      subtitle: 'Combate Rápido',
      description: 'Aquecimento perfeito para testar suas habilidades',
      questions: '10-20 questões',
      time: '15-30 minutos',
      xp: '+100-150 XP',
      icon: Zap,
      gradient: 'from-blue-500 to-cyan-500',
      disabled: availableEnemiesCount < 10,
      disabledMessage: 'Necessário mínimo de 10 inimigos'
    },
    {
      id: 'total_war' as ColiseumMode,
      title: '🏆 Guerra Total',
      subtitle: 'Combate Épico',
      description: 'Simulação completa de batalha. Prove sua maestria!',
      questions: '50-100 questões',
      time: '2-4 horas',
      xp: '+200-300 XP',
      icon: Trophy,
      gradient: 'from-orange-500 to-red-500',
      disabled: availableEnemiesCount < 25,
      disabledMessage: 'Necessário mínimo de 25 inimigos'
    },
    {
      id: 'rescue_operation' as ColiseumMode,
      title: '🎯 Operação Resgate',
      subtitle: 'Missão Focada',
      description: 'Resgate inimigos da Sala Vermelha e domine-os',
      questions: `${redRoomEnemiesCount} inimigos`,
      time: 'Sem limite',
      xp: '+50 XP/inimigo',
      icon: Target,
      gradient: 'from-red-600 to-rose-600',
      disabled: redRoomEnemiesCount === 0,
      disabledMessage: 'Nenhum inimigo na Sala Vermelha'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
          🏛️ Coliseu Romano
        </h1>
        <p className="text-muted-foreground text-lg">
          Escolha seu combate e prove sua maestria na arena
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          
          return (
            <Card 
              key={mode.id}
              className={`overflow-hidden transition-all hover:shadow-lg ${
                mode.disabled ? 'opacity-60' : 'hover:scale-105'
              }`}
            >
              <div className={`h-2 bg-gradient-to-r ${mode.gradient}`} />
              
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Icon className={`h-8 w-8 bg-gradient-to-r ${mode.gradient} bg-clip-text text-transparent`} />
                  <Award className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div>
                  <CardTitle className="text-2xl">{mode.title}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">{mode.subtitle}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="text-base">{mode.description}</CardDescription>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{mode.questions}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{mode.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-green-600">{mode.xp}</span>
                  </div>
                </div>

                <Button
                  onClick={() => onSelectMode(mode.id)}
                  disabled={mode.disabled}
                  className={`w-full bg-gradient-to-r ${mode.gradient} hover:opacity-90`}
                >
                  {mode.disabled ? mode.disabledMessage : 'Selecionar Modo'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;
