import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

const AutoNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [particles, setParticles] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const mouseX = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 400, damping: 30 });

  const navbarVariants = {
    hidden: {
      x: '-100%',
      opacity: 0,
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        staggerChildren: 0.07,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 400, damping: 30 },
    },
  };

  const menuItems = [
    { title: 'Home', path: '/' },
    { title: 'Available Jobs', path: '/available-jobs' },
    { title: 'Contact', path: '/contact' },
    { title: 'Mission & Vision', path: '/mission' },
    { title: 'Team', path: '/team' },
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      setIsOpen(e.clientX < 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX]);

  useEffect(() => {
    const particleInterval = setInterval(() => {
      if (isOpen) {
        setParticles((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x: 50,
            y: Math.random() * window.innerHeight,
            opacity: 0.8,
            color: `hsl(${Math.random() * 60 + 260}, 70%, 60%)`,
          },
        ].slice(-15));
      }
    }, 150);

    return () => clearInterval(particleInterval);
  }, [isOpen]);

  return (
    <div className={`fixed left-0 top-0 h-full z-50 ${isDarkMode ? 'dark' : ''}`}>
      {/* Particle Trail */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full pointer-events-none"
            style={{ backgroundColor: particle.color }}
            initial={{ x: particle.x, y: particle.y, opacity: particle.opacity, scale: 0.5 }}
            animate={{ x: particle.x + 40, opacity: 0, scale: 1.8 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Auto-Opening Navbar */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            variants={navbarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`h-full w-72 ${
              isDarkMode
                ? 'bg-gradient-to-b from-gray-900 to-indigo-950'
                : 'bg-gradient-to-b from-white to-indigo-50'
            } shadow-2xl border-r border-indigo-200/30 flex flex-col justify-between py-8`}
            style={{ zIndex: 50 }}
          >
            {/* Menu Items */}
            <div className="flex flex-col space-y-2 px-6">
              {menuItems.map((item) => (
                <motion.div
                  key={item.path}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.05,
                    x: 8,
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.3)',
                    transition: { duration: 0.25 },
                  }}
                  className={`px-4 py-3 rounded-lg ${
                    isDarkMode ? 'hover:bg-indigo-800/50' : 'hover:bg-indigo-100/50'
                  } cursor-pointer`}
                >
                  <Link
                    to={item.path}
                    className={`font-medium text-base ${
                      isDarkMode ? 'text-indigo-200' : 'text-indigo-700'
                    } hover:text-purple-500 transition-colors duration-200`}
                  >
                    {item.title}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Dark Mode Toggle */}
            <motion.div
              className="px-6"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-full ${
                  isDarkMode ? 'bg-indigo-800 text-indigo-200' : 'bg-indigo-100 text-indigo-700'
                } hover:bg-purple-500 hover:text-white transition-colors duration-200`}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutoNavbar;