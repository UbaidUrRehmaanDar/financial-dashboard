import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageTransition({ children, pageKey }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ x: 20, opacity: 0, scale: 0.98 }}
        animate={{ x: 0,  opacity: 1, scale: 1    }}
        exit={{    x: -20, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
