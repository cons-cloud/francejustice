import React from 'react';
import { X, Scale, User as UserIcon, Home, FileText, Users, Info, LayoutGrid, LogOut } from 'lucide-react';
import { Button } from './Button';
import { useLocation } from 'react-router-dom';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  role?: string;
  navigate: (path: string) => void;
  signOut: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, user, role, navigate, signOut }) => {
  const location = useLocation();
  const navItems = [
    { name: 'Accueil', href: '/', icon: Home },
    { name: 'Services', href: '/services', icon: Scale },
    { name: 'Générateur', href: '/generator', icon: FileText },
    { name: 'Avocats', href: '/lawyers', icon: Users },
    { name: 'À propos', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: LayoutGrid },
  ];

  return (
    <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Menu Panel */}
      <div className={`absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <span className="text-xl font-bold text-primary-600">Menu</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full p-2 h-10 w-10">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-6 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    onClose();
                  }}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all font-medium ${
                    isActive 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-primary-600'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t bg-secondary-50 space-y-4">
            {user ? (
              <>
                <Button 
                  className="w-full justify-start rounded-xl py-6"
                  onClick={() => {
                    navigate(role === 'admin' ? '/dashboard/admin' : role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/user');
                    onClose();
                  }}
                >
                  <UserIcon className="mr-3 h-5 w-5" />
                  Tableau de bord
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl py-6 border-secondary-200"
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button 
                className="w-full rounded-xl py-6 text-lg font-bold shadow-lg shadow-primary-500/20"
                onClick={() => {
                  navigate('/login');
                  onClose();
                }}
              >
                <UserIcon className="mr-3 h-5 w-5" />
                Connexion
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
