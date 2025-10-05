import React from 'react';
import { Check, X, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

/**
 * Pricing Section - Tableau comparatif des tarifs
 * 4 plans : Gratuit, Essentiel, Pro, Enterprise
 */

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    tagline: 'Pour découvrir',
    price: 0,
    currency: 'XOF',
    period: 'mois',
    description: 'Parfait pour tester CassKai sans engagement',
    features: [
      { text: '1 utilisateur', included: true },
      { text: '1 entreprise', included: true },
      { text: '50 transactions/mois', included: true },
      { text: 'Factures et devis', included: true },
      { text: '500 MB stockage', included: true },
      { text: 'Support email (48h)', included: true },
      { text: 'Filigrane sur documents', included: true, isLimitation: true },
      { text: 'Données conservées 90 jours', included: true, isLimitation: true },
      { text: 'Rapports avancés', included: false },
      { text: 'Multi-utilisateurs', included: false },
      { text: 'API REST', included: false },
    ],
    cta: 'Commencer gratuitement',
    ctaVariant: 'outline' as const,
    popular: false,
  },
  {
    id: 'essential',
    name: 'Essentiel',
    tagline: 'Pour indépendants',
    price: 15000,
    currency: 'XOF',
    period: 'mois',
    description: 'Idéal pour freelances et micro-entreprises',
    features: [
      { text: '3 utilisateurs', included: true },
      { text: '2 entreprises', included: true },
      { text: 'Transactions illimitées', included: true },
      { text: 'Factures et devis illimités', included: true },
      { text: '5 GB stockage', included: true },
      { text: 'Support email (24h)', included: true },
      { text: 'Sans filigrane', included: true },
      { text: 'Conservation illimitée', included: true },
      { text: 'Rapports standard', included: true },
      { text: 'Synchronisation bancaire', included: true },
      { text: 'Export FEC', included: true },
      { text: 'Relances automatiques', included: true },
      { text: 'API REST', included: false },
      { text: 'Support prioritaire', included: false },
    ],
    cta: 'Essayer 14 jours',
    ctaVariant: 'default' as const,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Pour PME',
    price: 40000,
    currency: 'XOF',
    period: 'mois',
    description: 'Solution complète pour petites et moyennes entreprises',
    features: [
      { text: '10 utilisateurs', included: true },
      { text: '5 entreprises', included: true },
      { text: 'Tout Essentiel inclus', included: true },
      { text: '50 GB stockage', included: true },
      { text: 'Support prioritaire (4h)', included: true },
      { text: 'Rapports avancés', included: true },
      { text: 'Gestion de stock', included: true },
      { text: 'Multi-devises', included: true },
      { text: 'RH et paie', included: true },
      { text: 'CRM intégré', included: true },
      { text: 'Projets et budgets', included: true },
      { text: 'Facturation électronique', included: true },
      { text: 'Workflows personnalisés', included: true },
      { text: 'Formation en ligne', included: true },
      { text: 'API REST (10K appels/mois)', included: true },
    ],
    cta: 'Essayer 14 jours',
    ctaVariant: 'default' as const,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Pour grandes entreprises',
    price: null, // Sur devis
    currency: 'XOF',
    period: 'mois',
    description: 'Solution sur mesure avec accompagnement dédié',
    features: [
      { text: 'Utilisateurs illimités', included: true },
      { text: 'Entreprises illimitées', included: true },
      { text: 'Tout Pro inclus', included: true },
      { text: 'Stockage illimité', included: true },
      { text: 'Support dédié 24/7', included: true },
      { text: 'Chef de projet dédié', included: true },
      { text: 'Formation sur site', included: true },
      { text: 'Intégrations personnalisées', included: true },
      { text: 'API illimitée', included: true },
      { text: 'SLA 99.9%', included: true },
      { text: 'Hébergement dédié (option)', included: true },
      { text: 'Développement sur mesure', included: true },
      { text: 'Audit comptable annuel', included: true },
      { text: 'Conformité SOC 2', included: true },
    ],
    cta: 'Nous contacter',
    ctaVariant: 'outline' as const,
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Des tarifs simples et transparents
          </h2>
          <p className="text-xl text-gray-600">
            Choisissez le plan qui correspond à vos besoins. Changez ou annulez à tout moment.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-xl ${
                plan.popular
                  ? 'border-purple-500 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Plus populaire</span>
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{plan.tagline}</p>

                  {/* Price */}
                  <div className="flex items-baseline mb-2">
                    {plan.price === null ? (
                      <span className="text-3xl font-bold text-gray-900">Sur devis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900">
                          {formatCurrency(plan.price, plan.currency)}
                        </span>
                        <span className="ml-2 text-gray-600">/{plan.period}</span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>

                {/* CTA Button */}
                <Link to={plan.price === null ? '/contact' : '/signup'}>
                  <Button
                    className={`w-full mb-6 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600'
                        : ''
                    }`}
                    variant={plan.ctaVariant}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>

                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      {feature.included ? (
                        <Check
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            feature.isLimitation ? 'text-yellow-500' : 'text-green-500'
                          }`}
                        />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-gray-700' : 'text-gray-400'
                        } ${feature.isLimitation ? 'italic' : ''}`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Questions fréquentes
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Puis-je changer de plan à tout moment ?
              </h4>
              <p className="text-sm text-gray-600">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements
                sont effectifs immédiatement avec un prorata au jour près.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Proposez-vous des réductions pour les ONG ?
              </h4>
              <p className="text-sm text-gray-600">
                Oui, nous offrons une réduction de 30% pour les ONG et associations à but non
                lucratif. Contactez-nous pour en bénéficier.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Mes données sont-elles en sécurité ?
              </h4>
              <p className="text-sm text-gray-600">
                Absolument. Vos données sont chiffrées avec un niveau de sécurité bancaire et
                sauvegardées quotidiennement. Nous sommes 100% conformes RGPD.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Quels moyens de paiement acceptez-vous ?
              </h4>
              <p className="text-sm text-gray-600">
                Nous acceptons Orange Money, Wave, MTN Mobile Money, les cartes bancaires (Visa,
                Mastercard) et les virements bancaires.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Essai gratuit 14 jours</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Sans carte bancaire</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Annulation en 1 clic</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
