import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className={cn(
              "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl z-10",
              className
            )}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6 pr-8">
              <h2 className="text-2xl font-display font-semibold text-white">{title}</h2>
              {description && <p className="text-muted-foreground mt-2">{description}</p>}
            </div>
            
            <div className="text-foreground">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
