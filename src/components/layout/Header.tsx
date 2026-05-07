import React, { useState } from 'react';
import { Menu, Scale, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import MobileMenu from '../ui/MobileMenu';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Générateur', href: '/generator' },
    { name: 'Avocats', href: '/lawyers' },
    { name: 'À propos', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary-200 bg-white shadow-sm">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <Scale className="h-6 w-6 text-primary-600" />
            <div className="flex items-center">
              <span className="text-xl font-bold tracking-tight
  bg-gradient-to-r from-blue-600 via-gray-200 to-red-600
  bg-clip-text text-transparent">France Justice</span>
            </div>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`nav-link font-medium transition-colors ${isActive
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                    : 'text-secondary-600 hover:text-primary-600'
                    }`}
                >
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(role === 'admin' ? '/dashboard/admin' : role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/user')}
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Tableau de bord
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Déconnexion
                </Button>
              </div>
            ) : (
              <Button
  variant="outline"
  size="md"
  className="
    relative overflow-hidden
    px-5 py-2 text-sm rounded-xl
    border border-blue-600 text-white
    bg-blue-600 hover:bg-blue-600
    before:absolute before:inset-0
    before:bg-linear-to-r before:from-blue-600 before:via-white before:to-red-600
    before:opacity-0 before:transition-opacity before:duration-300

    hover:before:opacity-100
    hover:text-black

    z-0 before:z-[-1]

    transition-all hover:scale-105 active:scale-95
  "
  onClick={() => navigate('/login')}
>
  Connexion
</Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
              className="hover:bg-primary-50 text-secondary-600"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          user={user}
          role={role || undefined}
          navigate={navigate}
          signOut={signOut}
        />
      </div>
    </header>
  );
};

export default Header;
