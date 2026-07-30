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
    <footer className="bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-700 shadow-lg shadow-primary-500/30">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">France Justice</span>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Services 100% Opérationnels
                </p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center space-x-3 text-sm text-slate-300">
                <Mail className="h-4 w-4 text-primary-400 shrink-0" />
                <span>contact@francejustice.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-300">
                <Phone className="h-4 w-4 text-primary-400 shrink-0" />
                <span>+33607517416</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-300">
                <MapPin className="h-4 w-4 text-primary-400 shrink-0" />
                <span className="text-xs">1275 route de chateau neuf, 26320 Saint-Marcel-lès-Valence</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-5 pb-2 border-b border-slate-800/80">
              {t('footer.services_title')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-primary-400 transition-colors text-sm font-medium flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-primary-500 transition-colors" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-5 pb-2 border-b border-slate-800/80">
              {t('footer.resources_title')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-primary-400 transition-colors text-sm font-medium flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-primary-500 transition-colors" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Newsletter */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-5 pb-2 border-b border-slate-800/80">
                {t('footer.newsletter_title')}
              </h3>
              <p className="text-slate-400 text-sm mb-3">
                {t('footer.newsletter_desc')}
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="email"
                  placeholder={t('footer.newsletter_placeholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
                <button 
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 rounded-xl text-sm font-bold text-white shadow-md shadow-primary-600/20 transition-all shrink-0"
                >
                  {t('footer.newsletter_btn')}
                </button>
              </form>
            </div>

            <div>
              <ul className="flex flex-wrap gap-4 text-xs text-slate-400">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="hover:text-slate-200 transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-slate-800/80 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-slate-400">
              <span>© {currentYear} France Justice. {t('footer.copyright')}</span>
              <span className="hidden sm:inline text-slate-700">•</span>
              <span className="text-slate-400">
                {t('footer.made_by')}{' '}
                <a
                  href="https://www.marocgestionentreprendre.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Maroc Gestion Entreprendre
                </a>
              </span>
            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
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


