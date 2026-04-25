import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Connexion requise", 
  message = "Veuillez vous connecter ou créer un compte pour utiliser cette fonctionnalité avancée." 
}) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[51] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative pointer-events-auto"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-600 bg-secondary-50 hover:bg-secondary-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldAlert className="h-8 w-8 text-primary-600" />
              </div>

              <h2 className="text-2xl font-black text-secondary-900 mb-3">{title}</h2>
              <p className="text-secondary-600 mb-8 leading-relaxed">
                {message}
              </p>

              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="w-full text-lg rounded-xl shadow-lg shadow-primary-600/20"
                  onClick={() => navigate('/login')}
                >
                  Se connecter
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="w-full rounded-xl"
                  onClick={() => navigate('/register')}
                >
                  Créer un compte
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
