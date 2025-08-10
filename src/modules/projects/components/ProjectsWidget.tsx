import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProjectsWidget: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Projets</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Widget projets pour tableau de bord.</p>
      </CardContent>
    </Card>
  );
};

export default ProjectsWidget;