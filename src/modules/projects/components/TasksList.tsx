import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TasksList: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tâches</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Liste des tâches du projet.</p>
      </CardContent>
    </Card>
  );
};

export default TasksList;