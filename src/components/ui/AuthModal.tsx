import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowRight, X, Key, User, ShieldCheck, CheckCircle } from 'lucide-react';
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
  title = "Authentification requise", 
  message = "Veuillez choisir une option pour finaliser et déposer votre plainte ou document juridique." 
}) => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<'login' | 'register_user' | 'register_lawyer'>('login');

  const handleConfirm = () => {
    onClose();
    const redirectParam = '?redirect=/generator';
    if (selectedOption === 'login') {
      navigate(`/login${redirectParam}`);
    } else if (selectedOption === 'register_user') {
      navigate(`/register${redirectParam}`);
    } else if (selectedOption === 'register_lawyer') {
      navigate(`/register/lawyer${redirectParam}`);
    }
  };

  const options = [
    {
      id: 'login',
      title: "Se connecter",
      description: "Accédez à votre compte France Justice existant",
      icon: Key,
      color: "from-indigo-500 to-indigo-600"
    },
    {
      id: 'register_user',
      title: "Créer un compte Citoyen",
      description: "Inscrivez-vous pour déposer et suivre vos plaintes et démarches",
      icon: User,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      id: 'register_lawyer',
      title: "Espace Avocat / Professionnel",
      description: "Inscrivez-vous en tant que professionnel du barreau",
      icon: ShieldCheck,
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 'register_student',
      title: "Espace Étudiant en Droit",
      description: "Accédez aux cours, formations et discussions avec les professeurs et avocats",
      icon: User,
      color: "from-blue-500 to-cyan-600"
    },
    {
      id: 'register_professor',
      title: "Espace Professeur de Droit",
      description: "Programmez vos cours, masterclasses et visioconférences",
      icon: ShieldCheck,
      color: "from-amber-500 to-orange-600"
    },
    {
      id: 'register_doctorate',
      title: "Espace Doctorant / Chercheur",
      description: "Publiez vos thèses, travaux de recherche et animez des séminaires",
      icon: ShieldCheck,
      color: "from-teal-500 to-emerald-600"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[51] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white text-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative pointer-events-auto border border-slate-200 flex flex-col max-h-[92vh] overflow-y-auto"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="w-14 h-14 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center justify-center mb-5">
                <ShieldAlert className="h-7 w-7 text-cyan-600" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2">{title}</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                {message}
              </p>

              <div className="space-y-3 mb-6">
                {options.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedOption === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedOption(opt.id as any)}
                      className={`relative cursor-pointer transition-all duration-300 rounded-2xl p-4 border flex items-center gap-4 ${
                        isSelected
                          ? 'border-2 border-cyan-500 bg-cyan-50/70 ring-2 ring-cyan-500/20 shadow-md scale-[1.01]'
                          : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${opt.color} text-white shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 pr-6">
                        <h4 className={`font-extrabold text-sm ${isSelected ? 'text-cyan-900' : 'text-slate-900'}`}>
                          {opt.title}
                        </h4>
                        <p className={`text-xs ${isSelected ? 'text-cyan-700 font-medium' : 'text-slate-500'}`}>
                          {opt.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute right-4 text-cyan-600">
                          <CheckCircle className="h-5 w-5 fill-cyan-100 text-cyan-600" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center gap-3">
                <Button 
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </Button>
                <Button 
                  size="lg"
                  className="rounded-xl px-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold flex items-center shadow-md shadow-cyan-600/20 cursor-pointer"
                  onClick={handleConfirm}
                >
                  Continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
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
