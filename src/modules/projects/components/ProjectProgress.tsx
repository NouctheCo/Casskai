import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProjectProgress: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progression</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Indicateur de progression des projets.</p>
      </CardContent>
    </Card>
  );
};

export default ProjectProgress;