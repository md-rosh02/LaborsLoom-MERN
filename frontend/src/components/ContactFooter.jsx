import React from 'react';
import { motion } from 'framer-motion';

const ContactFooter = () => {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.6 }}
      className="fixed bottom-0 left-0 w-full bg-gray-300 backdrop-blur-sm text-black py-5 text-center border-t border-white/10 z-40 "
    >
      <motion.p 
        whileHover={{ scale: 1.05 }}
        className="text-lg"
      >
        Join the revolution: <a href="mailto:info@laborloom.com" className="text-gray-400 hover:text-black transition-colors">info@laborloom.com</a>
      </motion.p>
    </motion.div>
  );
};

export default ContactFooter;