import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductivityReports } from '@/components/analytics/ProductivityReports';
import { StudyPatterns } from '@/components/analytics/StudyPatterns';
import { InsightsPanel } from '@/components/analytics/InsightsPanel';
import Statistics from '@/components/Statistics';
import { StudySession } from '@/types/study';
import { PerformanceMetric } from '@/db/crud/performanceMetrics';
import { loadStudySessionsData } from '@/utils/sqlitePersistence';
import { loadPerformanceMetrics } from '@/db/crud/performanceMetrics';
import { useStudyContext } from '@/contexts/StudyContext';
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Download,
  Calendar,
  Clock,
  Target,
  Zap,
  PieChart
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedAnalytics() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetExamDate, setTargetExamDate] = useState<Date | undefined>();
  
  const { subjects } = useStudyContext();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading analytics data...');
      
      // Load study sessions
      const sessionData = loadStudySessionsData();
      console.log(`📋 Loaded ${sessionData.length} study sessions`);
      setSessions(sessionData);

      // Load performance metrics
      const metricsData = loadPerformanceMetrics();
      console.log(`📈 Loaded ${metricsData.length} performance metrics`);
      setMetrics(metricsData);

      // TODO: Load target exam date from settings or active study plan
      // For now, we'll set it to 3 months from now as an example
      const examDate = new Date();
      examDate.setMonth(examDate.getMonth() + 3);
      setTargetExamDate(examDate);

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    try {
      const reportData = {
        generated: new Date().toISOString(),
        sessions: sessions.length,
        metrics: metrics.length,
        totalStudyTime: sessions.reduce((total, s) => total + s.duration, 0),
        sessionData: sessions,
        metricsData: metrics
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total de Sessões',
      value: sessions.length,
      icon: Clock,
      color: 'text-blue-500'
    },
    {
      title: 'Horas Estudadas',
      value: `${Math.round(sessions.reduce((total, s) => total + s.duration, 0) / 60)}h`,
      icon: Calendar,
      color: 'text-green-500'
    },
    {
      title: 'Matérias Ativas',
      value: new Set(sessions.map(s => s.subject)).size,
      icon: Target,
      color: 'text-purple-500'
    },
    {
      title: 'Métricas Coletadas',
      value: metrics.length,
      icon: BarChart3,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Avançadas</h1>
            <p className="text-muted-foreground">
              Análise detalhada do seu desempenho e padrões de estudo
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button onClick={loadData} variant="outline" size="sm">
              Atualizar Dados
            </Button>
            <Button onClick={exportReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="statistics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Estatísticas</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Padrões</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statistics" className="space-y-6">
            <Statistics studySessions={sessions} subjects={subjects} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ProductivityReports sessions={sessions} metrics={metrics} />
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <StudyPatterns sessions={sessions} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <InsightsPanel 
              sessions={sessions} 
              metrics={metrics} 
              targetExamDate={targetExamDate}
            />
          </TabsContent>
        </Tabs>

        {/* No Data State */}
        {sessions.length === 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Nenhum Dado Disponível</CardTitle>
              <CardDescription>
                Comece a estudar para ver analytics detalhadas sobre seu progresso
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                Complete algumas sessões de estudo para gerar seus primeiros insights
              </p>
              <Button onClick={() => window.location.href = '/study'}>
                Começar a Estudar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}