import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Briefcase, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../components/firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getDoc, doc } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('labor');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { setLoggedIn } = useAuth();
  const [particles, setParticles] = useState([]);

  const ADMIN_EMAIL = 'admin@a.com';
  const ADMIN_PASSWORD = 'admin@123';

  useEffect(() => {
    // Load saved credentials only on initial mount
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'Users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
              setLoggedIn('LoggedIn');
              toast.success('Admin logged in successfully', { position: 'top-right', autoClose: 2000 });
              navigate('/admin');
            } else if (userData.role === role) {
              setLoggedIn('LoggedIn');
              toast.success(`${userData.fname || 'User'} logged in successfully`, { position: 'top-right', autoClose: 2000 });
              navigate('/');
            } else {
              auth.signOut();
              setError(`You are registered as a ${userData.role}, not a ${role}.`);
            }
          } else if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            setLoggedIn('LoggedIn');
            toast.success('Admin logged in successfully', { position: 'top-right', autoClose: 2000 });
            navigate('/admin');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to fetch user data.');
        }
      }
    });

    const particleInterval = setInterval(() => {
      setParticles((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: Math.random() * window.innerWidth,
          y: -10,
          opacity: 0.7,
        },
      ].filter((p) => p.opacity > 0).slice(-20));
    }, 200);

    return () => {
      unsubscribe();
      clearInterval(particleInterval);
    };
  }, [role, setLoggedIn, navigate]); // Removed email and password from dependencies

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required.');
      toast.error('Email and password are required.', { position: 'top-right' });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      
      // Handle "Remember Me" functionality
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', trimmedEmail);
        localStorage.setItem('rememberedPassword', trimmedPassword);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }
    } catch (err) {
      console.error('Firebase Auth Error:', err.code, err.message);
      if (err.code === 'auth/invalid-login-credentials') {
        setError('Invalid email or password. Please check your credentials.');
        toast.error('Invalid email or password.', { position: 'top-right' });
      } else {
        setError(err.message || 'An error occurred during login.');
        toast.error(err.message || 'An error occurred.', { position: 'top-right' });
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      toast.error('Please enter your email address.', { position: 'top-right' });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.', { 
        position: 'top-right',
        autoClose: 3000 
      });
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to send password reset email. Please try again.');
      toast.error('Failed to send reset email: ' + err.message, { position: 'top-right' });
    }
  };

  // Handle input changes
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-20 relative overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-indigo-400 rounded-full pointer-events-none"
          initial={{ x: particle.x, y: particle.y, opacity: particle.opacity }}
          animate={{ y: particle.y + 100, opacity: 0 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          style={{ zIndex: 0 }}
        />
      ))}

      <motion.div
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-6">
          <User className="mx-auto h-10 w-10 text-indigo-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                type="button"
                onClick={() => setRole('labor')}
                className={`py-2 px-4 rounded-lg border ${
                  role === 'labor'
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <User className="h-4 w-4 inline mr-2" /> Labor
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setRole('contractor')}
                className={`py-2 px-4 rounded-lg border ${
                  role === 'contractor'
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Briefcase className="h-4 w-4 inline mr-2" /> Contractor
              </motion.button>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={handlePasswordChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-400"
              />
              <span className="ml-2 text-gray-700">Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-indigo-600 hover:text-indigo-500 hover:underline transition-colors duration-200"
            >
              Forgot password?
            </button>
          </div>

          <motion.button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign in as {role.charAt(0).toUpperCase() + role.slice(1)}
          </motion.button>

          <p className="text-center text-sm text-gray-600">
            Don’t have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Sign up
            </button>
          </p>
        </form>
      </motion.div>
      <ToastContainer />
    </div>
  );
}