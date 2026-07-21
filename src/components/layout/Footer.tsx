import React from 'react';
import { Scale, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useTranslation } from '../../i18n';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  const footerLinks = {
    services: [
      { name: t('footer.links.ai_search'), href: '/search' },
      { name: t('footer.links.database'), href: '/database' },
      { name: t('footer.links.generator_link'), href: '/generator' },
      { name: t('footer.links.formations'), href: '/search' },
    ],
    resources: [
      { name: t('footer.links.news'), href: '/news' },
      { name: t('footer.links.guides'), href: '/guides' },
      { name: t('footer.links.faq'), href: '/faq' },
      { name: t('footer.links.contact'), href: '/contact' },
    ],
    legal: [
      { name: t('footer.links.legal'), href: '/legal' },
      { name: t('footer.links.privacy'), href: '/privacy' },
      { name: t('footer.links.terms'), href: '/terms' },
      { name: t('footer.links.cookies'), href: '/cookies' },
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
                <p className="text-sm text-secondary-300">{t('footer.tagline')}</p>
              </div>
            </div>
            <p className="text-secondary-300 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-secondary-300">
                <Mail className="h-4 w-4" />
                <span>contact@francejustice.org</span>
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
            <h3 className="text-lg font-semibold mb-4">{t('footer.services_title')}</h3>
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
            <h3 className="text-lg font-semibold mb-4">{t('footer.resources_title')}</h3>
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
              <h3 className="text-lg font-semibold mb-4">{t('footer.legal_title')}</h3>
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
              <h3 className="text-lg font-semibold mb-4">{t('footer.newsletter_title')}</h3>
              <p className="text-secondary-300 text-sm mb-3">
                {t('footer.newsletter_desc')}
              </p>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder={t('footer.newsletter_placeholder')}
                  className="flex-1 px-3 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors">
                  {t('footer.newsletter_btn')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer — fond blanc, textes sombres */}
        <div className="border-t border-slate-200 py-6 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">

            {/* Copyright + Réalisé par */}
            <div className="flex flex-col sm:flex-row items-center gap-2 text-sm">
              <span style={{ color: '#1e293b', fontWeight: 500 }}>
                © {currentYear} Law Just. {t('footer.copyright')}
              </span>
              <span className="hidden sm:inline" style={{ color: '#94a3b8' }}>•</span>
              <span style={{ color: '#475569' }}>
                {t('footer.made_by')}{' '}
                <a
                  href="https://www.marocgestionentreprendre.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#2563eb')}
                >
                  Maroc Gestion Entreprendre
                </a>
              </span>
            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center space-x-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  style={{ color: '#64748b' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1e293b')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
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

