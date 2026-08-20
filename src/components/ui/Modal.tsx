import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, className }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Glassmorphic Backdrop with soft ambient blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl transition-all"
          />

          {/* Premium Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={cn(
              "relative bg-slate-900/95 border border-slate-800/90 text-slate-100 rounded-3xl shadow-2xl shadow-indigo-950/40 w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col backdrop-blur-2xl z-10",
              className
            )}
          >
            {/* Top Multi-Color Gradient Ambient Line */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 shrink-0" />

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800/80 bg-slate-900/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-105 active:scale-95 transition-all duration-200"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;