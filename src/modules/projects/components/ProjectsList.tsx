import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, Clock, DollarSign } from 'lucide-react';

const ProjectsList: React.FC = () => {
  const mockProjects = [
    {
      id: '1',
      name: 'Site E-commerce Client A',
      status: 'active',
      progress: 65,
      budget: 15000,
      spent: 9750,
      team: 4,
      deadline: '2024-09-15'
    },
    {
      id: '2', 
      name: 'App Mobile Client B',
      status: 'planning',
      progress: 15,
      budget: 25000,
      spent: 3750,
      team: 6,
      deadline: '2024-12-01'
    },
    {
      id: '3',
      name: 'Refonte ERP Client C',
      status: 'completed',
      progress: 100,
      budget: 45000,
      spent: 43200,
      team: 8,
      deadline: '2024-07-30'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'En cours';
      case 'planning': return 'Planification';  
      case 'completed': return 'Terminé';
      case 'on_hold': return 'En pause';
      default: return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
          <p className="text-gray-600">Gérez tous vos projets en cours</p>
        </div>
        <Button>
          <Briefcase className="w-4 h-4 mr-2" />
          Nouveau Projet
        </Button>
      </div>

      <div className="grid gap-6">
        {mockProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progression</span>
                    <span className="text-sm text-gray-600">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Budget</p>
                      <p className="text-sm font-medium">{project.budget.toLocaleString()}€</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="text-xs text-gray-500">Dépensé</p>
                      <p className="text-sm font-medium">{project.spent.toLocaleString()}€</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Équipe</p>
                      <p className="text-sm font-medium">{project.team} personnes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-500">Deadline</p>
                      <p className="text-sm font-medium">
                        {new Date(project.deadline).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm">Voir Détails</Button>
                  <Button variant="outline" size="sm">Timesheet</Button>
                  <Button variant="outline" size="sm">Rapports</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectsList;