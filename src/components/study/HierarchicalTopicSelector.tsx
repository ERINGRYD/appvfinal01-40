
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Play } from 'lucide-react';
import { StudySubject } from '@/types/study';

interface HierarchicalTopicSelectorProps {
  subjects: StudySubject[];
  onStartSession: (subject: string, topic?: string, subtopic?: string) => void;
}

const HierarchicalTopicSelector: React.FC<HierarchicalTopicSelectorProps> = ({
  subjects,
  onStartSession
}) => {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('🔎 HierarchicalTopicSelector: received subjects', {
      count: subjects.length,
      names: subjects.map(s => s.name)
    });
  }, [subjects]);

  const toggleSubject = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Selecionar Tema para Estudar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {subjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">📚 Nenhum tema disponível</p>
              <p className="text-sm">
                Crie um plano de estudos primeiro para selecionar temas.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <a href="/">Ir para Plano de Estudos</a>
                </Button>
              </div>
            </div>
          ) : (
            subjects.map(subject => (
            <div key={subject.id} className="border rounded-lg overflow-hidden">
              <div 
                className="flex items-center justify-between p-3 bg-study-secondary/10 cursor-pointer hover:bg-study-secondary/20 transition-colors"
                onClick={() => toggleSubject(subject.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {expandedSubjects.has(subject.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="font-medium">{subject.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {subject.topics?.length || 0} tópicos
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartSession(subject.name);
                  }}
                  className="flex items-center space-x-1"
                >
                  <Play className="h-3 w-3" />
                  <span>Estudar</span>
                </Button>
              </div>

              {expandedSubjects.has(subject.id) && subject.topics && (
                <div className="p-3 space-y-2">
                  {subject.topics.map(topic => (
                    <div key={topic.id} className="border-l-2 border-study-primary/30 ml-2">
                      <div 
                        className="flex items-center justify-between p-2 pl-4 hover:bg-study-secondary/10 rounded cursor-pointer"
                        onClick={() => toggleTopic(topic.id)}
                      >
                        <div className="flex items-center space-x-2">
                          {topic.subtopics && topic.subtopics.length > 0 && (
                            expandedTopics.has(topic.id) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )
                          )}
                          <span className="text-sm font-medium">{topic.name}</span>
                          {topic.completed && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                              ✓ Completo
                            </Badge>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartSession(subject.name, topic.name);
                          }}
                          className="flex items-center space-x-1 text-xs px-2 py-1"
                        >
                          <Play className="h-3 w-3" />
                          <span>Estudar</span>
                        </Button>
                      </div>

                      {expandedTopics.has(topic.id) && topic.subtopics && (
                        <div className="ml-4 space-y-1">
                          {topic.subtopics.map(subtopic => (
                            <div 
                              key={subtopic.id}
                              className="flex items-center justify-between p-2 hover:bg-study-secondary/10 rounded"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm">{subtopic.name}</span>
                                {subtopic.completed && (
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                    ✓
                                  </Badge>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onStartSession(subject.name, topic.name, subtopic.name)}
                                className="flex items-center space-x-1 text-xs px-2 py-1"
                              >
                                <Play className="h-3 w-3" />
                                <span>Estudar</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HierarchicalTopicSelector;
