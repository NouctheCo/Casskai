/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Landing Page V2 - Composant principal
 */

import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { HeroTerminal } from './HeroTerminal';
import { AnimatedWorldMap } from './AnimatedWorldMap';
import { TransformationTimeline } from './TransformationTimeline';
import { FeaturesShowcase } from './FeaturesShowcase';
import { ROICalculator } from './ROICalculator';
import { BetaTestimonials } from './BetaTestimonials';
import { CTASection } from './CTASection';
import { Footer } from './Footer';
import { AIChatWidget } from './AIChatWidget';

export function LandingPageV2() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navbar fixe */}
      <Navbar />

      {/* Hero Section avec Terminal interactif */}
      <section id="hero">
        <HeroTerminal />
      </section>

      {/* Carte du monde animée - Couverture géographique */}
      <section id="coverage">
        <AnimatedWorldMap />
      </section>

      {/* Timeline Transformation Avant/Après */}
      <section id="transformation">
        <TransformationTimeline />
      </section>

      {/* Showcase des fonctionnalités */}
      <section id="features">
        <FeaturesShowcase />
      </section>

      {/* Calculateur ROI */}
      <section id="roi">
        <ROICalculator />
      </section>

      {/* Témoignages Beta Testeurs */}
      <section id="testimonials">
        <BetaTestimonials />
      </section>

      {/* CTA Final */}
      <section id="cta">
        <CTASection />
      </section>

      {/* Footer */}
      <Footer />

      {/* Widget Chat IA flottant */}
      <AIChatWidget />
    </div>
  );
}

export default LandingPageV2;
