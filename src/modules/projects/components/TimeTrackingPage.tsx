import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TimeTrackingPage: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Timetracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Interface de timetracking en développement.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTrackingPage;