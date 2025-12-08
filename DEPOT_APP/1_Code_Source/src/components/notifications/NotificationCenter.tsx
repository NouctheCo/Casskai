import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ScrollArea } from '@/components/ui/scroll-area';

import { useAuth } from '@/contexts/AuthContext';

import { notificationService, Notification } from '@/services/notificationService';

import {

  Bell,

  BellRing,

  Check,

  CheckCheck,

  X,

  AlertCircle,

  CheckCircle,

  Info,

  AlertTriangle,

  ExternalLink,

  Clock,

  Zap,

  DollarSign,

  Settings

} from 'lucide-react';



const getNotificationIcon = (type: string, category: string) => {

  // Par catégorie d'abord

  switch (category) {

    case 'automation':

      return <Zap className="h-4 w-4" />;

    case 'finance':

      return <DollarSign className="h-4 w-4" />;

    case 'workflow':

      return <Settings className="h-4 w-4" />;

    case 'reminder':

      return <Clock className="h-4 w-4" />;

    default:

      // Par type si pas de catégorie spécifique

      switch (type) {

        case 'error':

          return <AlertCircle className="h-4 w-4" />;

        case 'warning':

          return <AlertTriangle className="h-4 w-4" />;

        case 'success':

          return <CheckCircle className="h-4 w-4" />;

        default:

          return <Info className="h-4 w-4" />;

      }

  }

};



const getNotificationColor = (type: string) => {

  switch (type) {

    case 'error':

      return 'text-red-500';

    case 'warning':

      return 'text-yellow-500';

    case 'success':

      return 'text-green-500';

    default:

      return 'text-blue-500';

  }

};



// Priority color function removed - not applicable to new notification structure



const formatDate = (dateString: string) => {

  const date = new Date(dateString);

  const now = new Date();

  const diffMs = now.getTime() - date.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  const diffHours = Math.floor(diffMinutes / 60);

  const diffDays = Math.floor(diffHours / 24);



  if (diffMinutes < 1) return 'À l\'instant';

  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;

  if (diffHours < 24) return `Il y a ${diffHours}h`;

  if (diffDays < 7) return `Il y a ${diffDays}j`;



  return date.toLocaleDateString('fr-FR', {

    day: 'numeric',

    month: 'short',

    hour: '2-digit',

    minute: '2-digit'

  });

};



interface NotificationCenterProps {

  isOpen: boolean;

  onClose: () => void;

}



export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {

  const { currentCompany, user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');



  // Chargement des notifications

  const loadNotifications = async () => {

    if (!user?.id || loading) return;



    setLoading(true);

    try {

      const result = await notificationService.getNotifications(

        user.id,

        {

          limit: 50,

          category: selectedCategory === 'all' ? undefined : selectedCategory

        }

      );



      if (result.success && result.data) {

        setNotifications(result.data);

      }

    } catch (error) {

      console.error('Erreur chargement notifications:', error instanceof Error ? error.message : String(error));

    } finally {

      setLoading(false);

    }

  };



  // Chargement du compteur non-lus

  const loadUnreadCount = async () => {

    if (!currentCompany?.id) return;



    try {

      const result = await notificationService.getUnreadCount(

        user.id

      );



      if (result.success && result.data !== undefined) {

        setUnreadCount(result.data);

      }

    } catch (error) {

      console.error('Erreur comptage notifications:', error instanceof Error ? error.message : String(error));

    }

  };



  useEffect(() => {

    if (isOpen) {

      loadNotifications();

      loadUnreadCount();

    }

  }, [isOpen, selectedCategory, currentCompany?.id, user?.id]);



  // Marquer comme lu

  const markAsRead = async (notification: Notification) => {

    if (notification.read) return;



    try {

      const result = await notificationService.markAsRead(notification.id);

      if (result.success) {

        setNotifications(prev =>

          prev.map(n =>

            n.id === notification.id

              ? { ...n, is_read: true, read_at: new Date().toISOString() }

              : n

          )

        );

        setUnreadCount(prev => Math.max(0, prev - 1));

      }

    } catch (error) {

      console.error('Erreur marquage lu:', error instanceof Error ? error.message : String(error));

    }

  };



  // Marquer tout comme lu

  const markAllAsRead = async () => {

    if (!currentCompany?.id) return;



    try {

      const result = await notificationService.markAllAsRead(

        user.id

      );



      if (result.success) {

        setNotifications(prev =>

          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))

        );

        setUnreadCount(0);

      }

    } catch (error) {

      console.error('Erreur marquage global:', error instanceof Error ? error.message : String(error));

    }

  };



  // Supprimer une notification

  const deleteNotification = async (notificationId: string) => {

    try {

      const result = await notificationService.deleteNotification(notificationId);

      if (result.success) {

        setNotifications(prev => prev.filter(n => n.id !== notificationId));

      }

    } catch (error) {

      console.error('Erreur suppression notification:', error instanceof Error ? error.message : String(error));

    }

  };



  // Gérer l'action d'une notification

  const handleAction = (notification: Notification) => {

    if ((notification as any).action_url) {

      // Marquer comme lu puis naviguer

      markAsRead(notification);

      window.location.href = (notification as any).action_url;

    }

  };



  const categories = [

    { key: 'all', label: 'Toutes', icon: Bell },

    { key: 'automation', label: 'Automation', icon: Zap },

    { key: 'finance', label: 'Finance', icon: DollarSign },

    { key: 'workflow', label: 'Workflows', icon: Settings },

    { key: 'reminder', label: 'Rappels', icon: Clock }

  ];



  const filteredNotifications = notifications.filter(n => {

    if (selectedCategory === 'all') return true;

    return n.category === selectedCategory;

  });



  if (!isOpen) return null;



  return (

    <motion.div

      initial={{ opacity: 0, y: -20 }}

      animate={{ opacity: 1, y: 0 }}

      exit={{ opacity: 0, y: -20 }}

      className="fixed top-16 right-4 w-96 z-50"

    >

      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 dark:bg-gray-900">

        <CardHeader className="pb-3">

          <div className="flex items-center justify-between">

            <CardTitle className="flex items-center gap-2">

              <BellRing className="h-5 w-5" />

              Notifications

              {unreadCount > 0 && (

                <Badge variant="destructive" className="ml-2">

                  {unreadCount}

                </Badge>

              )}

            </CardTitle>

            <div className="flex items-center gap-2">

              {unreadCount > 0 && (

                <Button

                  variant="ghost"

                  size="sm"

                  onClick={markAllAsRead}

                  className="text-xs"

                >

                  <CheckCheck className="h-3 w-3 mr-1" />

                  Tout lire

                </Button>

              )}

              <Button variant="ghost" size="sm" onClick={onClose}>

                <X className="h-4 w-4" />

              </Button>

            </div>

          </div>



          {/* Filtres par catégorie */}

          <div className="flex gap-1 mt-3">

            {categories.map(category => {

              const Icon = category.icon;

              const count = category.key === 'all'

                ? notifications.length

                : notifications.filter(n => n.category === category.key).length;



              return (

                <Button

                  key={category.key}

                  variant={selectedCategory === category.key ? 'default' : 'ghost'}

                  size="sm"

                  onClick={() => setSelectedCategory(category.key)}

                  className="flex items-center gap-1 text-xs"

                >

                  <Icon className="h-3 w-3" />

                  {category.label}

                  {count > 0 && <span className="text-xs">({count})</span>}

                </Button>

              );

            })}

          </div>

        </CardHeader>



        <CardContent className="p-0">

          <ScrollArea className="h-96">

            <AnimatePresence>

              {loading ? (

                <div className="p-4 text-center text-gray-500 dark:text-gray-400">

                  Chargement...

                </div>

              ) : filteredNotifications.length === 0 ? (

                <div className="p-4 text-center text-gray-500 dark:text-gray-400">

                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />

                  Aucune notification

                </div>

              ) : (

                filteredNotifications.map((notification) => (

                  <motion.div

                    key={notification.id}

                    initial={{ opacity: 0, x: -20 }}

                    animate={{ opacity: 1, x: 0 }}

                    exit={{ opacity: 0, x: 20 }}

                    className={`

                      border-l-4 p-4 border-b border-gray-100 dark:border-gray-800

                      hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer

                      transition-colors duration-200

                      ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-950/50' : ''}

                    `}

                    onClick={() => markAsRead(notification)}

                  >

                    <div className="flex items-start gap-3">

                      <div className={`flex-shrink-0 mt-0.5 ${getNotificationColor(notification.type)}`}>

                        {getNotificationIcon(notification.type, notification.category)}

                      </div>



                      <div className="flex-1 min-w-0">

                        <div className="flex items-start justify-between gap-2">

                          <div>

                            <h4 className={`

                              text-sm font-medium text-gray-900 dark:text-gray-100

                              ${!notification.read ? 'font-semibold' : ''}

                            `}>

                              {notification.title}

                              {!notification.read && (

                                <div className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2 dark:bg-blue-900/20" />

                              )}

                            </h4>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">

                              {notification.message}

                            </p>

                          </div>



                          <div className="flex items-center gap-1">

                            {!notification.read && (

                              <Button

                                variant="ghost"

                                size="sm"

                                onClick={(e) => {

                                  e.stopPropagation();

                                  markAsRead(notification);

                                }}

                                className="h-6 w-6 p-0"

                              >

                                <Check className="h-3 w-3" />

                              </Button>

                            )}

                            <Button

                              variant="ghost"

                              size="sm"

                              onClick={(e) => {

                                e.stopPropagation();

                                deleteNotification(notification.id);

                              }}

                              className="h-6 w-6 p-0 text-red-500 hover:text-red-600 dark:text-red-400"

                            >

                              <X className="h-3 w-3" />

                            </Button>

                          </div>

                        </div>



                        <div className="flex items-center justify-between mt-2">

                          <div className="flex items-center gap-2">

                            <Badge variant="outline" className="text-xs">

                              {notification.category}

                            </Badge>

                            <span className="text-xs text-gray-500 dark:text-gray-400">

                              {formatDate(notification.created_at)}

                            </span>

                          </div>



                          {(notification as any).action_url && (

                            <Button

                              variant="ghost"

                              size="sm"

                              onClick={(e) => {

                                e.stopPropagation();

                                handleAction(notification);

                              }}

                              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"

                            >

                              {(notification as any).action_label || 'Voir'}

                              <ExternalLink className="h-3 w-3" />

                            </Button>

                          )}

                        </div>

                      </div>

                    </div>

                  </motion.div>

                ))

              )}

            </AnimatePresence>

          </ScrollArea>

        </CardContent>

      </Card>

    </motion.div>

  );

}



// Hook pour gérer le centre de notifications

export function useNotificationCenter() {

  const [isOpen, setIsOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  const { currentCompany, user } = useAuth();



  // Charger le compteur au démarrage

  useEffect(() => {

    if (currentCompany?.id) {

      loadUnreadCount();

    }

  }, [currentCompany?.id, user?.id]);



  const loadUnreadCount = async () => {

    if (!currentCompany?.id) return;



    try {

      const result = await notificationService.getUnreadCount(

        user.id

      );



      if (result.success && result.data !== undefined) {

        setUnreadCount(result.data);

      }

    } catch (error) {

      console.error('Erreur comptage notifications:', error instanceof Error ? error.message : String(error));

    }

  };



  return {

    isOpen,

    setIsOpen,

    unreadCount,

    refreshUnreadCount: loadUnreadCount

  };

}

