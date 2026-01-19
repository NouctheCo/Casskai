/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Footer de la landing page V2
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { useLocale } from '@/contexts/LocaleContext';

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
  isAnchor?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

export function Footer() {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  const footerLinks: Record<string, FooterSection> = {
    product: {
      title: t('landing.footer.sections.product.title'),
      links: [
        { label: t('landing.footer.sections.product.features'), href: '#features', isAnchor: true },
        { label: t('landing.footer.sections.product.pricing'), href: '/pricing' },
        { label: t('landing.footer.sections.product.roadmap'), href: '/roadmap' },
        { label: t('landing.footer.sections.product.systemStatus'), href: '/system-status' }
      ]
    },
    solutions: {
      title: t('landing.footer.sections.solutions.title'),
      links: [
        { label: t('landing.footer.sections.solutions.sme'), href: '#calculator', isAnchor: true },
        { label: t('landing.footer.sections.solutions.accounting'), href: '#calculator', isAnchor: true },
        { label: t('landing.footer.sections.solutions.ohada'), href: '#globe', isAnchor: true },
        { label: t('landing.footer.sections.solutions.europe'), href: '#globe', isAnchor: true }
      ]
    },
    resources: {
      title: t('landing.footer.sections.resources.title'),
      links: [
        { label: t('landing.footer.sections.resources.documentation'), href: '/docs' },
        { label: t('landing.footer.sections.resources.tutorials'), href: '/tutorials' },
        { label: t('landing.footer.sections.resources.faq'), href: '/faq' }
      ]
    },
    company: {
      title: t('landing.footer.sections.company.title'),
      links: [
        { label: t('landing.footer.sections.company.about'), href: '/about' },
        { label: t('landing.footer.sections.company.legal'), href: '/legal' },
        { label: t('landing.footer.sections.company.contact'), href: 'mailto:contact@casskai.com', isExternal: true }
      ]
    }
  };

  const socialLinks = [
    { icon: FaXTwitter, href: 'https://x.com/casskai170725', label: 'X (Twitter)' },
    { icon: Linkedin, href: 'https://linkedin.com/company/noutcheco', label: 'LinkedIn' },
    { icon: Youtube, href: 'https://youtube.com/@casskai_app', label: 'YouTube' }
  ];

  const handleLinkClick = (href: string, isAnchor?: boolean) => {
    if (isAnchor && href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const renderLink = (link: FooterLink) => {
    // Anchor link (scroll to section)
    if (link.isAnchor) {
      return (
        <button
          onClick={() => handleLinkClick(link.href, true)}
          className="text-gray-400 hover:text-white text-sm transition-colors text-left"
        >
          {link.label}
        </button>
      );
    }

    // External link (mailto, external sites)
    if (link.href.startsWith('mailto:') || link.href.startsWith('http')) {
      return (
        <a
          href={link.href}
          target={link.href.startsWith('http') ? '_blank' : undefined}
          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          {link.label}
        </a>
      );
    }

    // Internal route (Link component)
    return (
      <Link
        to={link.href}
        className="text-gray-400 hover:text-white text-sm transition-colors"
      >
        {link.label}
      </Link>
    );
  };

  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      {/* Main footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="CassKai"
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-white">CassKai</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              {t('landing.footer.description')}
            </p>

            {/* Contact info */}
            <div className="space-y-3 mb-6">
              <a
                href="mailto:contact@casskai.com"
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                contact@casskai.com
              </a>
              <div className="space-y-2">
                <a
                  href="tel:+33752027198"
                  className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t('landing.footer.contact.phone.europe')}</span>
                </a>
                <a
                  href="tel:+22574588383"
                  className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t('landing.footer.contact.phone.africaCI')}</span>
                </a>
                <a
                  href="tel:+22901691876"
                  className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t('landing.footer.contact.phone.africaBJ')}</span>
                </a>
              </div>
              <div className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>Paris, France</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {renderLink(link)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications & standards */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-400">🇫🇷 PCG 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-400">🌍 SYSCOHADA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-400">📊 IFRS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-400">🇲🇦 SCF</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-400">🔒 RGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-400">☁️ ISO 27001</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              {t('landing.footer.copyright', { year: currentYear })}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/privacy-policy" className="text-gray-500 hover:text-white text-sm transition-colors">
                {t('landing.footer.bottomLinks.privacy')}
              </Link>
              <Link to="/terms-of-service" className="text-gray-500 hover:text-white text-sm transition-colors">
                {t('landing.footer.bottomLinks.terms')}
              </Link>
              <Link to="/legal" className="text-gray-500 hover:text-white text-sm transition-colors">
                {t('landing.footer.bottomLinks.legal')}
              </Link>
              <Link to="/cookies-policy" className="text-gray-500 hover:text-white text-sm transition-colors">
                {t('landing.footer.bottomLinks.cookies')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
