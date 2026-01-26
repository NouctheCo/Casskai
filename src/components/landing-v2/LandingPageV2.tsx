/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Landing Page V2 - Composant principal
 */

import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { HeroTerminal } from './HeroTerminal';
import { EarlyPricingSection } from './EarlyPricingSection';
import { PlatformCoverageSection } from './PlatformCoverageSection';
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

      {/* 1. Hero Section avec Terminal interactif */}
      <section id="hero">
        <HeroTerminal />
      </section>

      {/* 2. EARLY PRICING - NEW - High visibility for conversion */}
      <section id="plans">
        <EarlyPricingSection />
      </section>

      {/* 3. Platform Coverage - Complete Business OS positioning */}
      <section id="platform">
        <PlatformCoverageSection />
      </section>

      {/* 4. Features - Problem/Solution framing */}
      <section id="features">
        <FeaturesShowcase />
      </section>

      {/* 5. ROI Calculator */}
      <section id="roi">
        <ROICalculator />
      </section>

      {/* 6. Transformation Timeline - Before/After */}
      <section id="transformation">
        <TransformationTimeline />
      </section>

      {/* 7. World Map - Multi-country proof */}
      <section id="coverage">
        <AnimatedWorldMap />
      </section>

      {/* 8. Testimonials */}
      <section id="testimonials">
        <BetaTestimonials />
      </section>

      {/* 9. Final CTA - Simplified */}
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
