/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 *
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageContainer } from '@/components/ui/PageContainer';
import {
  Users,
  Mail,
  CreditCard,
  Shield,
  CheckCircle,
  AlertTriangle,
  Crown,
  User,
  Eye,
  ArrowRight,
  Info
} from 'lucide-react';

export default function TeamManagementGuide() {
  const { t } = useTranslation();

  return (
    <PageContainer variant="default">
      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Gestion d'équipe et invitations
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Guide complet pour inviter et gérer vos collaborateurs sur CassKai
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <Badge variant="secondary">Guide utilisateur</Badge>
            <span>⏱️ 8 min de lecture</span>
            <span>📅 Mis à jour le 7 décembre 2025</span>
          </div>
        </div>

        {/* Introduction */}
        <Alert className="mb-8 bg-blue-50 border-blue-200 dark:bg-blue-900/20">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>Important :</strong> La gestion d'équipe vous permet d'inviter des collaborateurs à accéder à votre entreprise CassKai.
            Chaque membre invité est facturé au propriétaire du compte selon le plan d'abonnement choisi.
          </AlertDescription>
        </Alert>

        {/* Section 1: Résumé du fonctionnement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Résumé du fonctionnement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {/* Étape 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center font-bold text-blue-600">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Le Owner/Admin invite un collaborateur</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Choisit l'email, le rôle et les modules autorisés</li>
                    <li>L'invitation est créée dans la base de données</li>
                    <li>Un email est envoyé avec un lien unique</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              {/* Étape 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center font-bold text-green-600">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Le collaborateur accepte l'invitation</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Clique sur le lien <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/invitation?token=xxx</code></li>
                    <li>Se connecte ou crée un compte avec le même email</li>
                    <li>Clique sur "Accepter l'invitation"</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              {/* Étape 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center font-bold text-purple-600">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Actions automatiques</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 font-semibold">Action</th>
                            <th className="text-left py-2 font-semibold">Détail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="py-3 font-medium text-blue-600">Stripe</td>
                            <td className="py-3 text-gray-600 dark:text-gray-400">
                              +1 siège sur l'abonnement (facturé au pro-rata au Owner)
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 font-medium text-green-600">user_companies</td>
                            <td className="py-3 text-gray-600 dark:text-gray-400">
                              Nouvelle entrée créée pour l'invité avec son rôle et modules
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 font-medium text-purple-600">subscriptions</td>
                            <td className="py-3 text-gray-600 dark:text-gray-400">
                              seats_used incrémenté de 1
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 font-medium text-orange-600">user_invitations</td>
                            <td className="py-3 text-gray-600 dark:text-gray-400">
                              Statut passé à "accepted"
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Les rôles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Les différents rôles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-lg">Owner (Propriétaire)</h4>
                  <Badge className="bg-purple-100 text-purple-800">Vous</Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  ✅ Accès complet à toutes les fonctionnalités<br/>
                  ✅ Gère la facturation et l'abonnement<br/>
                  ✅ Peut inviter et retirer des membres<br/>
                  ✅ Seul à pouvoir supprimer l'entreprise
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <h4 className="font-bold text-lg">Admin (Administrateur)</h4>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  ✅ Accès complet à toutes les fonctionnalités<br/>
                  ✅ Peut inviter et gérer des membres<br/>
                  ✅ Peut modifier tous les paramètres<br/>
                  ❌ Ne peut pas supprimer l'entreprise
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-lg">Manager (Gestionnaire)</h4>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  ✅ Accès aux modules sélectionnés<br/>
                  ✅ Peut créer et modifier des données<br/>
                  ✅ Accès à certains rapports<br/>
                  ❌ Pas d'accès à la gestion d'équipe
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-lg">Member (Membre)</h4>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  ✅ Accès aux modules sélectionnés<br/>
                  ✅ Peut créer des données de base<br/>
                  ❌ Accès limité aux rapports<br/>
                  ❌ Ne peut pas modifier les paramètres
                </p>
              </div>

              <div className="border-l-4 border-gray-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <h4 className="font-bold text-lg">Viewer (Lecteur)</h4>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  ✅ Lecture seule sur tous les modules<br/>
                  ✅ Consultation des rapports<br/>
                  ❌ Ne peut rien créer ou modifier<br/>
                  ❌ Idéal pour les auditeurs ou consultants
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Structure organisationnelle */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Structure de votre équipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 font-mono text-sm">
              <pre className="text-gray-800 dark:text-gray-200">
{`┌─────────────────────────────────────────┐
│       ENTREPRISE (Company)              │
├─────────────────────────────────────────┤
│ 👑 Owner (vous)                         │
│    └── Accès: TOUT                      │
│                                         │
│ 🛡️ Admin invité                         │
│    └── Accès: TOUT (sauf suppr.)       │
│                                         │
│ 👥 Manager invité                       │
│    └── Accès: Facturation, Compta      │
│                                         │
│ 👤 Member invité                        │
│    └── Accès: Facturation uniquement   │
│                                         │
│ 👁️ Viewer invité                        │
│    └── Accès: Lecture seule            │
└─────────────────────────────────────────┘`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Facturation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Facturation et sièges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20">
              <CreditCard className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <strong>Comment ça marche :</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Le Owner paie pour tous les sièges de l'équipe</li>
                  <li>Chaque nouveau membre = +prix du plan/mois</li>
                  <li>Facturation <strong>au pro-rata</strong> (si ajouté en milieu de mois, seuls les jours restants sont facturés)</li>
                  <li>Un utilisateur invité ne paie rien - tout est facturé au Owner</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Exemple de facturation
              </h4>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p>📅 Votre plan : <strong>Pro à 29€/mois</strong> (1 siège inclus)</p>
                <p>👤 Vous invitez un Admin le 15 du mois (15 jours restants)</p>
                <p>💶 Coût supplémentaire : <strong>~14,50€</strong> pour ce mois (pro-rata)</p>
                <p>💳 Prochain mois : <strong>58€</strong> (29€ × 2 sièges)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Points importants */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Points importants à retenir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert>
                <AlertDescription>
                  <strong>✅ Multi-entreprises :</strong> Un utilisateur peut être invité dans plusieurs entreprises CassKai.
                  Il aura alors accès à plusieurs sociétés depuis son compte unique.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertDescription>
                  <strong>✅ Retrait de membres :</strong> Le Owner peut retirer un membre à tout moment.
                  Le siège sera libéré et déduit de la prochaine facture.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertDescription>
                  <strong>✅ Sécurité :</strong> Les invitations expirent après 7 jours.
                  L'email de l'invité doit correspondre exactement pour accepter l'invitation.
                </AlertDescription>
              </Alert>

              <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-900/20">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-orange-900 dark:text-orange-100">
                  <strong>⚠️ Attention :</strong> Assurez-vous d'avoir suffisamment de sièges disponibles avant d'inviter.
                  Chaque invitation consomme un siège de votre abonnement.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Guide pas à pas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Comment inviter un collaborateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Accéder à la gestion d'équipe
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-8">
                  <li>Allez dans <strong>Paramètres → Équipe</strong></li>
                  <li>Ou accédez directement à <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/team</code></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Vérifier les sièges disponibles
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-8">
                  <li>Consultez la carte "Sièges" en haut de page</li>
                  <li>Vérifiez que vous avez au moins 1 siège disponible</li>
                  <li>Si besoin, augmentez votre abonnement</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Envoyer l'invitation
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-8">
                  <li>Cliquez sur le bouton <strong>"Inviter un membre"</strong></li>
                  <li>Saisissez l'adresse email du collaborateur</li>
                  <li>Choisissez son rôle (Admin, Manager, Member, Viewer)</li>
                  <li>Si Manager ou Member, sélectionnez les modules autorisés</li>
                  <li>Validez l'invitation</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                  Suivi de l'invitation
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-8">
                  <li>L'invitation apparaît dans "Invitations en attente"</li>
                  <li>Vous pouvez renvoyer l'email si besoin</li>
                  <li>Vous pouvez annuler l'invitation avant acceptation</li>
                  <li>L'invitation expire après 7 jours</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Besoin d'aide supplémentaire ?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Notre équipe support est disponible pour vous accompagner dans la gestion de votre équipe.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/help"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contacter le support
            </a>
            <a
              href="/team"
              className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Users className="w-5 h-5 mr-2" />
              Gérer mon équipe
            </a>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
