import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GanttChart: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagramme de Gantt</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Visualisation Gantt des projets.</p>
      </CardContent>
    </Card>
  );
};

export default GanttChart;