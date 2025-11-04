import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WhatsAppChat } from '@/components/chat/WhatsAppChat';
import { ArticleData } from './DocumentationArticlesData';

interface DocumentationArticleSidebarProps {
  article: ArticleData;
  onContactSupport: () => void;
}

export const DocumentationArticleSidebar: React.FC<DocumentationArticleSidebarProps> = ({
  article,
  onContactSupport
}) => {
  const navigate = useNavigate();

  return (
    <div className="lg:col-span-1">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Articles liés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {article.relatedArticles?.map((relatedId, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => navigate(`/docs/${relatedId}`)}
              >
                <ArrowRight className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{relatedId.replace(/-/g, ' ')}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Besoin d'aide ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Vous ne trouvez pas la réponse à votre question ?
          </p>
          <WhatsAppChat
            messageType="documentation"
            message={`Bonjour ! J'ai une question sur l'article "${article?.title}" de votre documentation CassKai.`}
            className="w-full mb-3"
          />
          <Button variant="outline" className="w-full" onClick={onContactSupport}>
            Contacter le support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
