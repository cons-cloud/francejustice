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
              className="bg-slate-900 text-slate-100 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative pointer-events-auto border border-slate-800 flex flex-col max-h-[92vh] overflow-y-auto"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="w-14 h-14 bg-indigo-950/80 border border-indigo-800/60 rounded-2xl flex items-center justify-center mb-5">
                <ShieldAlert className="h-7 w-7 text-indigo-400" />
              </div>

              <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                {message}
              </p>

              <div className="space-y-4 mb-6">
                {options.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedOption === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedOption(opt.id as any)}
                      className={`relative cursor-pointer transition-all duration-300 rounded-2xl p-4 border flex items-center gap-4 ${
                        isSelected
                          ? 'border-2 border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500/30 shadow-lg scale-[1.01]'
                          : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 bg-slate-950'
                      }`}
                    >
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${opt.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 pr-6">
                        <h4 className={`font-extrabold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {opt.title}
                        </h4>
                        <p className={`text-xs ${isSelected ? 'text-indigo-200 font-medium' : 'text-slate-400'}`}>
                          {opt.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute right-4 text-indigo-400">
                          <CheckCircle className="h-5 w-5 fill-indigo-950 text-indigo-400" />
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
                  className="rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Annuler
                </Button>
                <Button 
                  size="lg"
                  className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center shadow-lg shadow-indigo-600/20"
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
