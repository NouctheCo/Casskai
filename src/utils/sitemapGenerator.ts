// Générateur automatique de sitemap XML
// Optimise le SEO et facilite l'indexation par les moteurs de recherche

interface SitemapRoute {
  path: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod?: string;
}

interface SitemapConfig {
  baseUrl: string;
  routes: SitemapRoute[];
  includeImages?: boolean;
  excludePatterns?: string[];
}

const DEFAULT_ROUTES: SitemapRoute[] = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/landing', priority: 0.9, changefreq: 'weekly' },
  { path: '/auth', priority: 0.3, changefreq: 'monthly' },
  { path: '/dashboard', priority: 0.8, changefreq: 'daily' },
  { path: '/accounting', priority: 0.8, changefreq: 'daily' },
  { path: '/invoicing', priority: 0.8, changefreq: 'daily' },
  { path: '/banks', priority: 0.7, changefreq: 'daily' },
  { path: '/reports', priority: 0.7, changefreq: 'weekly' },
  { path: '/settings', priority: 0.4, changefreq: 'monthly' },
];

export class SitemapGenerator {
  private config: SitemapConfig;

  constructor(config: Partial<SitemapConfig> = {}) {
    this.config = {
      baseUrl: 'https://app.casskai.fr',
      routes: DEFAULT_ROUTES,
      includeImages: true,
      excludePatterns: ['/api/*', '/admin/*', '/**/private/*'],
      ...config,
    };
  }

  // Génère le sitemap XML complet
  generateSitemap(): string {
    const routes = this.getFilteredRoutes();
    const urls = routes.map(route => this.generateUrlEntry(route)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
  }

  // Génère une entrée URL pour le sitemap
  private generateUrlEntry(route: SitemapRoute): string {
    const lastmod = route.lastmod || new Date().toISOString().split('T')[0];
    const fullUrl = `${this.config.baseUrl}${route.path}`;

    let entry = `  <url>
    <loc>${this.escapeXml(fullUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>`;

    // Ajouter les images si configuré
    if (this.config.includeImages) {
      const images = this.getImagesForRoute(route.path);
      if (images.length > 0) {
        const imageEntries = images.map(img => `
    <image:image>
      <image:loc>${this.escapeXml(img.url)}</image:loc>
      <image:title>${this.escapeXml(img.title)}</image:title>
      <image:caption>${this.escapeXml(img.caption)}</image:caption>
    </image:image>`).join('');
        entry += imageEntries;
      }
    }

    entry += '\n  </url>';
    return entry;
  }

  // Filtre les routes selon les patterns d'exclusion
  private getFilteredRoutes(): SitemapRoute[] {
    return this.config.routes.filter(route => {
      return !this.config.excludePatterns?.some(pattern => 
        this.matchesPattern(route.path, pattern)
      );
    });
  }

  // Vérifie si un chemin correspond à un pattern d'exclusion
  private matchesPattern(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  // Récupère les images associées à une route
  private getImagesForRoute(path: string): Array<{ url: string; title: string; caption: string }> {
    const images: Array<{ url: string; title: string; caption: string }> = [];

    switch (path) {
      case '/':
      case '/landing':
        images.push({
          url: `${this.config.baseUrl}/og-image.png`,
          title: 'CassKai - Gestion Financière PME',
          caption: 'Solution complète de gestion financière pour PME et indépendants'
        });
        break;
      case '/dashboard':
        images.push({
          url: `${this.config.baseUrl}/dashboard-preview.png`,
          title: 'Tableau de Bord CassKai',
          caption: 'Vue d\'ensemble de votre activité financière en temps réel'
        });
        break;
      case '/accounting':
        images.push({
          url: `${this.config.baseUrl}/accounting-preview.png`,
          title: 'Module Comptabilité',
          caption: 'Gestion comptable complète et automatisée'
        });
        break;
    }

    return images;
  }

  // Échappe les caractères XML
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  // Ajoute une route dynamiquement
  addRoute(route: SitemapRoute): void {
    const existingIndex = this.config.routes.findIndex(r => r.path === route.path);
    if (existingIndex >= 0) {
      this.config.routes[existingIndex] = route;
    } else {
      this.config.routes.push(route);
    }
  }

  // Supprime une route
  removeRoute(path: string): void {
    this.config.routes = this.config.routes.filter(route => route.path !== path);
  }

  // Met à jour la date de modification d'une route
  updateRouteLastmod(path: string, lastmod: string): void {
    const route = this.config.routes.find(r => r.path === path);
    if (route) {
      route.lastmod = lastmod;
    }
  }

  // Génère le sitemap index pour de très gros sites
  generateSitemapIndex(sitemaps: string[]): string {
    const sitemapEntries = sitemaps.map(sitemap => {
      const lastmod = new Date().toISOString().split('T')[0];
      return `  <sitemap>
    <loc>${this.escapeXml(sitemap)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
  }

  // Génère automatiquement le robots.txt avec référence au sitemap
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Optimisation pour les moteurs de recherche
Crawl-delay: 1

# Exclusions de sécurité
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /.env
Disallow: /logs/

# Sitemap
Sitemap: ${this.config.baseUrl}/sitemap.xml`;
  }
}

// Hook React pour intégrer le générateur de sitemap
export const useSitemapGeneration = (routes?: SitemapRoute[]) => {
  const generator = new SitemapGenerator({
    routes: routes || DEFAULT_ROUTES,
  });

  const generateAndDownload = () => {
    const sitemap = generator.generateSitemap();
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateRobots = () => {
    const robots = generator.generateRobotsTxt();
    const blob = new Blob([robots], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'robots.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    generator,
    generateAndDownload,
    generateRobots,
    sitemap: generator.generateSitemap(),
  };
};

// Service pour la génération automatique côté serveur
export class ServerSitemapService {
  private generator: SitemapGenerator;

  constructor(baseUrl: string) {
    this.generator = new SitemapGenerator({ baseUrl });
  }

  // Sauvegarde le sitemap sur le serveur
  async saveSitemap(filePath: string = 'public/sitemap.xml'): Promise<void> {
    const sitemap = this.generator.generateSitemap();
    
    if (typeof window === 'undefined') {
      // Environnement Node.js
      const fs = await import('fs');
      const path = await import('path');
      
      const fullPath = path.resolve(filePath);
      await fs.promises.writeFile(fullPath, sitemap, 'utf8');
    }
  }

  // Sauvegarde le robots.txt
  async saveRobotsTxt(filePath: string = 'public/robots.txt'): Promise<void> {
    const robots = this.generator.generateRobotsTxt();
    
    if (typeof window === 'undefined') {
      const fs = await import('fs');
      const path = await import('path');
      
      const fullPath = path.resolve(filePath);
      await fs.promises.writeFile(fullPath, robots, 'utf8');
    }
  }

  // Met à jour le sitemap avec des routes dynamiques
  async updateWithDynamicRoutes(fetchRoutes: () => Promise<SitemapRoute[]>): Promise<void> {
    try {
      const dynamicRoutes = await fetchRoutes();
      dynamicRoutes.forEach(route => this.generator.addRoute(route));
      
      await this.saveSitemap();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du sitemap:', error instanceof Error ? error.message : String(error));
    }
  }
}

// Utilitaire pour générer automatiquement le sitemap au build
export const generateBuildSitemap = async () => {
  if (typeof window === 'undefined') {
    const service = new ServerSitemapService('https://app.casskai.fr');
    
    try {
      await service.saveSitemap();
      await service.saveRobotsTxt();
      console.warn('✅ Sitemap et robots.txt générés avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la génération du sitemap:', error instanceof Error ? error.message : String(error));
    }
  }
};

export default SitemapGenerator;