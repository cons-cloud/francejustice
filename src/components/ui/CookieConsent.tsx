import React, { useState, useEffect } from 'react';
import { Shield, X, Check, Settings } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-consent', 'all');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'necessary');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-700 pointer-events-none">
      <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-white/95 backdrop-blur-md pointer-events-auto overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400"></div>
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="hidden sm:flex shrink-0 w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-secondary-900">Respect de votre vie privée</h3>
                <button onClick={handleDecline} className="text-secondary-400 hover:text-secondary-600 transition-colors sm:hidden">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-secondary-600 leading-relaxed mb-6">
                Just-Law utilise des cookies pour améliorer votre expérience, analyser le trafic et assurer la sécurité de vos données juridiques. 
                En acceptant, vous consentez à notre utilisation des technologies de suivi.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAcceptAll} className="flex-1 font-bold group">
                  <Check className="h-4 w-4 mr-2" />
                  Accepter tout
                </Button>
                <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="font-semibold">
                  <Settings className="h-4 w-4 mr-2" />
                  Personnaliser
                </Button>
                <Button variant="ghost" onClick={handleDecline} className="text-secondary-500 hover:text-secondary-700">
                  Refuser
                </Button>
              </div>

              {showSettings && (
                <div className="mt-6 pt-6 border-t border-secondary-100 space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-secondary-900">Cookies Essentiels</p>
                      <p className="text-xs text-secondary-500 font-medium italic">Toujours actif</p>
                    </div>
                    <div className="h-5 w-5 text-success-500"><Check /></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-secondary-900">Analyse & Performance</p>
                      <p className="text-xs text-secondary-500">Aide à améliorer nos services juridiques</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-600" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
