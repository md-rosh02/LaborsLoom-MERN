import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, UserPlus, Briefcase, HardHat, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../components/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('labor');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false); // Added for password visibility toggle

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match', { position: 'top-right' });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;

      await setDoc(doc(db, 'Users', uid), {
        uid,
        email: user.email,
        fname: name.trim(),
        role: accountType,
      });

      toast.success('User successfully registered!', { position: 'top-right', autoClose: 2000 });

      await signOut(auth);
      navigate('/login');
    } catch (error) {
      setError(error.message.includes('email-already-in-use') ? 'Email already in use' : 'Error creating account');
      toast.error(error.message.includes('email-already-in-use') ? 'Email already in use' : error.message, {
        position: 'top-right',
      });
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-20">
      <motion.div
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-6">
          <UserPlus className="mx-auto h-10 w-10 text-indigo-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join us today and get started</p>
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
          {/* Account Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                type="button"
                onClick={() => setAccountType('labor')}
                className={`py-2 px-4 rounded-lg border ${
                  accountType === 'labor'
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50'
                } transition-colors duration-200`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HardHat className="h-4 w-4 inline mr-2" /> Labor
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setAccountType('contractor')}
                className={`py-2 px-4 rounded-lg border ${
                  accountType === 'contractor'
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50'
                } transition-colors duration-200`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Briefcase className="h-4 w-4 inline mr-2" /> Contractor
              </motion.button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 transition-colors duration-200"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 transition-colors duration-200"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                required
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 transition-colors duration-200"
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
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  passwordStrength === 0
                    ? 'bg-red-500'
                    : passwordStrength === 1
                    ? 'bg-yellow-500'
                    : passwordStrength === 2
                    ? 'bg-yellow-300'
                    : passwordStrength === 3
                    ? 'bg-green-400'
                    : 'bg-green-600'
                }`}
                style={{ width: `${(passwordStrength / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 transition-colors duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-400"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500 hover:underline transition-colors duration-200">
                Terms and Conditions
              </a>
            </label>
          </div>

          <motion.button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create {accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account
          </motion.button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-indigo-600 hover:text-indigo-500 hover:underline transition-colors duration-200"
            >
              Sign in
            </button>
          </p>
        </form>
      </motion.div>
      <ToastContainer />
    </div>
  );
}