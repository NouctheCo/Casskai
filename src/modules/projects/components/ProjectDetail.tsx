import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProjectDetail: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Détail du Projet</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Composant de détail de projet en développement.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetail;