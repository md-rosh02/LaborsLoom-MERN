import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSpring as useReactSpring, animated } from 'react-spring';
import { ChevronUp } from 'lucide-react';

const HomeButton = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const [particles, setParticles] = useState([]);
  const buttonRef = useRef(null);

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 25 });
  const springY = useSpring(y, { stiffness: 300, damping: 25 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);

  // Spring for Button Scale
  const buttonSpring = useReactSpring({
    scale: openMenu ? 1.1 : 1,
    config: { tension: 300, friction: 20 },
  });

  const menuVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: { duration: 0.3, ease: 'easeIn' },
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 25 },
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  const menuItems = [
    { title: 'Home', path: '/' },
    { title: 'Available Jobs', path: '/available-jobs' },
    { title: 'Contact', path: '/contact' },
    { title: 'Mission & Vision', path: '/mission' },
    { title: 'Team', path: '/team' },
  ];

  useEffect(() => {
    const particleInterval = setInterval(() => {
      if (openMenu || buttonRef.current?.matches(':hover')) {
        const rect = buttonRef.current.getBoundingClientRect();
        setParticles((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            opacity: 0.7,
          },
        ].slice(-10)); // Limit to 10 particles
      }
    }, 200);

    return () => clearInterval(particleInterval);
  }, [openMenu]);

  const handleMouseMove = (e) => {
    const rect = buttonRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Particle Trail */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-indigo-400 rounded-full pointer-events-none"
            initial={{ x: particle.x - 2, y: particle.y - 2, opacity: particle.opacity }}
            animate={{ y: particle.y - 20, opacity: 0, scale: 1.5 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ zIndex: 49 }}
          />
        ))}
      </AnimatePresence>

      {/* 3D Tilt Button */}
      <animated.div style={{ scale: buttonSpring.scale }}>
        <motion.button
          ref={buttonRef}
          style={{ rotateX, rotateY, perspective: 1000 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => setOpenMenu(!openMenu)}
          className="bg-indigo-500 text-white p-3 rounded-full shadow-lg hover:bg-indigo-600 transition-colors duration-200 relative z-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: openMenu ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronUp className="h-6 w-6" />
          </motion.div>
        </motion.button>
      </animated.div>

      {/* Animated Menu */}
      <AnimatePresence>
        {openMenu && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-full mb-4 bg-white/80 backdrop-blur-md text-gray-900 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 w-[250px]"
            style={{ zIndex: 50 }}
          >
            {menuItems.map((item) => (
              <motion.div
                key={item.path}
                variants={itemVariants}
                whileHover={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  x: 5,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.2)',
                  transition: { duration: 0.2 },
                }}
                className="px-6 py-3 cursor-pointer font-medium text-sm border-b border-gray-200 last:border-b-0"
                onClick={() => setOpenMenu(false)}
              >
                <Link to={item.path} className="w-full block">
                  {item.title}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeButton;