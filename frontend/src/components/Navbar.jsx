import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { BoltIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../components/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const DEFAULT_PROFILE_IMAGE = '/default-profile.png'; // Ensure this exists in public folder
const DEFAULT_USER_DETAILS = {
  fname: 'Guest',
  role: 'labor',
};

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE_IMAGE);
  const [userDetails, setUserDetails] = useState(DEFAULT_USER_DETAILS);
  const [hasLoadedImage, setHasLoadedImage] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const docRef = doc(db, 'Users', user.uid);
        const unsubscribeUser = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserDetails(userData);
            const imageUrl = userData.profileImage
              ? `http://localhost:5000/api/get-image/${userData.profileImage}?ts=${Date.now()}`
              : DEFAULT_PROFILE_IMAGE;
            if (!hasLoadedImage || profileImage !== imageUrl) {
              setProfileImage(imageUrl);
            }
            console.log('User logged in:', userData);
          } else {
            console.log('No user document found, using default data');
            setUserDetails(DEFAULT_USER_DETAILS);
            setProfileImage(DEFAULT_PROFILE_IMAGE);
            setHasLoadedImage(true);
          }
        }, (error) => {
          console.error('Error fetching user data:', error);
          setUserDetails(DEFAULT_USER_DETAILS);
          setProfileImage(DEFAULT_PROFILE_IMAGE);
          setHasLoadedImage(true);
        });
        return () => unsubscribeUser();
      } else {
        setUserDetails(DEFAULT_USER_DETAILS);
        setProfileImage(DEFAULT_PROFILE_IMAGE);
        setHasLoadedImage(true);
        console.log('User not logged in');
      }
    });
    return () => unsubscribe();
  }, [hasLoadedImage]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
    console.log('Menu toggled:', !menuOpen);
  }, [menuOpen]);

  const handleLogin = () => {
    setMenuOpen(false);
    navigate('/login');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
      console.log('User Logged out');
    } catch (error) {
      console.error('Error Logging Out:', error.message);
    }
  };

  const handleProfileClick = () => {
    setMenuOpen(false);
    if (userDetails?.role === 'labor') navigate('/profile/labor');
    else if (userDetails?.role === 'contractor') navigate('/profile/contractor');
    else if (userDetails?.role === 'admin') navigate('/admin');
    else console.log('User role not defined');
  };

  const navbarSpring = useSpring({
    opacity: 1,
    y: 0,
    rotateX: isScrolled ? 2 : 0,
    from: { opacity: 0, y: -100, rotateX: 0 },
    config: { tension: 200, friction: 20 },
  });

  const logoVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <animated.div
      style={{
        ...navbarSpring,
        background: isScrolled ? 'rgba(249, 250, 251, 0.95)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.1)' : 'none',
      }}
      className="fixed top-0 left-0 w-full z-50 px-12 py-6 flex justify-between items-center transition-all duration-500 text-indigo-700"
    >
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0 border-2 border-transparent rounded-lg"
          animate={{
            borderColor: ['transparent', 'rgba(79, 70, 229, 0.5)', 'rgba(168, 85, 247, 0.5)', 'transparent'],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <motion.h1
        variants={logoVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.05, textShadow: '0 0 15px rgba(79, 70, 229, 0.7)' }}
        onClick={() => navigate('/')}
        className="font-orbitron text-3xl md:text-4xl cursor-pointer relative"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          background: 'linear-gradient(90deg, #4f46e5, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.1em',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {'LaborLoom'.split('').map((char, index) => (
          <motion.span key={index} variants={letterVariants}>
            {char}
          </motion.span>
        ))}
        <motion.div
          className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
          animate={{ scaleX: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.h1>

      <div className="flex items-center gap-6">
        {auth.currentUser ? (
          <div className="relative">
            <motion.img
              whileHover={{
                scale: 1.15,
                rotate: [0, 5, -5, 0],
                boxShadow: '0 0 15px rgba(79, 70, 229, 0.3)',
                transition: { duration: 0.6, ease: 'easeInOut', repeat: Infinity },
              }}
              whileTap={{ scale: 0.95 }}
              src={profileImage}
              alt="Profile"
              className="h-14 w-14 rounded-full cursor-pointer border-4 border-indigo-400 object-cover relative z-10 shadow-md"
              onClick={toggleMenu}
              onError={(e) => {
                console.log('Image failed to load, using default');
                e.target.src = DEFAULT_PROFILE_IMAGE;
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-indigo-400 opacity-20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 mt-4 w-64 rounded-xl shadow-2xl overflow-hidden border bg-white border-indigo-200 text-indigo-800"
                >
                  <motion.div
                    whileHover={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', scale: 1.02 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleProfileClick}
                    className="px-5 py-4 cursor-pointer font-semibold text-base flex items-center gap-3 relative overflow-hidden"
                  >
                    <BoltIcon className="h-5 w-5 text-indigo-600" />
                    Profile
                    <motion.div
                      className="absolute inset-0 bg-indigo-400 opacity-0"
                      whileHover={{ opacity: 0.1, scaleX: 1.5 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', scale: 1.02 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    onClick={handleLogout}
                    className="px-5 py-4 cursor-pointer font-semibold text-base flex items-center gap-3 relative overflow-hidden"
                  >
                    <BoltIcon className="h-5 w-5 text-indigo-600" />
                    Logout
                    <motion.div
                      className="absolute inset-0 bg-indigo-400 opacity-0"
                      whileHover={{ opacity: 0.1, scaleX: 1.5 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div className="relative">
            <motion.button
              whileHover={{
                scale: 1.1,
                boxShadow: '0 0 15px rgba(79, 70, 229, 0.3)',
                rotate: [0, 5, -5, 0],
                transition: { duration: 0.6, repeat: Infinity },
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              className="px-6 py-2 rounded-lg font-semibold text-sm shadow-md transition-all duration-300 bg-indigo-500 text-white hover:bg-indigo-600 relative z-10"
            >
              LOGIN
            </motion.button>
            <motion.div
              className="absolute inset-0 rounded-lg bg-indigo-400 opacity-20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </div>
    </animated.div>
  );
};

export default Navbar;
