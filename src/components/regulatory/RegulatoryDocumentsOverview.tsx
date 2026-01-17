/**
 * CassKai - Regulatory Documents Overview
 * Integration of regulatory documents in the main reports page
 */

import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  TrendingUp,
  Globe,
} from 'lucide-react';

interface RegulatoryModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge: string;
  features: string[];
  countries: number;
  documents: number;
  standards: string[];
}

export function RegulatoryDocumentsOverview() {
  const modules: RegulatoryModule[] = [
    {
      id: 'documents',
      title: 'Regulatory Documents',
      description: 'Create, manage, and submit regulatory documents for all supported countries',
      icon: <FileText className="w-8 h-8" />,
      href: '/reports/regulatory',
      badge: 'Complete',
      features: [
        'Auto-fill from accounting data',
        'Multi-standard support',
        'PDF export with signatures',
        'Version control & audit trail',
        'Validation framework',
      ],
      countries: 50,
      documents: 100,
      standards: ['PCG', 'SYSCOHADA', 'IFRS', 'SCF', 'PCM'],
    },
    {
      id: 'compliance',
      title: 'Compliance Dashboard',
      description: 'Monitor filing deadlines and compliance requirements in real-time',
      icon: <CheckCircle className="w-8 h-8" />,
      href: '/reports/compliance',
      badge: 'Real-time',
      features: [
        'Deadline tracking',
        'Risk assessment',
        'Submission history',
        'Compliance reports',
        'Notifications',
      ],
      countries: 50,
      documents: 100,
      standards: ['All'],
    },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 mb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Regulatory Documents</h2>
        <p className="text-gray-600 max-w-2xl">
          Complete multi-country regulatory compliance system supporting 50+ countries and 4 major accounting standards
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {modules.map((module) => (
          <Link
            key={module.id}
            to={module.href}
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden group border-l-4 border-blue-600"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                    {module.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                        {module.badge}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">{module.description}</p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-t border-b border-gray-200">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{module.countries}</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Globe size={14} />
                    Countries
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{module.documents}</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <FileText size={14} />
                    Documents
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-600">{module.standards.length}</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <TrendingUp size={14} />
                    Standards
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Key Features:</p>
                <ul className="space-y-1">
                  {module.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-600 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Standards */}
              <div className="flex flex-wrap gap-2 mb-4">
                {module.standards.slice(0, 3).map((std) => (
                  <span key={std} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                    {std}
                  </span>
                ))}
                {module.standards.length > 3 && (
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                    +{module.standards.length - 3} more
                  </span>
                )}
              </div>

              {/* CTA Button */}
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors group-hover:bg-blue-700">
                Open {module.title} →
              </button>
            </div>
          </Link>
        ))}
      </div>

      {/* Supported Standards Info */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="text-indigo-600" />
          Supported Accounting Standards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
            <h4 className="font-bold text-blue-900 mb-2">PCG</h4>
            <p className="text-sm text-gray-600">France</p>
            <p className="text-xs text-gray-500 mt-2">35+ documents</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
            <h4 className="font-bold text-green-900 mb-2">SYSCOHADA</h4>
            <p className="text-sm text-gray-600">33 OHADA Countries</p>
            <p className="text-xs text-gray-500 mt-2">12+ documents</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
            <h4 className="font-bold text-purple-900 mb-2">IFRS for SMEs</h4>
            <p className="text-sm text-gray-600">English-speaking Africa</p>
            <p className="text-xs text-gray-500 mt-2">12+ documents</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-600">
            <h4 className="font-bold text-orange-900 mb-2">SCF</h4>
            <p className="text-sm text-gray-600">Algeria, Tunisia</p>
            <p className="text-xs text-gray-500 mt-2">6+ documents</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
            <h4 className="font-bold text-red-900 mb-2">PCM</h4>
            <p className="text-sm text-gray-600">Morocco</p>
            <p className="text-xs text-gray-500 mt-2">6+ documents</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegulatoryDocumentsOverview;
