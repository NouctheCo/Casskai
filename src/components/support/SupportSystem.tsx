// components/SupportSystem.tsx
import React, { useState } from 'react';
import { MessageCircle, HelpCircle, Book, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SupportSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [supportType, setSupportType] = useState<'chat' | 'ticket' | 'docs'>('chat');
  
  const faqItems = [
    {
      question: "Comment configurer mon instance Supabase ?",
      answer: "Créez un projet sur supabase.com, puis copiez l'URL et la clé API dans la configuration Casskai."
    },
    {
      question: "Puis-je utiliser Casskai hors ligne ?",
      answer: "Casskai nécessite une connexion internet pour synchroniser avec Supabase. Mode hors ligne prévu dans une future version."
    },
    {
      question: "Comment importer mes données existantes ?",
      answer: "Utilisez l'outil d'import FEC dans Paramètres > Import/Export pour les données comptables françaises."
    },
    {
      question: "Quels pays sont supportés ?",
      answer: "Actuellement: Bénin, Côte d'Ivoire, Sénégal (SYSCOHADA) et France (PCG). D'autres pays en préparation."
    }
  ];

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl border z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Support Casskai</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          ✕
        </Button>
      </div>

      <div className="flex border-b">
        {[
          { key: 'chat', label: 'Chat', icon: MessageCircle },
          { key: 'ticket', label: 'Ticket', icon: Mail },
          { key: 'docs', label: 'FAQ', icon: Book }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSupportType(key as any)}
            className={`flex-1 p-3 text-sm font-medium border-b-2 ${
              supportType === key ? 'border-blue-600 text-blue-600' : 'border-transparent'
            }`}
          >
            <Icon className="w-4 h-4 mx-auto mb-1" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4 h-[calc(100%-120px)] overflow-y-auto">
        {supportType === 'chat' && (
          <div>
            <div className="space-y-4 mb-4">
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm">👋 Bonjour ! Comment puis-je vous aider ?</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Tapez votre message..." className="flex-1" />
              <Button size="sm">Envoyer</Button>
            </div>
          </div>
        )}

        {supportType === 'ticket' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Sujet</label>
              <Input placeholder="Décrivez brièvement votre problème" />
            </div>
            <div>
              <label className="text-sm font-medium">Priorité</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                placeholder="Décrivez votre problème en détail..."
                rows={6}
              />
            </div>
            <Button className="w-full">Envoyer le ticket</Button>
          </div>
        )}

        {supportType === 'docs' && (
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {item.answer}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
            
            <Button variant="outline" className="w-full">
              📖 Documentation complète
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
