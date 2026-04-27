import React from 'react';
import { Scale, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    services: [
      { name: 'Recherche juridique IA', href: '/search' },
      { name: 'Base de données légale', href: '/database' },
      { name: 'Générateur de plaintes', href: '/generator' },
      { name: 'Formations et ressources', href: '/search' },
    ],
    resources: [
      { name: 'Actualités juridiques', href: '/news' },
      { name: 'Guides pratiques', href: '/guides' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Contact', href: '/contact' },
    ],
    legal: [
      { name: 'Mentions légales', href: '/legal' },
      { name: 'Politique de confidentialité', href: '/privacy' },
      { name: 'CGU', href: '/terms' },
      { name: 'Cookies', href: '/cookies' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
  ];

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="container">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-primary-600">Just-Law</span>
                <p className="text-sm text-secondary-300">Plateforme juridique moderne</p>
              </div>
            </div>
            <p className="text-secondary-300 text-sm leading-relaxed">
              Votre partenaire de confiance pour tous vos besoins juridiques. 
              Accès simplifié au droit, assistance personnalisée et outils innovants.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-secondary-300">
                <Mail className="h-4 w-4" />
                <span>contact@lawjust.fr</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-secondary-300">
                <Phone className="h-4 w-4" />
                <span>+33607517416</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-secondary-300">
                <MapPin className="h-4 w-4" />
                <span>1275 route de chateau neuf 26320 saint marcelle les valence</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ressources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Newsletter */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Légal</h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-secondary-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <p className="text-secondary-300 text-sm mb-3">
                Restez informé des dernières actualités juridiques
              </p>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 px-3 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors">
                  S'abonner
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-secondary-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-secondary-400">
              © {currentYear} Law Just. Tous droits réservés.
            </div>
            <div className="flex items-center space-x-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-secondary-400 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
