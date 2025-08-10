import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TimeTrackingWidget: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timetracking</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Widget de suivi du temps.</p>
      </CardContent>
    </Card>
  );
};

export default TimeTrackingWidget;